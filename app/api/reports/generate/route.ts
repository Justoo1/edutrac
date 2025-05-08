// app/api/reports/generate/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateTerminalReports } from '@/lib/services/terminalReportService';

export async function POST(
  req: Request,
) {
  console.log("Terminal report generation API called");
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log("Method not allowed");
    return NextResponse.json({ success: false, message: 'Method Not Allowed' }, {status: 405})
  }

  try {
    // Check authentication
    const session = await getSession();
    
    if (!session) {
        console.log("User not authenticated");
        return NextResponse.json({ success: false, message: 'Not authenticated' }, {status: 401})
    }
    
    // Check authorization - only admin and authorized staff can generate reports
    if (session.user.role !== 'admin' && session.user.role !== 'teacher') {
        console.log(`User ${session.user.id} with role ${session.user.role} not authorized`);
        return NextResponse.json({ success: false, message: 'Not authorized' }, {status: 403})
    }
    
    // Get parameters from request body
    const body = await req.json()
    const { schoolId, classId, academicYearId, academicTermId } = body;
    
    console.log(`Generating reports for school: ${schoolId}, class: ${classId}, year: ${academicYearId}, term: ${academicTermId}`);
    
    // Validate required parameters
    if (!schoolId || !classId || !academicYearId || !academicTermId) {
        console.log("Missing required parameters");
        return NextResponse.json({ 
          success: false, 
          message: 'Required parameters missing. Please provide schoolId, classId, academicYearId, and academicTermId' 
        }, {status: 400});
    }
    
    // Generate terminal reports
    console.log("Calling generateTerminalReports service");
    const result = await generateTerminalReports(schoolId, classId, academicYearId, academicTermId);
    
    console.log("Report generation result:", result);
    
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
  console.log(`Checking if teacher ${teacherId} is authorized for class ${classId}`);
  // For now, we'll just return true as a placeholder
  return true;
}