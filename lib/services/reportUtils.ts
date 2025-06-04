// lib/services/reportUtils.ts
import db from "@/lib/db";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { 
  students, 
  classes, 
  subjects, 
  examConfigurations,
  exams,
  examScores,
  termReports,
  termReportDetails,
  gradeSystem,
  classEnrollments,
  schools,
  academicYears,
  academicTerms,
  attendance,
  guardianStudents
} from "@/lib/schema";
import { getOrdinalRank } from "../utils";

/**
 * Calculate class rank with ties (dense ranking)
 * Dense ranking assigns the same rank to equal values with no gaps
 * Example: [100, 95, 95, 90] would rank as [1, 2, 2, 3]
 */
export function calculateDenseRank<T>(
  items: T[], 
  valueAccessor: (item: T) => number
): Map<T, number> {
  const rankMap = new Map<T, number>();
  
  if (!items.length) return rankMap;
  
  // Sort items by value in descending order
  const sortedItems = [...items].sort((a, b) => valueAccessor(b) - valueAccessor(a));
  
  let currentRank = 1;
  let previousValue: number | null = null;
  
  for (const item of sortedItems) {
    const currentValue = valueAccessor(item);
    
    // If this is the first item or the value is different from the previous one,
    // assign a new rank
    if (previousValue === null || currentValue !== previousValue) {
      rankMap.set(item, currentRank);
      previousValue = currentValue;
    } else {
      // If the value is the same as the previous one, assign the same rank
      rankMap.set(item, currentRank - 1);
    }
    
    currentRank++;
  }
  
  return rankMap;
}

/**
 * Calculate standard ranking with skipped ranks for ties
 * Example: [100, 95, 95, 90] would rank as [1, 2, 2, 4]
 */
export function calculateStandardRank<T>(
  items: T[], 
  valueAccessor: (item: T) => number
): Map<T, number> {
  const rankMap = new Map<T, number>();
  
  if (!items.length) return rankMap;
  
  // Sort items by value in descending order
  const sortedItems = [...items].sort((a, b) => valueAccessor(b) - valueAccessor(a));
  
  let currentRank = 1;
  let previousValue: number | null = null;
  let sameValueCount = 0;
  
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const currentValue = valueAccessor(item);
    
    if (previousValue === null) {
      // First item
      rankMap.set(item, currentRank);
      previousValue = currentValue;
    } else if (currentValue === previousValue) {
      // Same value as previous, assign same rank
      rankMap.set(item, currentRank - sameValueCount);
      sameValueCount++;
    } else {
      // Different value, assign new rank (skipping as needed)
      currentRank = i + 1;
      rankMap.set(item, currentRank);
      previousValue = currentValue;
      sameValueCount = 0;
    }
  }
  
  return rankMap;
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format a date string to a readable format
 */
export function formatReportDate(dateString?: string | Date): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Get grade and remark based on score and grading system
 */
export function getGradeInfo(
  score: number,
  grades: any[]
): { grade: string; remark: string } {
  // Default values if no matching grade is found
  let result = { grade: 'NG', remark: 'Not Graded' };
  
  for (const grade of grades) {
    if (score >= grade.minScore && score <= grade.maxScore) {
      result = {
        grade: grade.gradeName,
        remark: grade.interpretation || ''
      };
      break;
    }
  }
  
  return result;
}

/**
 * Get student attendance for a specific academic term
 */
export async function getStudentAttendance(
  studentId: string,
  classId: string,
  academicYearId: string,
  academicTermId: string
): Promise<{ daysPresent: number; daysAbsent: number; totalDays: number; percentage: number } | null> {
  try {
    // Get all attendance records for this student in this term
    const attendanceRecords = await db.query.attendance.findMany({
      where: and(
        eq(attendance.studentId, studentId),
        eq(attendance.classId, classId)
        // You may need to add date range filtering based on term dates
      )
    });
    
    if (!attendanceRecords.length) return null;
    
    const daysPresent = attendanceRecords.filter(
      record => record.status === 'present'
    ).length;
    
    const daysAbsent = attendanceRecords.filter(
      record => record.status === 'absent'
    ).length;
    
    const totalDays = attendanceRecords.length;
    
    // Calculate percentage with proper handling of zero
    const percentage = totalDays > 0 
      ? Math.round((daysPresent / totalDays) * 100) 
      : 0;
    
    return {
      daysPresent,
      daysAbsent,
      totalDays,
      percentage
    };
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    return null;
  }
}

/**
 * Get complete report data for a student
 */
export async function getStudentReportData(
  studentId: string,
  academicYearId: string,
  academicTermId: string
) {
  try {
    // Get student info
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        enrollments: { // Changed from classEnrollments to match the relation name
          where: eq(classEnrollments.status, "active"),
          with: {
            class: true
          }
        },
        school: true,
        guardianStudents:{
          where: eq(guardianStudents.studentId, studentId),
          with:{
            guardian: true
          }
        }
      }
    });

    console.log({student})
    
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    
    // Make sure the student has a school ID
    if (!student.schoolId) {
      throw new Error(`Student ${studentId} does not have an associated school`);
    }
    
    // Get class information
    const classInfo = student.enrollments[0]?.class;
    if (!classInfo) {
      throw new Error(`No active class enrollment found for student ${studentId}`);
    }
    
    // Get term reports and details
    let termReport = await db.query.termReports.findFirst({
      where: and(
        eq(termReports.studentId, studentId),
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId)
      ),
      with: {
        details: {
          with: {
            subject: true,
            grade: true
          }
        }
      }
    });
    
    console.log(`Fetched term report for student ${studentId}: ${termReport?.id || 'Not found'}`);
    if (termReport) {
      console.log(`Term report has ${termReport.details?.length || 0} detail records`);
    }
    
    // If no term report found, create one
    if (!termReport) {
      console.log(`Creating new term report for student ${studentId} in academic period ${academicYearId}/${academicTermId}`);
      
      // Create new term report
      const termReportId = createId();
      console.log(`Generated new termReportId: ${termReportId}`);
      
      try {
        await db.insert(termReports).values({
          id: termReportId,
          studentId: studentId,
          academicYearId: academicYearId,
          academicTermId: academicTermId,
          totalMarks: 0,
          averageScore: 0,
          rank: 'N/A',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Successfully created term report with id ${termReportId}`);
      } catch (error) {
        console.error(`Error creating term report:`, error);
        throw new Error(`Failed to create term report: ${error instanceof Error ? error.message : 'Unknown error'}`); 
      }
      
      // Create empty report details for all subjects
      try {
        // Get school subjects
        const schoolSubjects = await db.query.subjects.findMany({
          where: student.schoolId ? eq(subjects.schoolId, student.schoolId) : undefined
        });
        console.log(`Found ${schoolSubjects.length} subjects for student's school`);
        
        // Create term report details for each subject
        for (const subject of schoolSubjects) {
          console.log(`Creating term report detail for subject: ${subject.name} (${subject.id})`);
          
          try {
           await db.insert(termReportDetails).values({
              termReportId: termReportId,  // This should match your schema definition
              subjectId: subject.id,
              classScore: "0",  // Keep as strings to match schema
              examScore: "0",   // Keep as strings to match schema  
              totalScore: "0",  // Keep as strings to match schema
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`Successfully created term report detail for subject ${subject.id}`);
          } catch (error) {
            console.error(`Error creating term report detail for subject ${subject.id}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error finding/creating subject details:`, error);
      }
      
      // Fetch the newly created term report
      console.log(`Fetching the newly created term report with id ${termReportId}`);
      termReport = await db.query.termReports.findFirst({
        where: eq(termReports.id, termReportId),
        with: {
          details: {
            with: {
              subject: true,
              grade: true
            }
          }
        }
      });
      
      console.log(`Fetched term report:`, termReport);
      if (termReport?.details) {
        console.log(`Term report has ${termReport.details.length} detail records`);
      } else {
        console.log(`Term report details are missing or empty`);
      }
      
      if (!termReport) {
        console.error(`Failed to fetch newly created term report with id ${termReportId}`);
        throw new Error(`Failed to create term report for student ${studentId}`);
      }
    }
    
    // Get academic period info
    const academicYear = await db.query.academicYears.findFirst({
      where: eq(academicYears.id, academicYearId)
    });
    
    const academicTerm = await db.query.academicTerms.findFirst({
      where: eq(academicTerms.id, academicTermId)
    });
    
    if (!academicYear || !academicTerm) {
      throw new Error(`Academic year or term not found`);
    }
    
    // Get attendance data
    const attendanceData = await getStudentAttendance(
      studentId,
      classInfo.id,
      academicYearId,
      academicTermId
    );
    
    // Get school info (school should be defined since we check for student.schoolId earlier)
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, student.schoolId)
    });
    
    if (!school) {
      throw new Error(`School with ID ${student.schoolId} not found`);
    }
    
    // Get the total number of students in the class for ranking context
    const totalStudentsResult = await db.select({ count: sql`count(*)` })
      .from(classEnrollments)
      .where(
        and(
          eq(classEnrollments.classId, classInfo.id),
          eq(classEnrollments.status, "active")
        )
      );
    
    const totalStudents = Number(totalStudentsResult[0]?.count) || 0;
    
    // Format subject results - with extra debug info
    console.log(`Term report details count: ${termReport.details ? termReport.details.length : 0}`);
    
    // Check if we have missing data in any fields
    if (termReport.details && termReport.details.length > 0) {
      console.log('Sample detail record:', JSON.stringify(termReport.details[0], null, 2));
    }
    
    const subjectResults = termReport.details.map(detail => {
      // Ensure scores are numeric values
      const classScore = typeof detail.classScore === 'string' ? parseFloat(detail.classScore) : Number(detail.classScore) || 0;
      const examScore = typeof detail.examScore === 'string' ? parseFloat(detail.examScore) : Number(detail.examScore) || 0;
      const totalScore = typeof detail.totalScore === 'string' ? parseFloat(detail.totalScore) : Number(detail.totalScore) || 0;
      
      console.log(`Processing subject ${detail.subject.name} (${detail.subject.id}) for student ${studentId}:`);
      console.log(`- Class Score: ${classScore}`);
      console.log(`- Exam Score: ${examScore}`);
      console.log(`- Total Score: ${totalScore}`);
      console.log(`- Class Position: ${detail.classPosition || 'Not set'}`);
      
      return {
        id: detail.id,
        subjectId: detail.subjectId,
        subjectName: detail.subject.name,
        classScore,
        examScore,
        totalScore,
        grade: detail.grade?.gradeName || 'NG',
        remark: detail.grade?.interpretation || 'Not Graded',
        classPosition: getOrdinalRank(detail.classPosition) || undefined,
        coursePosition: getOrdinalRank(detail.coursePosition || 0) || undefined,
        batchPosition: getOrdinalRank(detail.batchPosition || 0) || undefined
      };
    });
    
    // Get class position with ordinal suffix
    const classPosition = termReport.rank || 'N/A';
    
    // Format and return the complete report data
    return {
      schoolInfo: {
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
        logo: school.logo,
        region: school.region,
        district: school.district,
        schoolCode: school.schoolCode
      },
      studentInfo: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        middleName: student.middleName || '',
        lastName: student.lastName,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        guardianName: `${student.guardianStudents[0]?.guardian.firstName} ${student.guardianStudents[0]?.guardian?.lastName}` || '',
        className: classInfo.name,
        classPosition: classPosition,
        totalStudents: totalStudents
      },
      academicInfo: {
        academicYear: academicYear.name,
        term: academicTerm.name,
        startDate: academicTerm.startDate,
        endDate: academicTerm.endDate,
        nextTermBegins: null // This would be determined by school policy or academic calendar
      },
      subjects: subjectResults,
      attendance: attendanceData,
      totalAverage: termReport.averageScore,
      reportId: termReport.id
    };
  } catch (error) {
    console.error("Error getting student report data:", error);
    throw error;
  }
}
