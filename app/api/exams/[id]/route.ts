import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { exams } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { truncates } from 'bcryptjs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, id),
      with: {
        examPeriod: true,
        class: true,
        subject: true,
        examType:{
          columns:{
            id: true,
            name: true
          }
        },
        examStudents: {
          columns: {
            id: true,
            studentId: true,
            status: true,
          },
          with: {
            student: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
        examScores: {
          columns: {
            rawScore: true,
            id: true,
            studentId:true
          },
          with:{
            student: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          }
        },
      },
    });

    console.log({exam})

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json(exam, { status: 200 });
  } catch (error) {
    console.error('Error fetching exam details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    // Check if exam exists and belongs to the user's school
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, id),
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the exam
    await db.delete(exams).where(eq(exams.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 