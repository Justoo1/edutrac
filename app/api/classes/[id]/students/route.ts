// app/api/classes/[classId]/students/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { 
  classEnrollments, 
  students, 
  classes,
  studentClassHistory
} from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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
    
    const { id: classId } = await params;
    
    if (!classId) {
      return NextResponse.json(
        { success: false, message: 'Class ID is required' },
        { status: 400 }
      );
    }
    
    // Get class details to validate it belongs to the user's school
    const classDetails = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });
    
    if (!classDetails) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }
    
    // Check if the class belongs to the user's school
    if (classDetails.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to this class' },
        { status: 403 }
      );
    }
    
    // Get students enrolled in this class
    const enrollments = await db.query.classEnrollments.findMany({
      where: and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.status, "active")
      ),
      with: {
        student: true
      }
    });
    
    // Transform the data to return only the student information
    const studentsList = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      studentId: enrollment.student.studentId,
      firstName: enrollment.student.firstName,
      middleName: enrollment.student.middleName,
      lastName: enrollment.student.lastName,
      gender: enrollment.student.gender,
      dateOfBirth: enrollment.student.dateOfBirth,
      enrollmentDate: enrollment.enrollmentDate,
      status: enrollment.student.status,
    }));
    
    return NextResponse.json(studentsList);
  } catch (error) {
    console.error('Error fetching students for class:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch students'
      },
      { status: 500 }
    );
  }
}
