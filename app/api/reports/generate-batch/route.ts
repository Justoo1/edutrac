// pages/api/reports/generate-batch.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateTerminalReports } from '@/lib/services/terminalReportService';
import db from '@/lib/db';
import { eq } from 'drizzle-orm';
import { classes } from '@/lib/schema';

type ResponseData = {
  success: boolean;
  message: string;
  results?: Array<{
    classId: string;
    className: string;
    success: boolean;
    message: string;
  }>;
};

export async function POST(
  req: Request
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return NextResponse.json({ success: false, message: 'Method Not Allowed' }, { status: 405})
  }

  try {
    // Check authentication
    const session = await getSession();
    
    if (!session) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401})
    }
    
    // Check authorization - only admin can generate batch reports
    if (session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403})
    }
    
    // Get parameters from request body
    const body = await req.json()
    const { schoolId, academicYearId, academicTermId, classIds } = body;
    
    // Validate required parameters
    if (!schoolId || !academicYearId || !academicTermId) {
        return NextResponse.json({ 
            success: false, 
            message: 'Required parameters missing. Please provide schoolId, academicYearId, and academicTermId' 
          }, { status: 400})
    }
    
    // Determine which classes to process
    let classesToProcess: Array<{ id: string; name: string }> = [];
    
    if (classIds && Array.isArray(classIds) && classIds.length > 0) {
      // Process specific classes
      const fetchedClasses = await db.query.classes.findMany({
        where: (classes, { and, inArray }) => and(
          eq(classes.schoolId, schoolId),
          inArray(classes.id, classIds)
        ),
        columns: {
          id: true,
          name: true
        }
      });
      
      classesToProcess = fetchedClasses;
    } else {
      // Process all classes in the school
      const allClasses = await db.query.classes.findMany({
        where: eq(classes.schoolId, schoolId),
        columns: {
          id: true,
          name: true
        }
      });
      
      classesToProcess = allClasses;
    }
    
    if (classesToProcess.length === 0) {
        return NextResponse.json({ 
            success: false, 
            message: 'No valid classes found to process' 
          }, { status: 400})
    }
    
    // Process each class
    const results = [];
    
    for (const classInfo of classesToProcess) {
      try {
        console.log(`Processing class: ${classInfo.name} (${classInfo.id})`);
        
        const result = await generateTerminalReports(
          schoolId, 
          classInfo.id, 
          academicYearId, 
          academicTermId
        );
        
        results.push({
          classId: classInfo.id,
          className: classInfo.name,
          ...result
        });
      } catch (error) {
        console.error(`Error processing class ${classInfo.name}:`, error);
        
        results.push({
          classId: classInfo.id,
          className: classInfo.name,
          success: false,
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      }
    }
    
    // Check overall success
    const allSuccessful = results.every(result => result.success);
    
    // Return result
    return NextResponse.json({ 
        success: allSuccessful,
        message: allSuccessful 
          ? `Successfully processed ${results.length} classes` 
          : `Completed with some failures. ${results.filter(r => r.success).length} of ${results.length} classes processed successfully`,
        results
      }, {status:200})
  } catch (error) {
    console.error('Error in batch terminal report generation API:', error);
    return NextResponse.json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      }, { status: 500 })
  }
}