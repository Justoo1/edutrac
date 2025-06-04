// lib/services/terminalReportService.ts

import db from "@/lib/db";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { 
  students, 
  classes, 
  subjects, 
  examConfigurations,
  exams,
  examScores,
  examStudents,
  academicYears,
  academicTerms,
  termReports,
  termReportDetails,
  gradeSystem,
  classEnrollments
} from "@/lib/schema";
import { SelectGrade, SelectExam, SelectExamScore } from "@/lib/schema";

interface StudentSubjectResults {
  studentId: string;
  subjectId: string;
  classScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
  subjectName: string;
}

interface ExamScoreData {
  examId: string;
  studentId: string;
  rawScore: number;
  examType: string;
  category: string;
  weight: number;
  totalMarks: number;
}

/**
 * Generates terminal reports for a class in a specific academic term
 */
export async function generateTerminalReports(
  schoolId: string,
  classId: string,
  academicYearId: string,
  academicTermId: string
): Promise<{ success: boolean; message: string }> {
  // Use a transaction for the entire process
  try {
    return await db.transaction(async (tx) => {
      try {
        console.log(`Starting terminal report generation for class ${classId}, term ${academicTermId}, year ${academicYearId}`);

        // 1. Get class details and enrolled students
        const classDetails = await tx.query.classes.findFirst({
          where: eq(classes.id, classId),
        });

        if (!classDetails) {
          throw new Error(`Class with ID ${classId} not found`);
        }

        const enrollments = await tx.query.classEnrollments.findMany({
          where: and(
            eq(classEnrollments.classId, classId),
            eq(classEnrollments.status, "active")
          ),
          with: {
            student: true
          }
        });

        console.log(`Found ${enrollments.length} active students in class ${classId}`);

        if (enrollments.length === 0) {
          console.log(`No active students enrolled in class ${classId}`);
          return { success: true, message: "No students to process" };
        }

        // 2. Get academic year and term details
        const academicYear = await tx.query.academicYears.findFirst({
          where: eq(academicYears.id, academicYearId)
        });
        
        const academicTerm = await tx.query.academicTerms.findFirst({
          where: eq(academicTerms.id, academicTermId)
        });
        
        if (!academicYear || !academicTerm) {
          throw new Error(`Academic year or term not found`);
        }

        // 3. Get subjects for this class
        const classSubjects = await tx.query.subjects.findMany({
          where: eq(subjects.schoolId, schoolId)
        });

        if (classSubjects.length === 0) {
          throw new Error(`No subjects found for class ${classId}`);
        }

        console.log(`Found ${classSubjects.length} subjects for class ${classId}`);

        // 4. Get the exam configuration (class score vs exam score weights)
        const examConfig = await tx.query.examConfigurations.findFirst({
          where: eq(examConfigurations.school_id, schoolId)
        });

        if (!examConfig) {
          throw new Error(`No exam configuration found for school ${schoolId}`);
        }

        const classScoreWeight = examConfig.class_score_weight;
        const examScoreWeight = examConfig.exam_score_weight;

        // 5. Get grading system
        const grades = await tx.query.gradeSystem.findMany({
          where: eq(gradeSystem.schoolId, schoolId),
          orderBy: [asc(gradeSystem.minScore)]
        });

        if (grades.length === 0) {
          throw new Error(`No grading system defined for school ${schoolId}`);
        }

        // 6. Get all exams for this class, academic year, and term
        const examsForClass = await tx.query.exams.findMany({
          where: and(
            eq(exams.classId, classId), 
            eq(exams.academicYear, academicYearId),
            eq(exams.term, academicTermId)
          ),
        });

        console.log(`Found ${examsForClass.length} exams for class ${classId}`);

        if (examsForClass.length === 0) {
          throw new Error(`No exams found for class ${classId} in this academic period`);
        }

        // Process each student
        console.log(`Processing ${enrollments.length} students`);
        for (const enrollment of enrollments) {
          const student = enrollment.student;
          console.log(`Processing student: ${student.firstName} ${student.lastName} (${student.id})`);
          
          // Track student results across all subjects
          const studentResults: StudentSubjectResults[] = [];
          
          // Process each subject
          for (const subject of classSubjects) {
            console.log(`Processing subject ${subject.name} for student ${student.id}`);
            
            // Get exams for this subject
            const subjectExams = examsForClass.filter(exam => exam.subjectId === subject.id);
            
            if (subjectExams.length === 0) {
              console.log(`No exams found for subject ${subject.name}, skipping`);
              continue; // Skip to next subject
            }
            
            // Get all the student's scores for this subject's exams
            const examScoreData = await getStudentExamScores(tx, student.id, subjectExams);
            
            if (examScoreData.length === 0) {
              console.log(`No exam scores found for student ${student.id} in subject ${subject.name}, skipping`);
              continue; // Skip to next subject
            }
            
            console.log(`Found ${examScoreData.length} scores for student ${student.id} in subject ${subject.name}`);
            
            // Calculate class score and exam score using the appropriate weights
            const { classScore, examScore } = calculateScores(
              examScoreData,
              classScoreWeight!,
              examScoreWeight!
            );
            
            console.log(`Calculated scores for student ${student.id} in subject ${subject.name}: class=${classScore}, exam=${examScore}`);
            
            // Calculate total score (sum of class score and exam score)
            const totalScore = parseFloat((classScore + examScore).toFixed(1));
            
            // Get grade information
            const gradeInfo = getGrade(totalScore, grades);
            
            if (!gradeInfo) {
              console.warn(`Could not determine grade for score ${totalScore}, skipping subject`);
              continue;
            }
            
            console.log(`Determined grade for student ${student.id} in subject ${subject.name}: ${gradeInfo.gradeName}`);
            
            // Add to student's results
            studentResults.push({
              studentId: student.id,
              subjectId: subject.id,
              classScore,
              examScore,
              totalScore,
              grade: gradeInfo.gradeName,
              remark: gradeInfo.interpretation || "",
              subjectName: subject.name
            });
            
            // Create or update term report detail for this subject
            await createOrUpdateTermReportDetail(
              tx,
              student.id,
              subject.id,
              academicYearId,
              academicTermId,
              classScore,
              examScore,
              totalScore,
              gradeInfo.id
            );
          }
          
          // Create overall term report for the student
          if (studentResults.length > 0) {
            const averageScore = calculateAverageScore(studentResults);
            console.log(`Calculated average score for student ${student.id}: ${averageScore} across ${studentResults.length} subjects`);
            
            await createOrUpdateTermReport(
              tx, 
              student.id, 
              academicYearId,
              academicTermId,
              studentResults.length,
              averageScore
            );
          } else {
            console.log(`No results to process for student ${student.id}, skipping term report creation`);
          }
        }
        
        // Calculate positions after all scores are saved
        console.log(`Calculating positions for class ${classId}`);
        await calculateAndUpdatePositions(tx, classId, academicYearId, academicTermId);
        
        console.log(`Successfully generated terminal reports for class ${classId}`);
        return { 
          success: true, 
          message: `Successfully generated terminal reports for ${enrollments.length} students in class ${classDetails.name}` 
        };
      } catch (error) {
        console.error("Error generating terminal reports:", error);
        throw error; // Rethrow to roll back the transaction
      }
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
}

/**
 * Retrieves all exam scores for a student across multiple exams
 */
async function getStudentExamScores(
  tx: any, // Transaction object
  studentId: string,
  exams: SelectExam[]
): Promise<ExamScoreData[]> {
  const examScoreData: ExamScoreData[] = [];
  
  // Get exam IDs
  const examIds = exams.map(exam => exam.id);
  
  if (examIds.length === 0) {
    console.log(`No exams found for student ${studentId}`);
    return [];
  }
  
  try {
    console.log(`Looking for scores for student ${studentId} in exams:`, examIds);
    
    // Use the correct approach for the IN query
    const scores = await tx.query.examScores.findMany({
      where: and(
        eq(examScores.studentId, studentId),
        inArray(examScores.examId, examIds)
      )
    });
    
    console.log(`Found ${scores.length} scores for student ${studentId}`);
    
    // Add extra logging for debugging
    if (scores.length > 0) {
      console.log(`Example score data: ${JSON.stringify(scores[0])}`);
    } else {
      // Direct check to see if any scores exist
      const checkQuery = await tx.execute(
        `SELECT COUNT(*) FROM exam_scores WHERE student_id = $1`,
        [studentId]
      );
      console.log(`Direct count of scores for student: ${JSON.stringify(checkQuery)}`);
    }
    
    // Map scores to more detailed structure with exam info
    for (const score of scores) {
      const exam = exams.find(e => e.id === score.examId);
      if (!exam) {
        console.log(`No matching exam found for score with examId ${score.examId}`);
        continue;
      }
      
      // Log the successful match
      console.log(`Matched score with examId ${score.examId} to exam ${exam.name}`);
      
      examScoreData.push({
        examId: exam.id,
        studentId,
        rawScore: parseFloat(score.rawScore.toString()),
        examType: exam.examType,
        // Determine category based on exam type with more flexible matching
        category: (() => {
          const type = exam.examType.toLowerCase();
          if (type.includes("end of term") || type.includes("final") || type.includes("terminal")) {
            return "final_exam";
          } else {
            return "continuous_assessment";
          }
        })(),
        weight: 1, // Default weight if not specified
        totalMarks: exam.totalMarks
      });
    }
    
    console.log(`Processed ${examScoreData.length} exam scores for student ${studentId}`);
    return examScoreData;
  } catch (error) {
    console.error(`Error fetching exam scores for student ${studentId}:`, error);
    console.error(`Error details:`, error instanceof Error ? error.message : 'Unknown error');
    console.error(`Exam IDs being queried:`, examIds);
    throw error; // Rethrow to be caught by the transaction
  }
}

/**
 * Calculates class score and exam score based on assessment data and weights
 * Uses the formula: Converted Score = (Student's Score / Total Score) × New Total
 */
function calculateScores(
  examScoreData: ExamScoreData[],
  classScoreWeight: number,
  examScoreWeight: number
): { classScore: number, examScore: number } {
  console.log(`Calculating scores with data:`, examScoreData);
  console.log(`Class weight: ${classScoreWeight}, Exam weight: ${examScoreWeight}`);
  
  // Filter by category with more flexible matching
  const classAssessments = examScoreData.filter(e => {
    const type = e.examType.toLowerCase();
    const isFinalExam = type.includes("end of term") || type.includes("final") || type.includes("terminal");
    return !isFinalExam; // If it's not a final exam, consider it continuous assessment
  });
  
  const finalExams = examScoreData.filter(e => {
    const type = e.examType.toLowerCase();
    return type.includes("end of term") || type.includes("final") || type.includes("terminal");
  });
  
  console.log(`Class assessments (${classAssessments.length}):`, classAssessments);
  console.log(`Final exams (${finalExams.length}):`, finalExams);
  
  // Calculate class score
  let classScore = 0;
  if (classAssessments.length > 0) {
    let totalRawScore = 0;
    let totalPossibleScore = 0;
    
    for (const assessment of classAssessments) {
      totalRawScore += assessment.rawScore;
      totalPossibleScore += assessment.totalMarks;
    }
    
    if (totalPossibleScore > 0) {
      // Apply the conversion formula: (Student's Score / Total Score) × New Total
      const convertedScore = (totalRawScore / totalPossibleScore) * classScoreWeight;
      
      // If the converted score is less than the maximum class score weight, use it as is
      // Otherwise, cap it at the maximum class score weight
      classScore = Math.min(convertedScore, classScoreWeight);
    }
    console.log(`Class score calculation: ${totalRawScore}/${totalPossibleScore} × ${classScoreWeight} = ${classScore}`);
  } else {
    console.log("No class assessments found");
  }
  
  // Calculate exam score
  let examScore = 0;
  if (finalExams.length > 0) {
    let totalRawScore = 0;
    let totalPossibleScore = 0;
    
    for (const exam of finalExams) {
      totalRawScore += exam.rawScore;
      totalPossibleScore += exam.totalMarks;
    }
    
    if (totalPossibleScore > 0) {
      // Apply the conversion formula: (Student's Score / Total Score) × New Total
      const convertedScore = (totalRawScore / totalPossibleScore) * examScoreWeight;
      
      // If the converted score is less than the maximum exam score weight, use it as is
      // Otherwise, cap it at the maximum exam score weight
      examScore = Math.min(convertedScore, examScoreWeight);
    }
    console.log(`Exam score calculation: ${totalRawScore}/${totalPossibleScore} × ${examScoreWeight} = ${examScore}`);
  } else {
    console.log("No final exams found");
  }
  
  // Round to 1 decimal place
  const result = {
    classScore: parseFloat(classScore.toFixed(1)),
    examScore: parseFloat(examScore.toFixed(1))
  };
  
  console.log(`Final calculated scores:`, result);
  return result;
}

/**
 * Determines the grade for a given score
 */
function getGrade(
  totalScore: number,
  grades: SelectGrade[]
): SelectGrade | null {
  for (const grade of grades) {
    if (totalScore >= grade.minScore && totalScore <= grade.maxScore) {
      return grade;
    }
  }
  return null;
}

/**
 * Creates or updates a term report detail record
 */
async function createOrUpdateTermReportDetail(
  tx: any, // Transaction object
  studentId: string,
  subjectId: string,
  academicYearId: string,
  academicTermId: string,
  classScore: number,
  examScore: number,
  totalScore: number,
  gradeId: number
): Promise<void> {
  try {
    console.log(`Creating/updating term report detail for student ${studentId}, subject ${subjectId}`);
    
    // Check if a term report exists for this student and academic period
    const termReport = await tx.query.termReports.findFirst({
      where: and(
        eq(termReports.studentId, studentId),
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId)
      )
    });
    
    let termReportId: string;
    
    if (termReport) {
      console.log(`Found existing term report with ID ${termReport.id}`);
      termReportId = termReport.id;
    } else {
      // Create a new term report
      console.log(`Creating new term report for student ${studentId}`);
      const [newReport] = await tx
        .insert(termReports)
        .values({
          studentId,
          academicYearId,
          academicTermId,
          totalMarks: 0, // Will be updated later
          averageScore: 0, // Will be updated later
          rank: "",
          remarks: ""
        })
        .returning({ id: termReports.id });
      
      if (!newReport || !newReport.id) {
        throw new Error(`Failed to create term report for student ${studentId}`);
      }
      
      console.log(`Created new term report with ID ${newReport.id}`);
      termReportId = newReport.id;
    }
    
    // Now check if a term report detail exists for this subject
    const existingDetail = await tx.query.termReportDetails.findFirst({
      where: and(
        eq(termReportDetails.termReportId, termReportId),
        eq(termReportDetails.subjectId, subjectId)
      )
    });
    
    if (existingDetail) {
      // Update existing detail
      console.log(`Updating existing term report detail with ID ${existingDetail.id}`);
      await tx
        .update(termReportDetails)
        .set({
          classScore: classScore.toString(),
          examScore: examScore.toString(),
          totalScore: totalScore.toString(),
          gradeId,
          updatedAt: new Date()
        })
        .where(eq(termReportDetails.id, existingDetail.id));
      
      console.log(`Updated term report detail with ID ${existingDetail.id}`);
    } else {
      // Create new term report detail
      console.log(`Creating new term report detail for subject ${subjectId}`);
      const [newDetail] = await tx
        .insert(termReportDetails)
        .values({
          termReportId,
          subjectId,
          classScore: classScore.toString(),
          examScore: examScore.toString(),
          totalScore: totalScore.toString(),
          gradeId
        })
        .returning({ id: termReportDetails.id });
      
      if (!newDetail || !newDetail.id) {
        throw new Error(`Failed to create term report detail for subject ${subjectId}`);
      }
      
      console.log(`Created new term report detail with ID ${newDetail.id}`);
    }
  } catch (error) {
    console.error("Error in createOrUpdateTermReportDetail:", error);
    throw error; // Rethrow to be caught by the transaction
  }
}

/**
 * Creates or updates an overall term report
 */
async function createOrUpdateTermReport(
  tx: any, // Transaction object
  studentId: string,
  academicYearId: string,
  academicTermId: string,
  subjectCount: number,
  averageScore: number
): Promise<void> {
  try {
    console.log(`Creating/updating term report for student ${studentId}`);
    
    // Calculate the total marks as the sum of all subject scores
    const termReportDetails = await tx.query.termReportDetails.findMany({
      where: sql`term_report_id IN (
        SELECT id FROM term_reports
        WHERE student_id = ${studentId}
        AND academic_year_id = ${academicYearId}
        AND academic_term_id = ${academicTermId}
      )`
    });
    
    // Sum up all the total scores
    const totalMarks = termReportDetails.reduce((sum: number, detail: any) => {
      return sum + parseFloat(detail.totalScore as string);
    }, 0);
    
    // Check if a term report exists
    const existingReport = await tx.query.termReports.findFirst({
      where: and(
        eq(termReports.studentId, studentId),
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId)
      )
    });
    
    if (existingReport) {
      // Update existing report
      console.log(`Updating existing term report with ID ${existingReport.id}`);
      await tx
        .update(termReports)
        .set({
          totalMarks: parseFloat(totalMarks.toFixed(1)), // Store the actual total marks
          averageScore,
          updatedAt: new Date()
        })
        .where(eq(termReports.id, existingReport.id));
      
      console.log(`Updated term report with ID ${existingReport.id}`);
    } else {
      // Create new report
      console.log(`Creating new term report for student ${studentId}`);
      const [newReport] = await tx
        .insert(termReports)
        .values({
          studentId,
          academicYearId,
          academicTermId,
          totalMarks: parseFloat(totalMarks.toFixed(1)),
          averageScore,
          rank: "", // Will be updated during position calculation
          remarks: "" // Will be updated during position calculation
        })
        .returning({ id: termReports.id });
      
      if (!newReport || !newReport.id) {
        throw new Error(`Failed to create term report for student ${studentId}`);
      }
      
      console.log(`Created new term report with ID ${newReport.id}`);
    }
  } catch (error) {
    console.error("Error in createOrUpdateTermReport:", error);
    throw error; // Rethrow to be caught by the transaction
  }
}

/**
 * Calculates the average score across all subjects
 */
function calculateAverageScore(results: StudentSubjectResults[]): number {
  if (results.length === 0) return 0;
  
  const totalScore = results.reduce((sum, result) => sum + result.totalScore, 0);
  // Round to 2 decimal places
  return parseFloat((totalScore / results.length).toFixed(2));
}

/**
 * Calculates and updates positions for class, subject, and overall rankings
 */
async function calculateAndUpdatePositions(
  tx: any, // Transaction object
  classId: string,
  academicYearId: string,
  academicTermId: string
): Promise<void> {
  try {
    console.log(`Starting position calculations for class ${classId}`);
    
    // 1. Calculate subject positions
    await calculateSubjectPositions(tx, classId, academicYearId, academicTermId);
    
    // 2. Calculate overall positions
    await calculateOverallPositions(tx, classId, academicYearId, academicTermId);
    
    console.log(`Completed all position calculations for class ${classId}`);
  } catch (error) {
    console.error("Error in calculateAndUpdatePositions:", error);
    throw error; // Rethrow to be caught by the transaction
  }
}

/**
 * Calculates and updates subject positions
 */
async function calculateSubjectPositions(
    tx: any, // Transaction object
    classId: string,
    academicYearId: string,
    academicTermId: string
  ): Promise<void> {
    try {
      console.log(`Calculating subject positions for class ${classId}`);
      
      // Query all term report details for this academic period
      const reportDetails = await tx.query.termReportDetails.findMany({
        where: sql`term_report_id IN (
          SELECT id FROM term_reports 
          WHERE academic_year_id = ${academicYearId} 
          AND academic_term_id = ${academicTermId}
          AND student_id IN (
            SELECT student_id FROM "classEnrollments" 
            WHERE "classId" = ${classId} AND status = 'active'
          )
        )`,
        with: {
          termReport: {
            with: {
              student: true
            }
          },
          subject: true
        }
      });
      
      console.log(`Found ${reportDetails.length} term report details to process`);
      
      // Group by subject
      const bySubject: Record<string, typeof reportDetails> = {};
      
      for (const detail of reportDetails) {
        const subjectId = detail.subjectId;
        if (!bySubject[subjectId]) {
          bySubject[subjectId] = [];
        }
        bySubject[subjectId].push(detail);
      }
      
      // Process each subject
      for (const [subjectId, details] of Object.entries(bySubject)) {
        console.log(`Processing positions for subject ${subjectId} with ${details.length} students`);
        
        // Sort by total score in descending order
        const sorted = [...details].sort((a, b) => 
          parseFloat(b.totalScore as string) - parseFloat(a.totalScore as string)
        );
        
        // Assign positions
        let currentPosition = 1;
        let currentScore: number | null = null;
        let samePositionCount = 0;
        
        for (let i = 0; i < sorted.length; i++) {
          const detail = sorted[i];
          const score = parseFloat(detail.totalScore as string);
          
          if (currentScore !== score) {
            // New position
            currentPosition = i + 1 - samePositionCount;
            currentScore = score;
            samePositionCount = 0;
          } else {
            // Same position (tie)
            samePositionCount++;
          }
          
          // Update both classPosition and position (they might be the same field)
          await tx
            .update(termReportDetails)
            .set({ 
              classPosition: currentPosition,
              position: currentPosition // Also update the 'position' field
            })
            .where(eq(termReportDetails.id, detail.id));
          
          console.log(`Updated position for student ${detail.termReport?.student?.firstName} ${detail.termReport?.student?.lastName} in subject ${detail.subject?.name} to ${currentPosition}`);
        }
        
        // Calculate and update batch positions if students have batch information
        await calculateBatchPositions(tx, subjectId, academicYearId, academicTermId, details);
        
        // Calculate and update course/program positions if applicable
        // This would be relevant for high schools with different programs or courses
        const courseIds: string[] = [];
        for (const detail of details) {
          const courseId = detail.termReport?.student?.courseId;
          if (courseId && typeof courseId === 'string') {
            courseIds.push(courseId);
          }
        }
        
        const uniqueCourseIds = [...new Set(courseIds)];
        if (uniqueCourseIds.length > 0) {
          await calculateSubjectCoursePositions(
            tx,
            subjectId, 
            academicYearId, 
            academicTermId, 
            uniqueCourseIds
          );
        }
      }
      
      console.log(`Successfully calculated and updated subject positions`);
    } catch (error) {
      console.error("Error in calculateSubjectPositions:", error);
      throw error; // Rethrow to be caught by the transaction
    }
  }
  
  /**
   * Helper function to calculate positions within a batch for a subject
   */
  async function calculateBatchPositions(
    tx: any,
    subjectId: string,
    academicYearId: string,
    academicTermId: string,
    details: any[]
  ): Promise<void> {
    try {
      console.log(`Calculating batch-specific positions for subject ${subjectId}`);
      
      // Get unique batch IDs from the details
      const batchIds: string[] = [];
      for (const detail of details) {
        const batchId = detail.termReport?.student?.batchId;
        if (batchId && typeof batchId === 'string') {
          batchIds.push(batchId);
        }
      }
      
      const uniqueBatchIds = [...new Set(batchIds)];
      
      // Process each batch
      for (const batchId of uniqueBatchIds) {
        // Get all term report details for students in this batch for this subject
        const batchDetails = await tx.query.termReportDetails.findMany({
          where: and(
            eq(termReportDetails.subjectId, subjectId),
            sql`term_report_id IN (
              SELECT id FROM term_reports 
              WHERE academic_year_id = ${academicYearId} 
              AND academic_term_id = ${academicTermId}
              AND student_id IN (
                SELECT student_id FROM "classEnrollments" 
                WHERE "batchId" = ${batchId} AND status = 'active'
              )
            )`
          ),
          with: {
            termReport: {
              with: {
                student: true
              }
            }
          }
        });
        
        if (batchDetails.length === 0) {
          continue;
        }
        
        console.log(`Processing ${batchDetails.length} students in batch ${batchId} for subject ${subjectId}`);
        
        // Sort by total score in descending order
        const sorted = [...batchDetails].sort((a, b) => 
          parseFloat(b.totalScore as string) - parseFloat(a.totalScore as string)
        );
        
        // Assign positions
        let currentPosition = 1;
        let currentScore: number | null = null;
        let samePositionCount = 0;
        
        for (let i = 0; i < sorted.length; i++) {
          const detail = sorted[i];
          const score = parseFloat(detail.totalScore as string);
          
          if (currentScore !== score) {
            // New position
            currentPosition = i + 1 - samePositionCount;
            currentScore = score;
            samePositionCount = 0;
          } else {
            // Same position (tie)
            samePositionCount++;
          }
          
          // Update the position
          await tx
            .update(termReportDetails)
            .set({ batchPosition: currentPosition })
            .where(eq(termReportDetails.id, detail.id));
          
          console.log(`Updated batch position for student ${detail.termReport?.student?.firstName} ${detail.termReport?.student?.lastName} in subject ${subjectId} to ${currentPosition}`);
        }
      }
    } catch (error) {
      console.error("Error in calculateBatchPositions:", error);
      throw error; // Rethrow to be caught by the transaction
    }
  }
  
  /**
   * Helper function to calculate positions within a course/program for a subject
   * This is primarily for high schools with different programs
   */
  async function calculateSubjectCoursePositions(
    tx: any,
    subjectId: string,
    academicYearId: string,
    academicTermId: string,
    courseIds: string[]
  ): Promise<void> {
    try {
      console.log(`Calculating course-specific positions for subject ${subjectId}`);
      
      // Process each course
      for (const courseId of courseIds) {
        // Get all term report details for students in this course for this subject
        const courseDetails = await tx.query.termReportDetails.findMany({
          where: and(
            eq(termReportDetails.subjectId, subjectId),
            sql`term_report_id IN (
              SELECT id FROM term_reports 
              WHERE academic_year_id = ${academicYearId} 
              AND academic_term_id = ${academicTermId}
              AND student_id IN (
                SELECT student_id FROM "studentCourses" 
                WHERE "courseId" = ${courseId} AND status = 'active'
              )
            )`
          ),
          with: {
            termReport: {
              with: {
                student: true
              }
            }
          }
        });
        
        if (courseDetails.length === 0) {
          continue;
        }
        
        console.log(`Processing ${courseDetails.length} students in course ${courseId} for subject ${subjectId}`);
        
        // Sort by total score in descending order
        const sorted = [...courseDetails].sort((a, b) => 
          parseFloat(b.totalScore as string) - parseFloat(a.totalScore as string)
        );
        
        // Assign positions
        let currentPosition = 1;
        let currentScore: number | null = null;
        let samePositionCount = 0;
        
        for (let i = 0; i < sorted.length; i++) {
          const detail = sorted[i];
          const score = parseFloat(detail.totalScore as string);
          
          if (currentScore !== score) {
            // New position
            currentPosition = i + 1 - samePositionCount;
            currentScore = score;
            samePositionCount = 0;
          } else {
            // Same position (tie)
            samePositionCount++;
          }
          
          // Update the position
          await tx
            .update(termReportDetails)
            .set({ coursePosition: currentPosition })
            .where(eq(termReportDetails.id, detail.id));
          
          console.log(`Updated course position for student ${detail.termReport?.student?.firstName} ${detail.termReport?.student?.lastName} in subject ${subjectId} to ${currentPosition}`);
        }
      }
    } catch (error) {
      console.error("Error in calculateSubjectCoursePositions:", error);
      throw error; // Rethrow to be caught by the transaction
    }
  }

/**
 * Calculates and updates overall positions based on average scores
 */
async function calculateOverallPositions(
  tx: any, // Transaction object
  classId: string,
  academicYearId: string,
  academicTermId: string
): Promise<void> {
  try {
    console.log(`Calculating overall positions for class ${classId}`);
    
    // Get all term reports for the class
    const termReportResults = await tx.query.termReports.findMany({
      where: and(
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId),
        sql`student_id IN (
          SELECT student_id FROM "classEnrollments" 
          WHERE "classId" = ${classId} AND status = 'active'
        )`
      ),
      with: {
        student: true
      }
    });
    
    console.log(`Found ${termReportResults.length} term reports for overall position calculation`);
    
    if (termReportResults.length === 0) {
      console.log(`No term reports found for overall position calculation`);
      return;
    }
    
    // Sort by average score in descending order
    const sorted = [...termReportResults].sort((a, b) => 
      b.averageScore - a.averageScore
    );
    
    // Assign overall positions
    let currentPosition = 1;
    let currentScore: number | null = null;
    let samePositionCount = 0;
    
    for (let i = 0; i < sorted.length; i++) {
      const report = sorted[i];
      const score = report.averageScore;
      
      if (currentScore !== score) {
        // New position
        currentPosition = i + 1 - samePositionCount;
        currentScore = score;
        samePositionCount = 0;
      } else {
        // Same position (tie)
        samePositionCount++;
      }
      
      // Create position string (e.g., "1st", "2nd", "3rd", "4th")
      let positionString: string;
      if (currentPosition === 1) {
        positionString = "1st";
      } else if (currentPosition === 2) {
        positionString = "2nd";
      } else if (currentPosition === 3) {
        positionString = "3rd";
      } else {
        positionString = `${currentPosition}th`;
      }
      
      // Create remarks based on position
      let remarks = "";
      if (currentPosition === 1) {
        remarks = "Excellent work! Keep it up!";
      } else if (currentPosition <= 3) {
        remarks = "Great performance! Aim for the top!";
      } else if (currentPosition <= Math.ceil(sorted.length / 2)) {
        remarks = "Good work! Keep improving!";
      } else {
        remarks = "Keep trying! You can do better!";
      }
      
      // Update the term report with position and remarks
      await tx
        .update(termReports)
        .set({ 
          rank: positionString, 
          remarks,
          updatedAt: new Date()
        })
        .where(eq(termReports.id, report.id));
      
      console.log(`Updated overall position for student ${report.student.firstName} ${report.student.lastName} to ${positionString}`);
    }
    
    console.log(`Successfully calculated and updated overall positions for class ${classId}`);
  } catch (error) {
    console.error("Error in calculateOverallPositions:", error);
    throw error; // Rethrow to be caught by the transaction
  }
}