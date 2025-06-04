// Replace the updateTermReports function in lib/services/reportUpdater.ts

import { calculateExamScores } from './examScoreCalculator';
import db from '@/lib/db';
import { 
  termReports, 
  termReportDetails, 
  students,
  classEnrollments,
  subjects,
  exams,
  examScores,
  gradeSystem,
  examTypes,
  examConfigurations,
  batchEnrollments
} from '@/lib/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function updateTermReports(
  schoolId: string,
  classId: string,
  academicYearId: string,
  academicTermId: string,
  schoolType:string,
  options: any = {}
) {
  try {
    console.log(`[updateTermReports] Starting for school: ${schoolId}, class: ${classId}`);
    
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
      return {
        success: false,
        message: "No active students found in this class"
      };
    }
    
    // Get all subjects for the school
    const schoolSubjects = await db.query.subjects.findMany({
      where: eq(subjects.schoolId, schoolId)
    });
    
    if (schoolSubjects.length === 0) {
      return {
        success: false,
        message: "No subjects found for this school"
      };
    }
    
    // Get the grading system
    const grades = await db.query.gradeSystem.findMany({
      where: eq(gradeSystem.schoolId, schoolId)
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
      
      // Create a term report if it doesn't exist
      if (!termReport) {
        const newTermReportId = createId();
        console.log(`Creating new term report with ID: ${newTermReportId}`);
        
        try {
          await db.insert(termReports).values({
            id: newTermReportId,
            studentId: student.id,
            academicYearId: academicYearId,
            academicTermId: academicTermId,
            totalMarks: 0,
            averageScore: 0,
            rank: 'N/A',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Fetch the newly created report
          termReport = await db.query.termReports.findFirst({
            where: eq(termReports.id, newTermReportId)
          });
          
          if (!termReport) {
            console.error(`Failed to fetch the newly created term report`);
            continue;
          }
        } catch (error) {
          console.error(`Error creating term report:`, error);
          continue;
        }
      }
      
      // Process each subject using the new calculation logic
      let totalScore = 0;
      let subjectsWithScores = 0;
      
      for (const subject of schoolSubjects) {
        console.log(`Processing subject ${subject.name} for student ${student.id}`);
        
        // Use the new exam score calculator
        const scoreData = await calculateExamScores(
          student.id,
          subject.id,
          classId,
          academicYearId,
          academicTermId,
          schoolId
        );
        
        console.log(`Score data for ${subject.name}:`, scoreData);
        
        // Get grade information based on total score
        const gradeInfo = getGradeInfo(scoreData.totalScore, grades);
        
        // Check if term report detail already exists
        const existingDetail = await db.query.termReportDetails.findFirst({
          where: and(
            eq(termReportDetails.termReportId, termReport.id),
            eq(termReportDetails.subjectId, subject.id)
          )
        });
        
        if (existingDetail) {
          // Update existing detail with proper numeric values
          await db.update(termReportDetails)
            .set({
              classScore: scoreData.convertedClassScore.toString(),
              examScore: scoreData.convertedExamScore.toString(),
              totalScore: scoreData.totalScore.toString(),
              gradeId: gradeInfo.gradeId,
              updatedAt: new Date()
            })
            .where(eq(termReportDetails.id, existingDetail.id));
            
          console.log(`Updated detail: Class=${scoreData.convertedClassScore}, Exam=${scoreData.convertedExamScore}, Total=${scoreData.totalScore}`);
        } else {
          // Create new detail
          const detailId = createId();
          await db.insert(termReportDetails).values({
            id: detailId,
            termReportId: termReport.id,
            subjectId: subject.id,
            classScore: scoreData.convertedClassScore.toString(),
            examScore: scoreData.convertedExamScore.toString(),
            totalScore: scoreData.totalScore.toString(),
            classPosition: 0,
            gradeId: gradeInfo.gradeId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log(`Created detail: Class=${scoreData.convertedClassScore}, Exam=${scoreData.convertedExamScore}, Total=${scoreData.totalScore}`);
        }
        
        if (scoreData.totalScore > 0) {
          totalScore += scoreData.totalScore;
          subjectsWithScores++;
        }
      }
      
      // Update the term report with the calculated totals
      const averageScore = subjectsWithScores > 0 ? totalScore / subjectsWithScores : 0;
      
      await db.update(termReports)
        .set({
          totalMarks: totalScore,
          averageScore: parseFloat(averageScore.toFixed(2)),
          updatedAt: new Date()
        })
        .where(eq(termReports.id, termReport.id));
      
      console.log(`Updated term report: Total=${totalScore}, Average=${averageScore.toFixed(2)}`);
      
      updatedCount++;
      updatedReports.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        averageScore: parseFloat(averageScore.toFixed(2)),
        totalSubjects: subjectsWithScores
      });
    }
    
    // Calculate and update rankings
    await calculateRankings(classId, academicYearId, academicTermId, schoolType);
    
    return {
      success: true,
      message: `Updated ${updatedCount} term reports with proper score calculations`,
      updatedReports
    };
    
  } catch (error) {
    console.error('Error updating term reports:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Helper function to get grade info (keep existing)
function getGradeInfo(score: number, grades: any[]) {
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
// Helper function to calculate rankings - FIXED to use proper Drizzle queries
async function calculateRankings(classId: string, academicYearId: string, academicTermId: string, schoolType: string) {
  try {
    // First, get all student IDs in the class
    const classStudents = await db.query.classEnrollments.findMany({
      where: and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.status, "active")
      ),
      columns: {
        studentId: true
      }
    });
    
    const studentIds = classStudents.map(enrollment => enrollment.studentId);
    
    if (studentIds.length === 0) {
      console.log('No students found in class');
      return;
    }

    // Get student data to extract batch information
    // Get batch enrollments for these students
    const studentBatchEnrollments = await db.query.batchEnrollments.findMany({
      where: and(
        inArray(batchEnrollments.studentId, studentIds),
        eq(batchEnrollments.status, "active")
      ),
      columns: {
        studentId: true,
        batchId: true
      }
    });

    // Get unique batch IDs from student enrollments
    const batchIds = [...new Set(studentBatchEnrollments.map(enrollment => enrollment.batchId))];
    
    // Get all term reports for these students
    const allReports = await db.query.termReports.findMany({
      where: and(
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId),
        inArray(termReports.studentId, studentIds)
      )
    });
    
    // Sort by average score
    allReports.sort((a, b) => {
      const scoreA = typeof a.averageScore === 'string' ? parseFloat(a.averageScore) : Number(a.averageScore);
      const scoreB = typeof b.averageScore === 'string' ? parseFloat(b.averageScore) : Number(b.averageScore);
      return scoreB - scoreA;
    });
    
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

    // Calculate batch rankings for each unique batch - updates termReportDetails
    for (const batchId of batchIds) {
      await calculateBatchRankings(academicYearId, academicTermId, batchId);
    }
    
    // Calculate course rankings (only for HIGH schools) - updates termReportDetails
    // if (courseId && schoolType === 'HIGH') {
    //   await calculateCourseRankings(academicYearId, academicTermId, courseId, schoolType);
    // }
    
  } catch (error) {
    console.error('Error calculating rankings:', error);
    throw error;
  }
}

// Helper function to calculate subject rankings
// Helper function to calculate subject rankings - FIXED to use proper Drizzle queries
// Helper function to calculate subject rankings - FIXED to handle zero scores properly
async function calculateSubjectRankings(classId: string, academicYearId: string, academicTermId: string) {
  try {
    // First, get all student IDs in the class
    const classStudents = await db.query.classEnrollments.findMany({
      where: and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.status, "active")
      ),
      columns: {
        studentId: true
      }
    });
    
    const studentIds = classStudents.map(enrollment => enrollment.studentId);
    
    if (studentIds.length === 0) {
      console.log('No students found in class');
      return;
    }
    
    // Get all term reports for these students
    const termReportsList = await db.query.termReports.findMany({
      where: and(
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId),
        inArray(termReports.studentId, studentIds)
      ),
      columns: {
        id: true
      }
    });
    
    const termReportIds = termReportsList.map(report => report.id);
    
    if (termReportIds.length === 0) {
      console.log('No term reports found');
      return;
    }
    
    // Get all subjects that have term report details
    const subjectIds = await db.query.termReportDetails.findMany({
      where: inArray(termReportDetails.termReportId, termReportIds),
      columns: {
        subjectId: true
      }
    });
    
    const uniqueSubjectIds = [...new Set(subjectIds.map(detail => detail.subjectId))];
    
    // Process each subject
    for (const subjectId of uniqueSubjectIds) {
      // Get all term report details for this subject
      const details = await db.query.termReportDetails.findMany({
        where: and(
          eq(termReportDetails.subjectId, subjectId),
          inArray(termReportDetails.termReportId, termReportIds)
        )
      });
      
      // Separate students with scores vs those without scores (0 total score)
      const studentsWithScores = details.filter(detail => {
        const totalScore = typeof detail.totalScore === 'string' ? parseFloat(detail.totalScore) : (Number(detail.totalScore) || 0);
        return totalScore > 0;
      });
      
      const studentsWithoutScores = details.filter(detail => {
        const totalScore = typeof detail.totalScore === 'string' ? parseFloat(detail.totalScore) : (Number(detail.totalScore) || 0);
        return totalScore === 0;
      });
      
      // Sort students with scores by total score (descending)
      studentsWithScores.sort((a, b) => {
        const scoreA = typeof a.totalScore === 'string' ? parseFloat(a.totalScore) : (Number(a.totalScore) || 0);
        const scoreB = typeof b.totalScore === 'string' ? parseFloat(b.totalScore) : (Number(b.totalScore) || 0);
        return scoreB - scoreA;
      });
      
      // Assign positions to students with scores
      for (let i = 0; i < studentsWithScores.length; i++) {
        const position = i + 1;
        
        await db.update(termReportDetails)
          .set({ classPosition: position })
          .where(eq(termReportDetails.id, studentsWithScores[i].id));
      }
      
      // For students without scores, set position to null or a special indicator
      for (const student of studentsWithoutScores) {
        await db.update(termReportDetails)
          .set({ classPosition: 0 }) // or you could use 999 or "N/A" depending on your schema
          .where(eq(termReportDetails.id, student.id));
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

// Helper function to calculate batch rankings for subjects (across all students in the same batch)
async function calculateBatchRankings(
  academicYearId: string, 
  academicTermId: string, 
  batchId: string
) {
  try {
    // Get all active students in this batch
    const allStudentsInBatch = await db.query.batchEnrollments.findMany({
      where: and(
        eq(batchEnrollments.batchId, batchId),
        eq(batchEnrollments.status, "active")
      ),
      columns: {
        studentId: true
      }
    });
    
    const studentIds = allStudentsInBatch.map(enrollment => enrollment.studentId);
    
    if (studentIds.length === 0) {
      console.log('No students found in batch:', batchId);
      return;
    }
    
    // Get all term reports for these students
    const termReportsList = await db.query.termReports.findMany({
      where: and(
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId),
        inArray(termReports.studentId, studentIds)
      ),
      columns: {
        id: true
      }
    });
    
    const termReportIds = termReportsList.map(report => report.id);
    
    if (termReportIds.length === 0) {
      console.log('No term reports found for batch:', batchId);
      return;
    }
    
    // Get all subjects that have term report details for this batch
    const subjectIds = await db.query.termReportDetails.findMany({
      where: inArray(termReportDetails.termReportId, termReportIds),
      columns: {
        subjectId: true
      }
    });
    
    const uniqueSubjectIds = [...new Set(subjectIds.map(detail => detail.subjectId))];
    
    // Process each subject for batch rankings
    for (const subjectId of uniqueSubjectIds) {
      // Get all term report details for this subject across the batch
      const allSubjectDetails = await db.query.termReportDetails.findMany({
        where: and(
          eq(termReportDetails.subjectId, subjectId),
          inArray(termReportDetails.termReportId, termReportIds)
        )
      });
      
      // Separate students with scores vs those without scores
      const detailsWithScores = allSubjectDetails.filter(detail => {
        const totalScore = typeof detail.totalScore === 'string' 
          ? parseFloat(detail.totalScore) 
          : (Number(detail.totalScore) || 0);
        return totalScore > 0;
      });
      
      const detailsWithoutScores = allSubjectDetails.filter(detail => {
        const totalScore = typeof detail.totalScore === 'string' 
          ? parseFloat(detail.totalScore) 
          : (Number(detail.totalScore) || 0);
        return totalScore === 0;
      });
      
      // Sort students with scores by total score (descending)
      detailsWithScores.sort((a, b) => {
        const scoreA = typeof a.totalScore === 'string' 
          ? parseFloat(a.totalScore) 
          : (Number(a.totalScore) || 0);
        const scoreB = typeof b.totalScore === 'string' 
          ? parseFloat(b.totalScore) 
          : (Number(b.totalScore) || 0);
        return scoreB - scoreA;
      });
      
      // Assign batch positions to students with scores
      for (let i = 0; i < detailsWithScores.length; i++) {
        const position = i + 1;
        
        await db.update(termReportDetails)
          .set({ batchPosition: position })
          .where(eq(termReportDetails.id, detailsWithScores[i].id));
      }
      
      // Set batch position to null for students without scores
      for (const detail of detailsWithoutScores) {
        await db.update(termReportDetails)
          .set({ batchPosition: null })
          .where(eq(termReportDetails.id, detail.id));
      }
    }
    
    console.log(`Updated batch rankings for batch ${batchId} across ${uniqueSubjectIds.length} subjects`);
    
  } catch (error) {
    console.error('Error calculating batch rankings:', error);
    throw error;
  }
}

// Helper function to calculate course rankings for subjects (only for HIGH schools)
// async function calculateCourseRankings(
//   academicYearId: string, 
//   academicTermId: string, 
//   courseId: string,
//   schoolType: string
// ) {
//   try {
//     // Only calculate course rankings for HIGH schools
//     if (schoolType !== 'HIGH') {
//       console.log('Skipping course rankings - not a HIGH school');
//       return;
//     }
    
//     // Get all classes for this course
//     const classesInCourse = await db.query.classes.findMany({
//       where: eq(classes.courseId, courseId),
//       columns: {
//         id: true
//       }
//     });
    
//     const classIds = classesInCourse.map(cls => cls.id);
    
//     if (classIds.length === 0) {
//       console.log('No classes found for course:', courseId);
//       return;
//     }
    
//     // Get all active students in these classes
//     const allStudentsInCourse = await db.query.classEnrollments.findMany({
//       where: and(
//         inArray(classEnrollments.classId, classIds),
//         eq(classEnrollments.status, "active")
//       ),
//       columns: {
//         studentId: true
//       }
//     });
    
//     const studentIds = allStudentsInCourse.map(enrollment => enrollment.studentId);
    
//     if (studentIds.length === 0) {
//       console.log('No students found in course:', courseId);
//       return;
//     }
    
//     // Get all term reports for these students
//     const termReportsList = await db.query.termReports.findMany({
//       where: and(
//         eq(termReports.academicYearId, academicYearId),
//         eq(termReports.academicTermId, academicTermId),
//         inArray(termReports.studentId, studentIds)
//       ),
//       columns: {
//         id: true
//       }
//     });
    
//     const termReportIds = termReportsList.map(report => report.id);
    
//     if (termReportIds.length === 0) {
//       console.log('No term reports found for course:', courseId);
//       return;
//     }
    
//     // Get all subjects that have term report details for this course
//     const subjectIds = await db.query.termReportDetails.findMany({
//       where: inArray(termReportDetails.termReportId, termReportIds),
//       columns: {
//         subjectId: true
//       }
//     });
    
//     const uniqueSubjectIds = [...new Set(subjectIds.map(detail => detail.subjectId))];
    
//     // Process each subject for course rankings
//     for (const subjectId of uniqueSubjectIds) {
//       // Get all term report details for this subject across the course
//       const allSubjectDetails = await db.query.termReportDetails.findMany({
//         where: and(
//           eq(termReportDetails.subjectId, subjectId),
//           inArray(termReportDetails.termReportId, termReportIds)
//         )
//       });
      
//       // Separate students with scores vs those without scores
//       const detailsWithScores = allSubjectDetails.filter(detail => {
//         const totalScore = typeof detail.totalScore === 'string' 
//           ? parseFloat(detail.totalScore) 
//           : (Number(detail.totalScore) || 0);
//         return totalScore > 0;
//       });
      
//       const detailsWithoutScores = allSubjectDetails.filter(detail => {
//         const totalScore = typeof detail.totalScore === 'string' 
//           ? parseFloat(detail.totalScore) 
//           : (Number(detail.totalScore) || 0);
//         return totalScore === 0;
//       });
      
//       // Sort students with scores by total score (descending)
//       detailsWithScores.sort((a, b) => {
//         const scoreA = typeof a.totalScore === 'string' 
//           ? parseFloat(a.totalScore) 
//           : (Number(a.totalScore) || 0);
//         const scoreB = typeof b.totalScore === 'string' 
//           ? parseFloat(b.totalScore) 
//           : (Number(b.totalScore) || 0);
//         return scoreB - scoreA;
//       });
      
//       // Assign course positions to students with scores
//       for (let i = 0; i < detailsWithScores.length; i++) {
//         const position = i + 1;
        
//         await db.update(termReportDetails)
//           .set({ coursePosition: position })
//           .where(eq(termReportDetails.id, detailsWithScores[i].id));
//       }
      
//       // Set course position to null for students without scores
//       for (const detail of detailsWithoutScores) {
//         await db.update(termReportDetails)
//           .set({ coursePosition: null })
//           .where(eq(termReportDetails.id, detail.id));
//       }
//     }
    
//     console.log(`Updated course rankings for course ${courseId} across ${uniqueSubjectIds.length} subjects`);
    
//   } catch (error) {
//     console.error('Error calculating course rankings:', error);
//     throw error;
//   }
// }