// app/api/classes/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { classes, classEnrollments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
    const schoolId = url.searchParams.get('schoolId');
    
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
    
    // Get classes for this school with enrollment count
    const schoolClasses = await db.query.classes.findMany({
      where: eq(classes.schoolId, schoolId),
      with: {
        classTeacher: {
          columns: {
            id: true,
            name: true,
            position: true
          }
        },
        enrollments: {
          where: (enrollment) => eq(enrollment.status, 'active'),
          columns: {
            id: true,
            studentId: true
          }
        }
      },
      orderBy: [classes.gradeLevel, classes.name]
    });
    
    // Transform the data to include enrollment count
    const classesWithEnrollmentCount = schoolClasses.map(classItem => ({
      ...classItem,
      enrollmentCount: classItem.enrollments.length
    }));
    
    return NextResponse.json(classesWithEnrollmentCount);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch classes'
      },
      { status: 500 }
    );
  }
}
