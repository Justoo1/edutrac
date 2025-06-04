// app/api/reports/student/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStudentReportData } from '@/lib/services/reportUtils';

export async function GET(
  req: Request,
) {
  console.log("Student report data API called");
  
  try {
    // Check authentication
    const session = await getSession();
    
    if (!session) {
        console.log("User not authenticated");
        return NextResponse.json({ success: false, message: 'Not authenticated' }, {status: 401})
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    const academicYearId = url.searchParams.get('academicYearId');
    const academicTermId = url.searchParams.get('academicTermId');
    
    console.log(`Fetching report data for student: ${studentId}, year: ${academicYearId}, term: ${academicTermId}`);
    
    // Validate required parameters
    if (!studentId || !academicYearId || !academicTermId) {
      console.log("Missing required parameters");
      return NextResponse.json({ 
        success: false, 
        message: 'Required parameters missing. Please provide studentId, academicYearId, and academicTermId' 
      }, {status: 400});
    }
    
    // Get the report data
    const reportData = await getStudentReportData(studentId, academicYearId, academicTermId);
    
    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error in student report API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, {status: 500});
  }
}
