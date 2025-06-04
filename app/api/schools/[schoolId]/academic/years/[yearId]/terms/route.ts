// app/api/schools/[schoolId]/academic/years/[yearId]/terms/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { academicTerms, academicYears } from '@/lib/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: { schoolId: string; yearId: string } }
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
    
    const { schoolId, yearId } = params;
    
    if (!schoolId || !yearId) {
      return NextResponse.json(
        { success: false, message: 'School ID and Year ID are required' },
        { status: 400 }
      );
    }
    
    // Check if the school belongs to the user
    if (schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to this school' },
        { status: 403 }
      );
    }
    
    // Get year details to verify it belongs to the school
    const year = await db.query.academicYears.findFirst({
      where: and(
        eq(academicYears.id, yearId),
        eq(academicYears.schoolId, schoolId)
      )
    });
    
    if (!year) {
      return NextResponse.json(
        { success: false, message: 'Academic year not found or does not belong to this school' },
        { status: 404 }
      );
    }
    
    // Get terms for this academic year
    const terms = await db.query.academicTerms.findMany({
      where: and(
        eq(academicTerms.academicYearId, yearId),
        eq(academicTerms.schoolId, schoolId)
      ),
      orderBy: [asc(academicTerms.termNumber)]
    });
    
    return NextResponse.json(terms);
  } catch (error) {
    console.error('Error fetching academic terms:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch academic terms'
      },
      { status: 500 }
    );
  }
}
