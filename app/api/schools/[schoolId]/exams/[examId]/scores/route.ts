import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { 
  assessments, 
  assessmentResults, 
  examPercentageConfigs,
  schools, 
  students,
  termResults,
  classEnrollments
} from "@/lib/schema";
import { and, eq, inArray, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { 
  convertScore, 
  getGhanaianGrade,
  calculateClassStatistics, 
  calculateStudentPosition 
} from "@/lib/exam-utils";

// GET: Fetch student scores for a specific exam
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; examId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId, examId } = await params;
    
    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the exam details
    const exam = await db.query.assessments.findFirst({
      where: (assessments, { and, eq }) => 
        and(eq(assessments.id, examId), eq(assessments.schoolId, schoolId)),
      with: {
        percentageConfig: true,
        subject: true,
        class: true
      }
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Fetch all students in the class
    const classEnrollment = await db.query.classEnrollments.findMany({
      where: (enrollments, { eq }) => eq(enrollments.classId, exam.classId),
      with: {
        student: true
      }
    });

    const studentIds = classEnrollment.map(enrollment => enrollment.studentId);

    // Fetch all results for this exam
    const results = await db.query.assessmentResults.findMany({
      where: (results, { and, eq, inArray }) => 
        and(
          eq(results.assessmentId, examId),
          inArray(results.studentId, studentIds)
        ),
      orderBy: (results, { desc }) => [desc(results.score)]
    });

    // Create a map of student IDs to results
    const resultsByStudent: Record<string, any> = {};
    
    for (const result of results) {
      resultsByStudent[result.studentId] = result;
    }

    // Create a list of student scores for statistics
    const scores = results.map(result => result.score);
    
    // Calculate class statistics
    const stats = calculateClassStatistics(scores);

    // Create a response with all students and their scores
    const studentScores = classEnrollment.map(enrollment => {
      const student = enrollment.student;
      const result = resultsByStudent[student.id];
      
      // Calculate student position if result exists
      let position = "";
      if (result) {
        position = calculateStudentPosition(result.score, scores);
      }
      
      // Build student name
      const studentName = [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(' ');

      return {
        studentId: student.id,
        studentNumber: student.studentId,
        name: studentName,
        score: result ? result.score : null,
        convertedScore: result ? result.convertedScore : null,
        totalMarks: exam.totalMarks,
        grade: result ? result.grade : null,
        remark: result ? result.remark : null,
        position,
        submitted: !!result
      };
    });

    return NextResponse.json({
      exam,
      students: studentScores,
      statistics: stats
    });
  } catch (error) {
    console.error("[EXAM_SCORES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Record and update scores for multiple students at once
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; examId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId, examId } = await params;
    
    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the exam details
    const exam = await db.query.assessments.findFirst({
      where: (assessments, { and, eq }) => 
        and(eq(assessments.id, examId), eq(assessments.schoolId, schoolId)),
      with: {
        percentageConfig: true
      }
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Parse request body - array of student scores
    const body = await req.json();
    const { scores } = body;

    if (!Array.isArray(scores)) {
      return NextResponse.json(
        { error: "Scores must be an array" },
        { status: 400 }
      );
    }

    // Get configuration for percentage calculation
    const percentageConfig = exam.percentageConfig || await db.query.examPercentageConfigs.findFirst({
      where: (configs, { and, eq }) => 
        and(eq(configs.schoolId, schoolId), eq(configs.isDefault, true)),
    });

    if (!percentageConfig) {
      return NextResponse.json(
        { error: "No percentage configuration found" },
        { status: 400 }
      );
    }

    // Validate student IDs
    const studentIds = scores.map(score => score.studentId);
    
    const validStudents = await db.query.students.findMany({
      where: (students, { and, inArray, eq }) => 
        and(
          inArray(students.id, studentIds),
          eq(students.schoolId, schoolId)
        ),
    });

    const validStudentIds = validStudents.map(student => student.id);
    
    // Process each student's score
    const resultsToCreate = [];
    const resultsToUpdate = [];
    const processedResults = [];

    for (const scoreData of scores) {
      const { studentId, score } = scoreData;
      
      // Skip if student ID is not valid
      if (!validStudentIds.includes(studentId)) {
        continue;
      }
      
      // Validate score
      if (typeof score !== 'number' || score < 0 || score > exam.totalMarks) {
        continue;
      }

      // Calculate converted score based on exam category
      let convertedScore = score;
      
      if (exam.category === 'continuous_assessment') {
        // If it's a continuous assessment, convert to continuous assessment percentage
        convertedScore = convertScore(
          score, 
          exam.totalMarks, 
          exam.percentageConfigId 
            ? percentageConfig.continuousAssessmentPercent 
            : 30
        );
      } else if (exam.category === 'final_exam') {
        // If it's a final exam, convert to exam percentage
        convertedScore = convertScore(
          score, 
          exam.totalMarks, 
          exam.percentageConfigId 
            ? percentageConfig.examPercent 
            : 70
        );
      }
      
      // Get grade information
      const gradeInfo = getGhanaianGrade(Math.round((score / exam.totalMarks) * 100));
      
      // Check if result already exists
      const existingResult = await db.query.assessmentResults.findFirst({
        where: (results, { and, eq }) => 
          and(
            eq(results.assessmentId, examId),
            eq(results.studentId, studentId)
          ),
      });

      if (existingResult) {
        // Update existing result
        resultsToUpdate.push({
          id: existingResult.id,
          score,
          convertedScore,
          grade: gradeInfo.grade,
          remark: gradeInfo.remark,
          recordedBy: session.user.id,
          updatedAt: new Date()
        });
      } else {
        // Create new result
        resultsToCreate.push({
          id: createId(),
          assessmentId: examId,
          studentId,
          score,
          convertedScore,
          grade: gradeInfo.grade,
          remark: gradeInfo.remark,
          recordedBy: session.user.id
        });
      }
      
      processedResults.push({
        studentId,
        score,
        convertedScore,
        grade: gradeInfo.grade,
        remark: gradeInfo.remark
      });
    }

    // Bulk create and update operations
    if (resultsToCreate.length > 0) {
      await db.insert(assessmentResults).values(resultsToCreate);
    }
    
    for (const result of resultsToUpdate) {
      const { id, ...updateData } = result;
      await db.update(assessmentResults)
        .set(updateData)
        .where(eq(assessmentResults.id, id));
    }

    // Update exam status if all students in the class have been graded
    const classEnrollmentsCount = await db.query.classEnrollments.findMany({
      where: (enrollments, { eq }) => eq(enrollments.classId, exam.classId),
    });
    
    const resultsCount = await db.query.assessmentResults.findMany({
      where: (results, { eq }) => eq(results.assessmentId, examId),
    });
    
    if (resultsCount.length >= classEnrollmentsCount.length) {
      await db.update(assessments)
        .set({ 
          gradingComplete: true,
          updatedAt: new Date()
        })
        .where(eq(assessments.id, examId));
    }

    // If this is an end-of-term exam, update or create term results for each student
    if (exam.category === 'final_exam') {
      await updateTermResults(schoolId, exam, processedResults);
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedResults.length,
      results: processedResults
    });
  } catch (error) {
    console.error("[EXAM_SCORES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to update term results
async function updateTermResults(schoolId: string, exam: any, processedResults: any[]) {
  try {
    for (const result of processedResults) {
      // Find all continuous assessments for this student, subject, and term
      const caAssessments = await db.query.assessments.findMany({
        where: (assessments, { and, eq }) => 
          and(
            eq(assessments.schoolId, schoolId),
            eq(assessments.classId, exam.classId),
            eq(assessments.subjectId, exam.subjectId),
            eq(assessments.term, exam.term),
            eq(assessments.academicYear, exam.academicYear),
            eq(assessments.category, 'continuous_assessment')
          ),
      });
      
      const caAssessmentIds = caAssessments.map(assessment => assessment.id);
      
      // Find all CA results for this student
      const caResults = await db.query.assessmentResults.findMany({
        where: (results, { and, eq, inArray }) => 
          and(
            eq(results.studentId, result.studentId),
            inArray(results.assessmentId, caAssessmentIds)
          ),
      });
      
      // Calculate combined CA score
      let totalCAScore = 0;
      for (const caResult of caResults) {
        totalCAScore += caResult.convertedScore || 0;
      }
      
      // Calculate total score (CA + Exam)
      const totalScore = totalCAScore + (result.convertedScore || 0);
      
      // Get grade information based on total score
      const gradeInfo = getGhanaianGrade(totalScore);
      
      // Check if term result already exists
      const existingTermResult = await db.query.termResults.findFirst({
        where: (termResults, { and, eq }) => 
          and(
            eq(termResults.studentId, result.studentId),
            eq(termResults.subjectId, exam.subjectId),
            eq(termResults.term, exam.term),
            eq(termResults.academicYear, exam.academicYear)
          ),
      });
      
      if (existingTermResult) {
        // Update existing term result
        await db.update(termResults)
          .set({
            continuousAssessmentScore: totalCAScore,
            examScore: result.convertedScore || 0,
            totalScore,
            grade: gradeInfo.grade,
            remark: gradeInfo.remark,
            updatedAt: new Date()
          })
          .where(eq(termResults.id, existingTermResult.id));
      } else {
        // Create new term result
        await db.insert(termResults).values({
          id: createId(),
          studentId: result.studentId,
          classId: exam.classId,
          subjectId: exam.subjectId,
          schoolId,
          academicYear: exam.academicYear,
          term: exam.term,
          continuousAssessmentScore: totalCAScore,
          examScore: result.convertedScore || 0,
          totalScore,
          grade: gradeInfo.grade,
          remark: gradeInfo.remark,
          percentageConfigId: exam.percentageConfigId
        });
      }
    }
    
    // Calculate and update positions for all students in this subject, term, and year
    const allTermResults = await db.query.termResults.findMany({
      where: (termResults, { and, eq }) => 
        and(
          eq(termResults.subjectId, exam.subjectId),
          eq(termResults.classId, exam.classId),
          eq(termResults.term, exam.term),
          eq(termResults.academicYear, exam.academicYear)
        ),
      orderBy: (termResults, { desc }) => [desc(termResults.totalScore)]
    });
    
    // Update position for each student
    for (let i = 0; i < allTermResults.length; i++) {
      await db.update(termResults)
        .set({ position: i + 1 })
        .where(eq(termResults.id, allTermResults[i].id));
    }
    
  } catch (error) {
    console.error("[UPDATE_TERM_RESULTS]", error);
    throw error;
  }
} 