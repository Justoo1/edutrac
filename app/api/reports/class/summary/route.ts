// app/api/reports/class/summary/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { termReports, classes, classEnrollments } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: Request
) {
  try {
    // Check authentication
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const classId = url.searchParams.get('classId');
    const academicYearId = url.searchParams.get('academicYearId');
    const academicTermId = url.searchParams.get('academicTermId');
    
    if (!classId || !academicYearId || !academicTermId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: classId, academicYearId, academicTermId' },
        { status: 400 }
      );
    }
    
    // Get class details to validate it belongs to the user's school
    const classDetails = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });
    
    if (!classDetails) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }
    
    // Check if the class belongs to the user's school
    if (classDetails.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to this class' },
        { status: 403 }
      );
    }
    
    // Get all active students in this class
    const studentEnrollments = await db.query.classEnrollments.findMany({
      where: and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.status, "active")
      ),
      columns: {
        studentId: true
      }
    });
    
    const studentIds = studentEnrollments.map(enrollment => enrollment.studentId);
    
    if (studentIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get term reports for these students
    const reports = await db.query.termReports.findMany({
      where: and(
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId),
      ),
      with: {
        student: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true
          }
        }
      }
    });
    
    // Filter reports for students in this class
    const classReports = reports.filter(report => 
      studentIds.includes(report.studentId)
    );
    
    // Transform reports to include student info
    const summaryData = classReports.map(report => ({
      id: report.id,
      studentId: report.studentId,
      studentName: `${report.student.firstName} ${report.student.lastName}`,
      studentIdNumber: report.student.studentId,
      averageScore: report.averageScore,
      totalMarks: report.totalMarks,
      rank: report.rank
    }));
    
    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('Error fetching class report summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch class report summary'
      },
      { status: 500 }
    );
  }
}
