// app/api/schools/[schoolId]/academic/terms/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { academicTerms } from '@/lib/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
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
    
    const { schoolId } = await params;
    
    if (!schoolId) {
      return NextResponse.json(
        { success: false, message: 'School ID is required' },
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
    
    // Get URL query parameters
    const url = new URL(req.url);
    const academicYearId = url.searchParams.get('academicYearId');
    
    let terms;
    
    if (academicYearId) {
      // Get terms for a specific academic year
      terms = await db.query.academicTerms.findMany({
        where: and(
          eq(academicTerms.schoolId, schoolId),
          eq(academicTerms.academicYearId, academicYearId)
        ),
        orderBy: [asc(academicTerms.termNumber)]
      });
    } else {
      // Get all terms for the school
      terms = await db.query.academicTerms.findMany({
        where: eq(academicTerms.schoolId, schoolId),
        orderBy: [asc(academicTerms.academicYearId), asc(academicTerms.termNumber)]
      });
    }
    
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
