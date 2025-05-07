// pages/api/reports/generate.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateTerminalReports } from '@/lib/services/terminalReportService';

export async function POST(
  req: Request,
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return NextResponse.json({ success: false, message: 'Method Not Allowed' }, {status: 405})
  }

  try {
    // Check authentication
    const session = await getSession();
    
    if (!session) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, {status: 401})
    }
    
    // Check authorization - only admin and authorized staff can generate reports
    if (session.user.role !== 'admin' && session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Not authorized' }, {status: 403})
    }
    
    // Get parameters from request body
    const body = await req.json()
    const { schoolId, classId, academicYearId, academicTermId } = body;
    
    // Validate required parameters
    if (!schoolId || !classId || !academicYearId || !academicTermId) {
        return NextResponse.json({ success: false, message: 'Required parameters missing. Please provide schoolId, classId, academicYearId, and academicTermId' }, {status: 400});
    }
    
    // If teacher, check if they are authorized for this class
    if (session.user.role === 'teacher') {
      // For a teacher, we'd check if they're assigned to this class
      // This would depend on your specific authorization model
      // This is just a placeholder example
      const isAuthorized = await isTeacherAuthorizedForClass(session.user.id, classId);
      
      if (!isAuthorized) {
        return NextResponse.json({ success: false, message: 'You are not authorized to generate reports for this class' }, {status: 403})
      }
    }
    
    // Generate terminal reports
    const result = await generateTerminalReports(schoolId, classId, academicYearId, academicTermId);
    
    // Return result
    if (result.success) {
        return NextResponse.json(result, {status: 200})
    } else {
        return NextResponse.json(result, {status: 500})
    }
  } catch (error) {
    console.error('Error in terminal report generation API:', error);
    return NextResponse.json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      }, {status: 500})
  }
}

// Helper function to check teacher authorization
async function isTeacherAuthorizedForClass(teacherId: string, classId: string): Promise<boolean> {
  // This would be implemented based on your specific data model
  // For example, checking if the teacher is a class teacher or teaches a subject in this class
  // For now, we'll just return true as a placeholder
  return true;
}