// app/api/reports/comments/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { termReports, classes, classEnrollments } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';

// GET to fetch comments for a class
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
        inArray(termReports.studentId, studentIds)
      ),
      columns: {
        id: true,
        studentId: true,
        remarks: true
      }
    });
    
    // Extract the comments from the remarks field
    const commentsData = reports.map(report => {
      // Parse remarks as JSON if it's stored that way
      let teacherComment = '';
      let headComment = '';
      let additionalComments = '';
      
      try {
        if (report.remarks) {
          // Try to parse as JSON if it's stored that way
          const remarksObj = JSON.parse(report.remarks);
          teacherComment = remarksObj.teacher || '';
          headComment = remarksObj.headmaster || '';
          additionalComments = remarksObj.additional || '';
        }
      } catch (e) {
        // If not JSON, it might be a simple string
        teacherComment = report.remarks || '';
      }
      
      return {
        reportId: report.id,
        studentId: report.studentId,
        teacherComment,
        headComment,
        additionalComments
      };
    });
    
    return NextResponse.json(commentsData);
  } catch (error) {
    console.error('Error fetching report comments:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch report comments'
      },
      { status: 500 }
    );
  }
}

// POST to save comments for multiple students
export async function POST(
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
    
    // Get request body
    const body = await req.json();
    const { comments } = body;
    
    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No comments provided' },
        { status: 400 }
      );
    }
    
    // Process each comment
    const results = [];
    for (const comment of comments) {
      const { studentId, academicYearId, academicTermId, teacherComment, headComment, additionalComments } = comment;
      
      if (!studentId || !academicYearId || !academicTermId) {
        results.push({
          success: false,
          studentId,
          message: 'Missing required fields'
        });
        continue;
      }
      
      // Check if the student belongs to a class in the user's school
      const enrollment = await db.query.classEnrollments.findFirst({
        where: and(
          eq(classEnrollments.studentId, studentId),
          eq(classEnrollments.status, "active")
        ),
        with: {
          class: {
            columns: {
              schoolId: true
            }
          }
        }
      });
      
      if (!enrollment || enrollment.class.schoolId !== session.user.schoolId) {
        results.push({
          success: false,
          studentId,
          message: 'Unauthorized access to this student'
        });
        continue;
      }
      
      // Find existing term report
      const existingReport = await db.query.termReports.findFirst({
        where: and(
          eq(termReports.studentId, studentId),
          eq(termReports.academicYearId, academicYearId),
          eq(termReports.academicTermId, academicTermId)
        )
      });
      
      if (!existingReport) {
        results.push({
          success: false,
          studentId,
          message: 'No term report found for this student'
        });
        continue;
      }
      
      // Create a JSON structure for the remarks field
      const remarksObj = {
        teacher: teacherComment || '',
        headmaster: headComment || '',
        additional: additionalComments || ''
      };
      
      // Update the term report with the comments
      await db
        .update(termReports)
        .set({
          remarks: JSON.stringify(remarksObj),
          updatedAt: new Date()
        })
        .where(eq(termReports.id, existingReport.id));
      
      results.push({
        success: true,
        studentId,
        reportId: existingReport.id
      });
    }
    
    return NextResponse.json({
      success: true,
      resultsCount: results.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Error saving report comments:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to save report comments'
      },
      { status: 500 }
    );
  }
}
