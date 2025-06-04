import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { 
  termReports, 
  termReportDetails, 
  students,
  classEnrollments,
  subjects,
  assessments,
  assessmentResults,
  gradeSystem,
  examTypes
} from '@/lib/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getSession();
    
    if (!session) {
      console.log("User not authenticated");
      return NextResponse.json({ success: false, message: 'Not authenticated' }, {status: 401});
    }
    
    // Check authorization
    if (session.user.role !== 'admin' && session.user.role !== 'teacher') {
      console.log(`User ${session.user.id} with role ${session.user.role} not authorized`);
      return NextResponse.json({ success: false, message: 'Not authorized' }, {status: 403});
    }
    
    // Get parameters from request body
    const body = await req.json();
    const { 
      schoolId, 
      classId, 
      academicYearId, 
      academicTermId,
      options = {}
    } = body;
    
    console.log(`Updating term reports for school: ${schoolId}, class: ${classId}, year: ${academicYearId}, term: ${academicTermId}`);
    
    // Validate required parameters
    if (!schoolId || !classId || !academicYearId || !academicTermId) {
      console.log("Missing required parameters");
      return NextResponse.json({ 
        success: false, 
        message: 'Required parameters missing. Please provide schoolId, classId, academicYearId, and academicTermId' 
      }, {status: 400});
    }
    
    // Get all students in the class
    const enrollments = await db.query.classEnrollments.findMany({
      where: and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.status, "active")
      ),
      with: {
        student: true
      }
    });
    
    if (enrollments.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No active students found in this class"
      }, {status: 404});
    }
    
    // Get all subjects for the class
    const classSubjects = await db.query.subjects.findMany({
      where: schoolId ? eq(subjects.schoolId, schoolId) : undefined
    });
    
    if (classSubjects.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No subjects found for this class"
      }, {status: 404});
    }
    
    // Get the grading system
    const grades = await db.query.gradeSystem.findMany({
      where: schoolId ? eq(gradeSystem.schoolId, schoolId) : undefined
    });
    
    let updatedCount = 0;
    const updatedReports = [];
    
    // Process each student
    for (const enrollment of enrollments) {
      const student = enrollment.student;
      
      console.log(`Processing student ${student.firstName} ${student.lastName} (${student.id})`);
      
      // Check if a term report already exists for this student
      let termReport = await db.query.termReports.findFirst({
        where: and(
          eq(termReports.studentId, student.id),
          eq(termReports.academicYearId, academicYearId),
          eq(termReports.academicTermId, academicTermId)
        )
      });
      
      console.log(`- Term report exists: ${!!termReport}`);
      
      // Create a term report if it doesn't exist
      if (!termReport) {
        const newTermReportId = createId();
        console.log(`- Creating new term report with ID: ${newTermReportId}`);
        
        try {
          await db.insert(termReports).values({
            id: newTermReportId,
            student_id: student.id,
            academic_year_id: academicYearId,
            academic_term_id: academicTermId,
            total_marks: 0,
            average_score: 0,
            rank: 'N/A',
            created_at: new Date(),
            updated_at: new Date()
          });
          
          console.log(`- Term report created successfully`);
          
          // Fetch the newly created report
          termReport = await db.query.termReports.findFirst({
            where: eq(termReports.id, newTermReportId)
          });
          
          if (!termReport) {
            console.error(`- Failed to fetch the newly created term report`);
            continue; // Skip to the next student
          }
        } catch (error) {
          console.error(`- Error creating term report:`, error);
          continue; // Skip to the next student
        }
      }
      
      // After the term report is created, ensure every subject has a detail record
      const allDetailRecords = await db.query.termReportDetails.findMany({
        where: eq(termReportDetails.termReportId, termReport.id)
      });
      
      const existingSubjectIds = allDetailRecords.map(detail => detail.subjectId);
      
      console.log(`- Found ${allDetailRecords.length} existing detail records for term report ${termReport.id}`);
      
      // Find subjects that don't have details yet
      const missingSubjects = classSubjects.filter(subject => 
        !existingSubjectIds.includes(subject.id)
      );
      
      console.log(`- Found ${missingSubjects.length} subjects without detail records`);
      
      // Create details for missing subjects - use a transaction to ensure all details are created
      try {
        console.log(`  - Creating ${missingSubjects.length} missing detail records in a single transaction`);
        
        // Prepare all the values to insert
        const detailValues = missingSubjects.map(subject => ({
          id: createId(), // Generate a unique ID for each detail
          term_report_id: termReport.id,
          subject_id: subject.id,
          class_score: 0,
          exam_score: 0,
          total_score: 0,
          class_position: 0,
          grade_id: null,
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        if (detailValues.length > 0) {
          // Insert all missing details in one operation
          await db.insert(termReportDetails).values(detailValues);
          console.log(`  - Successfully created ${detailValues.length} detail records in one transaction`);

          // Verify details were created
          const verifyDetails = await db.query.termReportDetails.findMany({
            where: eq(termReportDetails.termReportId, termReport.id)
          });
          console.log(`  - Verification: Found ${verifyDetails.length} detail records after insert operation`);
        }
      } catch (error) {
        console.error(`  - Error creating missing detail records in transaction:`, error);
      }
      
      // Now process grades for all subjects
      let totalScore = 0;
      let subjectsWithScores = 0;
      
      for (const subject of classSubjects) {
        console.log(`- Processing subject ${subject.name} (${subject.id}) for student ${student.id}`);
        
        // Get assessments for this subject
        const subjectAssessments = await db.query.assessments.findMany({
          where: and(
            eq(assessments.subjectId, subject.id),
            eq(assessments.classId, classId),
            eq(assessments.academicYearId, academicYearId),
            eq(assessments.academicTermId, academicTermId)
          )
        });
        
        console.log(`  - Found ${subjectAssessments.length} assessments for subject ${subject.name} (${subject.id})`);
        
        // If there are no assessments, log a warning
        if (subjectAssessments.length === 0) {
          console.warn(`  - Warning: No assessments found for subject ${subject.name} (${subject.id}) for student ${student.id}. This may be why reports are not showing data.`);
        }
        
        console.log(`  - Found ${subjectAssessments.length} assessments`);
        
        // First, fetch the exam types to identify the End of Term type
        const examTypesList = await db.query.examTypes.findMany({
          where: schoolId ? eq(examTypes.schoolId, schoolId) : undefined
        });
        
        console.log(`  - Found ${examTypesList.length} exam types`);
        
        // Find the End of Term exam type (system type with a name containing "End of Term" or similar)
        const endOfTermType = examTypesList.find(type => 
          type.isSystem && 
          (type.name.toLowerCase().includes("end of term") || 
           type.name.toLowerCase().includes("final") || 
           type.name.toLowerCase().includes("terminal"))
        );
        
        console.log(`  - End of Term exam type: ${endOfTermType ? endOfTermType.name : 'Not found'}`);
        
        // Separate exams by type
        let caExams = [];
        let endTermExams = [];
        
        if (endOfTermType) {
          // If we found the End of Term type, use it to separate exams
          caExams = subjectAssessments.filter(exam => exam.examType !== endOfTermType.id);
          endTermExams = subjectAssessments.filter(exam => exam.examType === endOfTermType.id);
        } else {
          // Fallback: use category field if the type is not found
          caExams = subjectAssessments.filter(exam => exam.category === 'continuous_assessment');
          endTermExams = subjectAssessments.filter(exam => exam.category === 'final_exam');
          
          // If still no end term exams, check if any exam has "end of term" in its name
          if (endTermExams.length === 0) {
            endTermExams = subjectAssessments.filter(exam => 
              exam.name.toLowerCase().includes("end of term") || 
              exam.name.toLowerCase().includes("final") || 
              exam.name.toLowerCase().includes("terminal")
            );
            
            // Remove any exams moved to endTermExams from caExams
            const endTermIds = endTermExams.map(exam => exam.id);
            caExams = caExams.filter(exam => !endTermIds.includes(exam.id));
          }
        }
        
        const caAssessmentIds = caExams.map(a => a.id);
        const examAssessmentIds = endTermExams.map(a => a.id);
        
        console.log(`  - CA Exams: ${caAssessmentIds.length}, End Term Exams: ${examAssessmentIds.length}`);
        
        // Calculate class score from continuous assessments
        let classScore = 0;
        if (caAssessmentIds.length > 0) {
          const caResults = await db.query.assessmentResults.findMany({
            where: and(
              eq(assessmentResults.studentId, student.id),
              inArray(assessmentResults.assessmentId, caAssessmentIds)
            )
          });
          
          console.log(`  - Found ${caResults.length} CA results`);
          
          // Sum all CA scores
          for (const result of caResults) {
            classScore += result.convertedScore || 0;
          }
        }
        
        // Calculate exam score from exam assessments
        let examScore = 0;
        if (examAssessmentIds.length > 0) {
          const examResults = await db.query.assessmentResults.findMany({
            where: and(
              eq(assessmentResults.studentId, student.id),
              inArray(assessmentResults.assessmentId, examAssessmentIds)
            )
          });
          
          console.log(`  - Found ${examResults.length} exam results`);
          
          // Sum all exam scores
          for (const result of examResults) {
            examScore += result.convertedScore || 0;
            console.log(`  - Adding exam score: ${result.convertedScore}`);
          }
        }
        
        // Calculate total score
        const subjectTotalScore = classScore + examScore;
        
        console.log(`  - Subject totals: Class=${classScore}, Exam=${examScore}, Total=${subjectTotalScore}`);
        
        // Get grade information based on total score
        const grade = getGradeInfo(subjectTotalScore, grades);
        
        // Check if term report detail already exists
        const existingDetail = await db.query.termReportDetails.findFirst({
          where: and(
            eq(termReportDetails.termReportId, termReport.id),
            eq(termReportDetails.subjectId, subject.id)
          )
        });
        
        if (existingDetail) {
          // Update existing detail
          try {
            console.log(`  - Updating existing detail for subject ${subject.name} (${subject.id})`);
            // Log before update
            console.log(`  - Current detail record (ID: ${existingDetail.id}): Class=${existingDetail.classScore}, Exam=${existingDetail.examScore}, Total=${existingDetail.totalScore}`);
            console.log(`  - Updating to: Class=${classScore}, Exam=${examScore}, Total=${subjectTotalScore}`);
            
            // If we have a potential null/undefined in class_position, set a default
            const currentPosition = existingDetail.classPosition ?? 0;
            
            await db.update(termReportDetails)
              .set({
                class_score: classScore,
                exam_score: examScore,
                total_score: subjectTotalScore,
                grade_id: grade.gradeId,
                class_position: currentPosition, // Explicitly set it to maintain the value
                updated_at: new Date()
              })
              .where(eq(termReportDetails.id, existingDetail.id));
            
            // Verify the update
            const verifyUpdate = await db.query.termReportDetails.findFirst({
              where: eq(termReportDetails.id, existingDetail.id)
            });
            
            if (verifyUpdate) {
              console.log(`  - Detail record updated successfully: Class=${verifyUpdate.classScore}, Exam=${verifyUpdate.examScore}, Total=${verifyUpdate.totalScore}, Position=${verifyUpdate.classPosition}`);
            } else {
              console.warn(`  - Failed to verify update for detail record ${existingDetail.id}`);
            }
          } catch (error) {
            console.error(`  - Error updating detail record:`, error);
          }
        } else {
          // Create new detail - shouldn't happen now that we create all missing details upfront
          try {
            const detailId = createId();
            console.log(`  - Creating new detail with ID ${detailId} for subject ${subject.name} (${subject.id})`);
            
            await db.insert(termReportDetails).values({
              id: detailId,
              term_report_id: termReport.id,
              subject_id: subject.id,
              class_score: classScore,
              exam_score: examScore,
              total_score: subjectTotalScore,
              class_position: 0, // Add class position field with default value
              grade_id: grade.gradeId,
              created_at: new Date(),
              updated_at: new Date()
            });
            
            // Verify the creation
            const verifyCreation = await db.query.termReportDetails.findFirst({
              where: eq(termReportDetails.id, detailId)
            });
            
            if (verifyCreation) {
              console.log(`  - Detail record created successfully with ID ${detailId}: Class=${verifyCreation.classScore}, Exam=${verifyCreation.examScore}, Total=${verifyCreation.totalScore}`);
            } else {
              console.warn(`  - Failed to verify creation of detail record with ID ${detailId}`);
            }
          } catch (error) {
            console.error(`  - Error creating detail record:`, error);
          }
        }
        
        if (subjectTotalScore > 0) {
          totalScore += subjectTotalScore;
          subjectsWithScores++;
        }
      }
      
      // Update the term report with the average score
      const averageScore = subjectsWithScores > 0 ? totalScore / subjectsWithScores : 0;
      
      try {
        await db.update(termReports)
          .set({
            total_marks: totalScore,
            average_score: averageScore,
            updated_at: new Date()
          })
          .where(eq(termReports.id, termReport.id));
        
        console.log(`- Updated term report with total marks: ${totalScore}, average: ${averageScore}`);
      } catch (error) {
        console.error(`- Error updating term report average:`, error);
      }
      
      updatedCount++;
      updatedReports.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        averageScore,
        totalSubjects: subjectsWithScores
      });
    }
    
    // Calculate and update rankings
    await calculateRankings(classId, academicYearId, academicTermId);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} term reports`,
      updatedReports
    });
    
  } catch (error) {
    console.error('Error updating term reports:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, {status: 500});
  }
}

// Helper function to get grade info
function getGradeInfo(score: number, grades: any[]) {
  // Find matching grade
  const grade = grades.find(g => 
    score >= g.minScore && score <= g.maxScore
  );
  
  return {
    gradeId: grade?.id || null,
    grade: grade?.gradeName || 'NG',
    remark: grade?.interpretation || 'Not Graded'
  };
}

// Helper function to calculate rankings
async function calculateRankings(classId: string, academicYearId: string, academicTermId: string) {
  try {
    // Get all term reports for this class
    const allReports = await db.query.termReports.findMany({
      where: and(
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId),
        sql`student_id IN (
          SELECT student_id FROM "classEnrollments" 
          WHERE "classId" = ${classId} AND status = 'active'
        )`
      )
    });
    
    // Sort by average score
    allReports.sort((a, b) => b.averageScore - a.averageScore);
    
    // Update ranks
    for (let i = 0; i < allReports.length; i++) {
      const rank = i + 1;
      const rankStr = getOrdinalRank(rank);
      
      await db.update(termReports)
        .set({ rank: rankStr })
        .where(eq(termReports.id, allReports[i].id));
    }
    
    // Calculate subject rankings
    await calculateSubjectRankings(classId, academicYearId, academicTermId);
    
  } catch (error) {
    console.error('Error calculating rankings:', error);
    throw error;
  }
}

// Helper function to calculate subject rankings
async function calculateSubjectRankings(classId: string, academicYearId: string, academicTermId: string) {
  try {
    // Get all subjects
    const classSubjects = await db.query.subjects.findMany({
      where: sql`id IN (
        SELECT "subjectId" FROM term_report_details 
        WHERE term_report_id IN (
          SELECT id FROM term_reports 
          WHERE academic_year_id = ${academicYearId} 
          AND academic_term_id = ${academicTermId}
          AND student_id IN (
            SELECT student_id FROM "classEnrollments" 
            WHERE "classId" = ${classId} AND status = 'active'
          )
        )
      )`
    });
    
    // Process each subject
    for (const subject of classSubjects) {
      // Get all term report details for this subject
      const details = await db.query.termReportDetails.findMany({
        where: and(
          eq(termReportDetails.subjectId, subject.id),
          sql`term_report_id IN (
            SELECT id FROM term_reports 
            WHERE academic_year_id = ${academicYearId} 
            AND academic_term_id = ${academicTermId}
            AND student_id IN (
              SELECT student_id FROM "classEnrollments" 
              WHERE "classId" = ${classId} AND status = 'active'
            )
          )`
        )
      });
      
      // Sort by total score
      details.sort((a, b) => {
        // Convert totalScore to number if it's a string
        const scoreA = typeof a.totalScore === 'string' ? parseFloat(a.totalScore) : (Number(a.totalScore) || 0);
        const scoreB = typeof b.totalScore === 'string' ? parseFloat(b.totalScore) : (Number(b.totalScore) || 0);
        return scoreB - scoreA;
      });
      
      // Update class positions
      for (let i = 0; i < details.length; i++) {
        const position = i + 1;
        
        await db.update(termReportDetails)
          .set({ classPosition: position })
          .where(eq(termReportDetails.id, details[i].id));
      }
    }
    
  } catch (error) {
    console.error('Error calculating subject rankings:', error);
    throw error;
  }
}

// Helper function to get ordinal rank (1st, 2nd, etc.)
function getOrdinalRank(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
