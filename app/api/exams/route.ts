import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { exams, examStudents, schools, classEnrollments, studentSubjects, examPeriods, academicYears, academicTerms, examTypes } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      examPeriodId,
      subjectId,
      termId,
      classId,
      examTypeId,
      totalMarks,
      passingMarks,
      examCode,
      staffId,
      duration,
      date,
      startTime,
      endTime,
    } = body;

    // Validate required fields
    if (!name || !subjectId || !classId || !examTypeId || !totalMarks || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, session.user.schoolId!),
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const esxitingExam = await db.query.exams.findFirst({
      where: and(
        eq(exams.schoolId, session.user.schoolId!),
        eq(exams.subjectId, subjectId),
        eq(exams.classId, classId),
        eq(exams.examType, examTypeId),
      ),
    });

    if (esxitingExam) {
      return NextResponse.json({ error: 'Exam already exists' }, { status: 400 });
    }

    let examPeriodToUse = examPeriodId;
    // Get current academic year and term
    const currentYear = await db.query.academicYears.findFirst({
      where: and(
        eq(academicYears.schoolId, session.user.schoolId!),
        eq(academicYears.isCurrent, true)
      ),
    });

    const currentTerm = await db.query.academicTerms.findFirst({
      where: eq(academicTerms.id, termId)
    })

    
    if (!currentYear) {
      return NextResponse.json({ error: 'Current academic year not found' }, { status: 404 });
    }
    if (!currentTerm) {
      return NextResponse.json({ error: 'Academic term not found' }, { status: 404 });
    }

    // If no exam period is selected, create a new one using current academic year and term
    if (!examPeriodId) {
      const examType = await db.query.examTypes.findFirst({
        where: eq(examTypes.id, examTypeId),
      });


      const [newExamPeriod] = await db.insert(examPeriods).values({
        schoolId: session.user.schoolId!,
        name: `${name} - ${currentYear.name} ${currentTerm.name} - ${examType?.name} session`,
        academicYear: currentYear.id,
        term: currentTerm.id,
        startDate: new Date(date),
        endDate: new Date(date),
        isActive: true,
      }).returning();

      examPeriodToUse = newExamPeriod.id;
    }
    console.log({examPeriodToUse, examTypeId});
    // Create the exam
    const [newExam] = await db.insert(exams).values({
      schoolId: session.user.schoolId!,
      examPeriodId: parseInt(examPeriodToUse),
      classId,
      subjectId,
      examType: examTypeId,
      academicYear: currentYear.id,
      term: currentTerm.id,
      examCode: examCode,
      responsibleStaffId: staffId,
      name,
      description,
      totalMarks,
      duration,
      examDate: new Date(date),
      status: 'draft',
      createdBy: session.user.id,
    }).returning();

    // Handle student enrollment based on school type
    if (school.schoolType === 'BASIC') {
      // For BASIC schools, enroll all students in the class
      const classStudents = await db.query.classEnrollments.findMany({
        where: eq(classEnrollments.classId, classId),
      });

      // Create exam student records
      const examStudentRecords = classStudents.map(student => ({
        id: createId(), // Keep using createId() for examStudents if its id is a string type
        examId: newExam.id,
        studentId: student.studentId,
        status: 'assigned',
      }));

      if (examStudentRecords.length > 0) {
        await db.insert(examStudents).values(examStudentRecords);
      }
    } else if (school.schoolType === 'SHS') {
      // For SHS schools, only enroll students who offer the subject
      const subjectStudents = await db.query.studentSubjects.findMany({
        where: and(
          eq(studentSubjects.subjectId, subjectId),
          eq(studentSubjects.status, 'active')
        ),
      });

      // Get class students to filter
      const classStudents = await db.query.classEnrollments.findMany({
        where: eq(classEnrollments.classId, classId),
      });

      // Create exam student records only for students who offer the subject
      const examStudentRecords = subjectStudents
        .filter(subjectStudent => 
          classStudents.some(classStudent => classStudent.studentId === subjectStudent.studentId)
        )
        .map(student => ({
          id: createId(), // Keep using createId() for examStudents if its id is a string type
          examId: newExam.id,
          studentId: student.studentId,
          status: 'assigned',
        }));

      if (examStudentRecords.length > 0) {
        await db.insert(examStudents).values(examStudentRecords);
      }
    }

    return NextResponse.json(newExam, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const status = searchParams.get('status')
    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    const now = new Date();
    
    const exams_ = await db.query.exams.findMany({
      where: eq(exams.schoolId, schoolId),
      with: {
        examPeriod: true,
        class: true,
        subject: true,
        examType: {
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
      },
    });
    if(status){
      const newExams = exams_.filter(
        (exam) => 
          (exam.status === status) && 
          exam.examDate && new Date(exam.examDate) > now
      );
      console.log({newExams})
      return NextResponse.json(newExams, { status: 200 });
    }

    console.log({exams_})

    return NextResponse.json(exams_, { status: 200 });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
