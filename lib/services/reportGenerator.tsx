// Fixed lib/services/reportGenerator.tsx

import React from 'react';
import { 
  academicYears, 
  academicTerms, 
  schools, 
  classes, 
  subjects, 
  students, 
  classEnrollments, 
  termReports, 
  termReportDetails,
  gradeSystem
} from "@/lib/schema";
import db from "@/lib/db";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { calculateDenseRank, calculateStandardRank, getStudentReportData } from "./reportUtils";
import { renderToBuffer, renderToStream } from "@react-pdf/renderer";
import { 
  ReportContext, 
  BasicSchoolReportCard, 
  SHSReportCard, 
  CompleteReportData 
} from "@/components/dashboard/exams/report-templates";
import { Document } from '@react-pdf/renderer';

/**
 * Generate PDF report for a single student
 */
export async function generateStudentReport(
  studentId: string,
  academicYearId: string,
  academicTermId: string,
  options: {
    format?: 'pdf' | 'blob';
    context?: ReportContext;
  } = {}
) {
  try {
    // Get complete report data
    const reportData = await getStudentReportData(studentId, academicYearId, academicTermId);
    
    // Log report data for debugging
    console.log(`Processing report for student ${studentId}:`);
    if (reportData.subjects) {
      console.log(`Found ${reportData.subjects.length} subjects for student ${studentId}`);
      
      if (reportData.subjects.length === 0) {
        console.warn(`Warning: No subjects found for student ${studentId}. Check if term report details exist.`);
      }
      
      reportData.subjects.forEach(subject => {
        console.log(`Subject ${subject.subjectName}: Class Score=${subject.classScore}, Exam Score=${subject.examScore}, Total=${subject.totalScore}`);
      });
    } else {
      console.warn(`Warning: No subject data found for student ${studentId}. Check term report records.`);
    }
    
    // Determine school type
    const schoolType = determineSchoolType(reportData.studentInfo.className || '');
    
    // Set up report context
    const reportContext: ReportContext = options.context || {
      schoolType,
      reportView: 'print',
      showComments: true,
      showAttendance: true,
      showBehavior: true
    };
    
    // Get grading system from database
    const grades = await db.query.gradeSystem.findMany({
      where: reportData.schoolInfo.id ? eq(gradeSystem.schoolId, reportData.schoolInfo.id) : undefined
    });
    
    // Render the appropriate report card component to PDF
    const ReportComponent = reportContext.schoolType === 'high' 
      ? SHSReportCard 
      : BasicSchoolReportCard;
    
    // Create the PDF blob
    const pdfBuffer = await renderToBuffer(
      <Document>
        <ReportComponent
          schoolInfo={{
            ...reportData.schoolInfo,
            address: reportData.schoolInfo.address || undefined,
            phone: reportData.schoolInfo.phone || undefined,
            email: reportData.schoolInfo.email || undefined,
            logo: reportData.schoolInfo.logo || undefined,
            region: reportData.schoolInfo.region || undefined,
            district: reportData.schoolInfo.district || undefined,
            schoolCode: reportData.schoolInfo.schoolCode || undefined,
          }}
          studentInfo={{
            ...reportData.studentInfo,
            gender: reportData.studentInfo.gender || undefined,
            dateOfBirth: reportData.studentInfo.dateOfBirth || undefined,
          }}
          academicInfo={{
            ...reportData.academicInfo,
            nextTermBegins: reportData.academicInfo.nextTermBegins || undefined,
          }}
          subjects={reportData.subjects.map(subject => ({
            ...subject,
            classScore: subject.classScore || 0,
            examScore: subject.examScore || 0,
            totalScore: subject.totalScore || 0,
            classPosition: Number(subject.classPosition) || undefined,
            coursePosition: Number(subject.coursePosition) || undefined,
            batchPosition: Number(subject.batchPosition) || undefined,
          }))}
          attendance={reportData.attendance || undefined}
          totalAverage={reportData.totalAverage || 0}
          showLogo={true}
        />
      </Document>
    );
    
    // Return the requested format
    return {
      success: true,
      blob:pdfBuffer,
      reportData
    };
  } catch (error) {
    console.error("Error generating student report:", error);
    throw error;
  }
}

/**
 * Generate PDF reports for all students in a class
 */
export async function generateClassReports(
  classId: string,
  academicYearId: string,
  academicTermId: string,
  options: {
    studentIds?: string[];
    includeAll?: boolean;
  } = {}
) {
  try {
    // Get all students in class or the specified students
    const enrollments = await db.query.classEnrollments.findMany({
      where: options.studentIds?.length 
        ? and(
            eq(classEnrollments.classId, classId),
            eq(classEnrollments.status, "active"),
            inArray(classEnrollments.studentId, options.studentIds)
          )
        : and(
            eq(classEnrollments.classId, classId),
            eq(classEnrollments.status, "active")
          ),
      with: {
        student: true
      }
    });
    
    // Generate a report for each student
    const reports = [];
    let successful = 0;
    const failed = [];
    
    for (const enrollment of enrollments) {
      try {
        const report = await generateStudentReport(
          enrollment.student.id,
          academicYearId,
          academicTermId
        );
        reports.push(report);
        successful++;
      } catch (error) {
        console.error(`Failed to generate report for student ${enrollment.student.id}:`, error);
        failed.push({
          studentId: enrollment.student.id,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return {
      success: true,
      message: `Generated ${successful} reports successfully. ${failed.length} reports failed.`,
      reports,
      failedReports: failed,
      totalGenerated: successful,
      totalFailed: failed.length
    };
  } catch (error) {
    console.error("Error generating class reports:", error);
    throw error;
  }
}

/**
 * Helper function to determine the school type from the class name
 */
function determineSchoolType(className: string): 'basic' | 'high' {
  const lowerClassName = className.toLowerCase();
  
  // SHS or Senior High School patterns
  if (
    lowerClassName.includes('shs') || 
    lowerClassName.includes('senior high') ||
    lowerClassName.includes('form') ||
    /\b(shs|senior)\s*[1-3]\b/.test(lowerClassName)
  ) {
    return 'high';
  }
  
  // Default to basic school
  return 'basic';
}

/**
 * Recalculate rankings for all students in a class for a specific subject
 * FIXED: Corrected SQL syntax and column names
 */
export async function recalculateSubjectRankings(
  subjectId: string,
  classId: string,
  academicYearId: string,
  academicTermId: string,
  rankingMethod: 'standard' | 'dense' = 'dense'
) {
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
      return {
        success: false,
        message: "No students found in this class"
      };
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
      return {
        success: false,
        message: "No term reports found for this class"
      };
    }
    
    // Get all term report details for this subject and class
    const termReportDetailResults = await db.query.termReportDetails.findMany({
      where: and(
        eq(termReportDetails.subjectId, subjectId),
        inArray(termReportDetails.termReportId, termReportIds)
      )
    });
    
    if (!termReportDetailResults.length) {
      return {
        success: false,
        message: "No term report details found for this subject and class"
      };
    }
    
    // Separate students with scores vs those without scores
    const studentsWithScores = termReportDetailResults.filter(detail => {
      const score = typeof detail.totalScore === 'string' 
        ? parseFloat(detail.totalScore) 
        : Number(detail.totalScore);
      return !isNaN(score) && score > 0;
    });
    
    const studentsWithoutScores = termReportDetailResults.filter(detail => {
      const score = typeof detail.totalScore === 'string' 
        ? parseFloat(detail.totalScore) 
        : Number(detail.totalScore);
      return isNaN(score) || score === 0;
    });
    
    // Calculate ranks only for students with scores
    if (studentsWithScores.length > 0) {
      const rankMap = rankingMethod === 'dense'
        ? calculateDenseRank(
            studentsWithScores, 
            detail => {
              const score = typeof detail.totalScore === 'string' 
                ? parseFloat(detail.totalScore) 
                : Number(detail.totalScore);
              return isNaN(score) ? 0 : score;
            }
          )
        : calculateStandardRank(
            studentsWithScores, 
            detail => {
              const score = typeof detail.totalScore === 'string' 
                ? parseFloat(detail.totalScore) 
                : Number(detail.totalScore);
              return isNaN(score) ? 0 : score;
            }
          );
      
      // Update the ranks for students with scores
      for (const detail of studentsWithScores) {
        const rank = rankMap.get(detail);
        if (rank !== undefined) {
          await db
            .update(termReportDetails)
            .set({ 
              classPosition: rank,
              updatedAt: new Date()
            })
            .where(eq(termReportDetails.id, detail.id));
        }
      }
    }
    
    // Set position to null for students without scores
    for (const detail of studentsWithoutScores) {
      await db
        .update(termReportDetails)
        .set({ 
          classPosition: 0, // or you could use a specific value like 999
          updatedAt: new Date()
        })
        .where(eq(termReportDetails.id, detail.id));
    }
    
    return {
      success: true,
      message: `Updated rankings for ${studentsWithScores.length} students with scores, ${studentsWithoutScores.length} students without scores set to unranked`,
      updatedCount: termReportDetailResults.length
    };
  } catch (error) {
    console.error("Error recalculating subject rankings:", error);
    throw error;
  }
}

/**
 * Recalculate overall student rankings for all students in a class
 * FIXED: Corrected column names
 */
export async function recalculateOverallRankings(
  classId: string,
  academicYearId: string,
  academicTermId: string,
  rankingMethod: 'standard' | 'dense' = 'dense'
) {
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
      return {
        success: false,
        message: "No students found in this class"
      };
    }
    
    // Get all term reports for these students
    const termReportResults = await db.query.termReports.findMany({
      where: and(
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId),
        inArray(termReports.studentId, studentIds)
      )
    });
    
    if (!termReportResults.length) {
      return {
        success: false,
        message: "No term reports found for this class"
      };
    }
    
    // Calculate ranks based on average score
    const rankMap = rankingMethod === 'dense'
      ? calculateDenseRank(
          termReportResults, 
          report => {
            const score = typeof report.averageScore === 'string' 
              ? parseFloat(report.averageScore) 
              : Number(report.averageScore);
            return isNaN(score) ? 0 : score;
          }
        )
      : calculateStandardRank(
          termReportResults, 
          report => {
            const score = typeof report.averageScore === 'string' 
              ? parseFloat(report.averageScore) 
              : Number(report.averageScore);
            return isNaN(score) ? 0 : score;
          }
        );
    
    // Update the ranks in the database with ordinal representation (1st, 2nd, 3rd, etc.)
    for (const report of termReportResults) {
      const rank = rankMap.get(report);
      if (rank !== undefined) {
        const rankStr = getOrdinalRank(rank);
        await db
          .update(termReports)
          .set({ 
            rank: rankStr,
            updatedAt: new Date()
          })
          .where(eq(termReports.id, report.id));
      }
    }
    
    return {
      success: true,
      message: `Updated overall rankings for ${termReportResults.length} students`,
      updatedCount: termReportResults.length
    };
  } catch (error) {
    console.error("Error recalculating overall rankings:", error);
    throw error;
  }
}

/**
 * Helper function to convert number to ordinal rank string (1st, 2nd, 3rd, etc.)
 */
function getOrdinalRank(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}