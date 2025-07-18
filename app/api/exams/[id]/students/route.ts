import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { exams, examStudents } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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

    // Check if exam exists
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, id),
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Fetch students for this exam
    const students = await db.query.examStudents.findMany({
      where: eq(examStudents.examId, id),
      with: {
        student: true,
      },
    });

    // Transform the data to match the expected format in the frontend
    const transformedStudents = students.map(record => ({
      id: record.student.id,
      name: `${record.student.firstName} ${record.student.lastName}`,
      indexNumber: record.student.studentId,
      status: record.status,
      score: undefined, // These would come from examScores in a real implementation
      grade: undefined,
    }));

    return NextResponse.json(transformedStudents, { status: 200 });
  } catch (error) {
    console.error('Error fetching exam students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 