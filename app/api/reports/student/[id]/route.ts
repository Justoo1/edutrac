// app/api/reports/student/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { termReports, termReportDetails, students, gradeSystem, classEnrollments, examPeriods } from '@/lib/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    
    // Check authentication
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const examPeriodId = searchParams.get('examPeriodId');
    const academicYearId = searchParams.get('academicYearId');
    const academicTermId = searchParams.get('academicTermId');
    
    if (!studentId || !examPeriodId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Required parameters missing. Please provide studentId and examPeriodId'
      }, { status: 400 });
    }
    
    // Check authorization
    if (session.user.role !== 'admin') {
      if (session.user.role === 'teacher') {
        // Check if teacher is authorized for this student
        const isAuthorized = await isTeacherAuthorizedForStudent(session.user.id, studentId);
        
        if (!isAuthorized) {
          return NextResponse.json({ 
            success: false, 
            message: 'You are not authorized to view this student\'s report' 
          }, { status: 403 });
        }
      } else if (session.user.role === 'student') {
        // Students can only view their own reports
        if (session.user.id !== studentId) {
          return NextResponse.json({ 
            success: false, 
            message: 'You are not authorized to view this report' 
          }, { status: 403 });
        }
      } else {
        // Other roles not authorized
        return NextResponse.json({ 
          success: false, 
          message: 'Not authorized' 
        }, { status: 403 });
      }
    }
    
    // Get term report
    const termReport = await db.query.termReports.findFirst({
      where: and(
        eq(termReports.studentId, studentId),
        eq(termReports.academicTermId, academicTermId as string),
        eq(termReports.academicYearId, academicYearId as string)
      ),
      with: {
        student: true
      }
    });
    
    if (!termReport) {
      return NextResponse.json({ 
        success: false, 
        message: 'Terminal report not found' 
      }, { status: 404 });
    }
    
    // Get term report details (subject scores)
    const reportDetails = await db.query.termReportDetails.findMany({
      where: eq(termReportDetails.termReportId, termReport.id),
      with: {
        subject: true
      }
    });
    
    // Get grades for all report details
    const gradeIds = reportDetails.map(detail => detail.gradeId).filter(Boolean);
    const filteredGradeIds = gradeIds.filter(id => id !== null) as number[];
    const grades = filteredGradeIds.length > 0 
      ? await db.query.gradeSystem.findMany({
          where: sql`id IN (${sql.join(filteredGradeIds, sql`, `)})`
        })
      : [];
    
    // Map grades to details
    const detailsWithGrades = reportDetails.map(detail => {
      const grade = grades.find(g => g.id === detail.gradeId);
      return {
        ...detail,
        gradeName: grade?.gradeName || null,
        gradeInterpretation: grade?.interpretation || null,
        gradePoint: grade?.gradePoint || null
      };
    });
    
    // Get student details
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        school: true,
        enrollments: {
          where: eq(classEnrollments.status, "active"),
          with: {
            class: true
          }
        }
      }
    });
    
    if (!student) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student not found' 
      }, { status: 404 });
    }
    
    // Get exam period details
    const examPeriod = await db.query.examPeriods.findFirst({
      where: eq(examPeriods.id, parseInt(examPeriodId))
    });

    // Get subject names separately
    const subjectIds = detailsWithGrades.map(d => d.subjectId);
    const subjectMap = new Map();

    const subjectData = await db.query.subjects.findMany({
      where: sql`id IN (${sql.join(subjectIds, sql`, `)})`,
      columns: {
        id: true,
        name: true
      }
    });

    // Create lookup map
    for (const subject of subjectData) {
      subjectMap.set(subject.id, subject.name);
    }
    
    // Construct and return the report
    return NextResponse.json({
      success: true,
      report: {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim(),
          studentId: student.studentId, // School-issued ID
          class: student.enrollments[0]?.class?.name || 'Unknown',
          gradeLevel: student.enrollments[0]?.class?.gradeLevel || 'Unknown'
        },
        school: student.school,
        termInfo: {
          examPeriod: examPeriod,
          averageScore: termReport.averageScore,
          position: termReport.rank,
          remarks: termReport.remarks
        },
        subjects: detailsWithGrades.map(detail => {
          return {
            id: detail.subjectId,
            name: subjectMap.get(detail.subjectId) || 'Unknown Subject',
            classScore: parseFloat(detail.classScore as string),
            examScore: parseFloat(detail.examScore as string),
            totalScore: parseFloat(detail.totalScore as string),
            grade: detail.gradeName,
            gradePoint: detail.gradePoint,
            interpretation: detail.gradeInterpretation,
            position: detail.classPosition || null
          };
        })
      }
    });
  } catch (error) {
    console.error('Error retrieving terminal report:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}

// Helper function to check teacher authorization
async function isTeacherAuthorizedForStudent(teacherId: string, studentId: string): Promise<boolean> {
  // Implementation depends on your data model
  // A teacher might be authorized if they:
  // 1. Are the class teacher for the student's class
  // 2. Teach at least one subject to the student's class
  
  // For simplicity, we'll allow any teacher to view any student's report
  // In a real implementation, you would check the teacher's relationship to the student
  return true;
}