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
              
              // Calculate total score
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
/**
 * Retrieves all exam scores for a student across multiple exams
 */
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
      
      // Use the correct approach for the IN query - no longer concatenating IDs
      // This uses the inArray helper from drizzle-orm if available
      const scores = await tx.query.examScores.findMany({
        where: and(
          eq(examScores.studentId, studentId),
          // Use inArray if it's available in your version of Drizzle
          inArray(examScores.examId, examIds)
        )
      });
      
      // If your version of Drizzle doesn't have inArray, use this alternative:
      // const scores = await tx.execute(
      //   `SELECT * FROM exam_scores WHERE student_id = $1 AND exam_id = ANY($2)`,
      //   [studentId, examIds]
      // );
      
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
          // Determine category based on exam type
          category: exam.examType.includes("End of Term") ? "final_exam" : "continuous_assessment",
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
 */
function calculateScores(
  examScoreData: ExamScoreData[],
  classScoreWeight: number,
  examScoreWeight: number
): { classScore: number, examScore: number } {
  // Filter by category
  const classAssessments = examScoreData.filter(e => e.category === "continuous_assessment");
  const finalExams = examScoreData.filter(e => e.category === "final_exam");
  
  // Calculate class score
  let classScore = 0;
  if (classAssessments.length > 0) {
    let totalWeightedScore = 0;
    let totalPossibleScore = 0;
    
    for (const assessment of classAssessments) {
      // Convert raw score using the formula: (Student's Score / Total Marks) × New Total
      // Where New Total is derived from the weight
      totalWeightedScore += assessment.rawScore;
      totalPossibleScore += assessment.totalMarks;
    }
    
    if (totalPossibleScore > 0) {
      // Apply the conversion formula and weight
      classScore = (totalWeightedScore / totalPossibleScore) * 100 * (classScoreWeight / 100);
    }
  }
  
  // Calculate exam score
  let examScore = 0;
  if (finalExams.length > 0) {
    let totalWeightedScore = 0;
    let totalPossibleScore = 0;
    
    for (const exam of finalExams) {
      totalWeightedScore += exam.rawScore;
      totalPossibleScore += exam.totalMarks;
    }
    
    if (totalPossibleScore > 0) {
      // Apply the conversion formula and weight
      examScore = (totalWeightedScore / totalPossibleScore) * 100 * (examScoreWeight / 100);
    }
  }
  
  // Round to 1 decimal place
  return {
    classScore: parseFloat(classScore.toFixed(1)),
    examScore: parseFloat(examScore.toFixed(1))
  };
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
            totalMarks: subjectCount, // Using totalMarks to store subject count
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
            totalMarks: subjectCount,
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
  return parseFloat((totalScore / results.length).toFixed(2));
}

/**
 * Calculates and updates positions for class, subject, and overall rankings
 */
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
          
          // Update the position
          await tx
            .update(termReportDetails)
            .set({ classPosition: currentPosition })
            .where(eq(termReportDetails.id, detail.id));
          
          console.log(`Updated position for student ${detail.termReport?.studentId} in subject ${subjectId} to ${currentPosition}`);
        }
      }
      
      console.log(`Successfully calculated and updated subject positions`);
    } catch (error) {
      console.error("Error in calculateSubjectPositions:", error);
      throw error; // Rethrow to be caught by the transaction
    }
  }

/**
 * Calculates and updates overall positions
 */
/**
 * Calculates and updates overall positions
 */
async function calculateOverallPositions(
    tx: any, // Transaction object
    classId: string,
    academicYearId: string,
    academicTermId: string
  ): Promise<void> {
    try {
      console.log(`Calculating overall positions for class ${classId}`);
      
      // Get all term reports for this class and academic period
      const termReports_ = await tx.query.termReports.findMany({
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
      
      console.log(`Found ${termReports_.length} term reports to process`);
      
      if (termReports_.length === 0) {
        console.log(`No term reports found for class ${classId}`);
        return;
      }
      
      // Sort by average score in descending order
      const sorted = [...termReports_].sort((a, b) => b.averageScore - a.averageScore);
      
      // Assign positions
      let currentPosition = 1;
      let currentScore: number | null = null;
      let samePositionCount = 0;
      const totalStudents = sorted.length;
      
      for (let i = 0; i < sorted.length; i++) {
        const report = sorted[i];
        
        if (currentScore !== report.averageScore) {
          // New position
          currentPosition = i + 1 - samePositionCount;
          currentScore = report.averageScore;
          samePositionCount = 0;
        } else {
          // Same position (tie)
          samePositionCount++;
        }
        
        // Format position
        const positionSuffix = getPositionSuffix(currentPosition);
        const positionText = `${currentPosition}${positionSuffix} out of ${totalStudents}`;
        
        // Generate remarks
        const remarks = generateOverallRemarks(report.averageScore, currentPosition, totalStudents);
        
        // Update the term report
        await tx
          .update(termReports)
          .set({ 
            rank: positionText,
            remarks
          })
          .where(eq(termReports.id, report.id));
        
        console.log(`Updated position for student ${report.studentId} to ${positionText}`);
      }
      
      console.log(`Successfully calculated and updated overall positions`);
    } catch (error) {
      console.error("Error in calculateOverallPositions:", error);
      throw error; // Rethrow to be caught by the transaction
    }
  }

/**
 * Returns the appropriate suffix for a position
 */
function getPositionSuffix(position: number): string {
  if (position % 10 === 1 && position % 100 !== 11) {
    return "st";
  } else if (position % 10 === 2 && position % 100 !== 12) {
    return "nd";
  } else if (position % 10 === 3 && position % 100 !== 13) {
    return "rd";
  } else {
    return "th";
  }
}

/**
 * Generates remarks based on average score and position
 */
function generateOverallRemarks(
  averageScore: number,
  position: number,
  totalStudents: number
): string {
  // Calculate position percentile
  const percentile = (position / totalStudents) * 100;
  
  if (averageScore >= 80) {
    return "Excellent performance! Keep up the outstanding work.";
  } else if (averageScore >= 70) {
    return "Very good performance. Continue to work hard.";
  } else if (averageScore >= 60) {
    return "Good performance with room for improvement.";
  } else if (averageScore >= 50) {
    return "Satisfactory performance. More effort needed.";
  } else if (averageScore >= 40) {
    return "Fair performance. Needs significant improvement.";
  } else {
    return "Poor performance. Urgent attention and support required.";
  }
}