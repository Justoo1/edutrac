import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { exams, examStudents, schools, classEnrollments, studentSubjects, examPeriods, academicYears, academicTerms, examTypes } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';


export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const schoolId = searchParams.get('schoolId');
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');
    const responsibleStaffId = searchParams.get('responsibleStaffId');
    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }
    if (!academicYearId) {
      return NextResponse.json({ error: 'Academic Year ID is required' }, { status: 400 });
    }
    if (!termId) {
      return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
    }
    if (!responsibleStaffId) {
      return NextResponse.json({ error: 'Responsible Staff ID is required' }, { status: 400 });
    }

    const examsObjects = await db.query.exams.findMany({
      where: and(
        eq(exams.schoolId, schoolId),
        eq(exams.classId, classId),
        eq(exams.subjectId, subjectId),
        eq(exams.academicYear, academicYearId),
        eq(exams.term, termId),
        eq(exams.responsibleStaffId, responsibleStaffId)
      ),
      with: {
        examPeriod: true,
        class: true,
        subject: true,
        examType: true,
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
      },
    });

    console.log({examsObjects})

    return NextResponse.json(examsObjects, { status: 200 });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
