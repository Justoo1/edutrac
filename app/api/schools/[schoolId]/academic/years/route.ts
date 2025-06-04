// app/api/schools/[schoolId]/academic/years/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { academicYears } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

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
    
    // Get academic years for this school
    const years = await db.query.academicYears.findMany({
      where: eq(academicYears.schoolId, schoolId),
      orderBy: [desc(academicYears.isCurrent), desc(academicYears.startDate)]
    });
    
    return NextResponse.json(years);
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch academic years'
      },
      { status: 500 }
    );
  }
}
