// app/api/reports/student/download/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateStudentReport } from '@/lib/services/reportGenerator';

export async function GET(
  req: Request,
) {
  console.log("Student report download API called");
  
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
    
    console.log(`Generating PDF for student: ${studentId}, year: ${academicYearId}, term: ${academicTermId}`);
    
    // Validate required parameters
    if (!studentId || !academicYearId || !academicTermId) {
      console.log("Missing required parameters");
      return NextResponse.json({ 
        success: false, 
        message: 'Required parameters missing. Please provide studentId, academicYearId, and academicTermId' 
      }, {status: 400});
    }
    
    // Generate the report PDF
    const result = await generateStudentReport(studentId, academicYearId, academicTermId);
    
    // Return the PDF blob with appropriate headers
    return new NextResponse(result.blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.reportData.studentInfo.lastName}_${result.reportData.studentInfo.firstName}_Report.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error in student report download API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, {status: 500});
  }
}
