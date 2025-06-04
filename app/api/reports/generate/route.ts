import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateClassReports, recalculateOverallRankings, recalculateSubjectRankings } from '@/lib/services/reportGenerator';
import { updateTermReports } from '@/lib/services/reportUpdater';
import db from '@/lib/db';
import { classes, schools, subjects, termReports } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(
  req: Request,
) {
  console.log("Terminal report generation API called");
  
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
    const body = await req.json();
    const { 
      schoolId, 
      classId, 
      academicYearId, 
      academicTermId,
      options = {}
    } = body;
    
    console.log(`Generating reports for school: ${schoolId}, class: ${classId}, year: ${academicYearId}, term: ${academicTermId}`);
    
    // Validate required parameters
    if (!schoolId || !classId || !academicYearId || !academicTermId) {
      console.log("Missing required parameters");
      return NextResponse.json({ 
        success: false, 
        message: 'Required parameters missing. Please provide schoolId, classId, academicYearId, and academicTermId' 
      }, {status: 400});
    }
    
    // Get class and subject info
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, classId)
    });

    const schoolInfo = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId)
    });
    
    if (!classInfo) {
      return NextResponse.json({
        success: false,
        message: `Class with ID ${classId} not found`
      }, {status: 404});
    }
    
    if (!schoolInfo) {
      return NextResponse.json({
        success: false,
        message: `School with ID ${schoolId} not found`
      }, {status: 404});
    }
    
    // Get all subjects for this class
    const classSubjects = await db.query.subjects.findMany({
      where: eq(subjects.schoolId, schoolId)
    });
    
    // Generate the reports
    try {
      console.log('Checking for existing term reports and details...');
      
      // First check if we have existing report details
      const existingReports = await db.query.termReports.findMany({
        where: and(
          eq(termReports.academicYearId, academicYearId),
          eq(termReports.academicTermId, academicTermId)
        ),
        with: {
          details: true
        }
      });
      
      console.log(`Found ${existingReports.length} existing reports with ${existingReports.reduce((count, report) => count + report.details.length, 0)} total detail records`);
      
      // First ensure all term reports and details exist
      console.log('Updating term reports...');
      
      // Now call the function directly instead of using fetch
      console.log('Calling updateTermReports directly...');
      const updateResult = await updateTermReports(
        schoolId,
        classId,
        academicYearId,
        academicTermId,
        schoolInfo.schoolType!,
        options
      );
      
      if (!updateResult.success) {
        console.warn(`Failed to update term reports: ${updateResult.message}`);
      } else {
        console.log(`Term reports successfully updated: ${updateResult.message}`);
        
        // Check again after update
        const updatedReports = await db.query.termReports.findMany({
          where: and(
            eq(termReports.academicYearId, academicYearId),
            eq(termReports.academicTermId, academicTermId)
          ),
          with: {
            details: true
          }
        });
        
        console.log(`After update: Found ${updatedReports.length} reports with ${updatedReports.reduce((count, report) => count + report.details.length, 0)} total detail records`);
        
        // Log details of the first report to check what fields are present
        if (updatedReports.length > 0 && updatedReports[0].details.length > 0) {
          console.log('Sample report detail:', JSON.stringify(updatedReports[0].details[0], null, 2));
        } else {
          console.warn('No report details found after update!');
        }
      }
    } catch (error) {
      console.warn('Error updating term reports:', error);
    }
    
    // Recalculate rankings for all subjects
    for (const subject of classSubjects) {
      await recalculateSubjectRankings(
        subject.id,
        classId,
        academicYearId,
        academicTermId,
        'dense' // Use dense ranking by default
      );
    }
    
    // Recalculate overall rankings
    await recalculateOverallRankings(
      classId,
      academicYearId,
      academicTermId,
      'dense' // Use dense ranking by default
    );
    
    // Generate the reports
    const result = await generateClassReports(
      classId,
      academicYearId,
      academicTermId,
      {
        studentIds: options.generateForAllStudents ? undefined : options.studentIds,
        includeAll: options.generateForAllStudents
      }
    );
    
    // Create a simplified result with the necessary information
    const reportResult = {
      success: result.success,
      message: result.message,
      reportsCount: result.totalGenerated,
      failedCount: result.totalFailed,
      reportUrl: "/api/reports/download" // This would be a URL to download all reports as a ZIP
    };
    
    return NextResponse.json(reportResult);
  } catch (error) {
    console.error('Error in terminal report generation API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, {status: 500});
  }
}
