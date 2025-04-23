import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import { timetables } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const academicYearId = searchParams.get('academicYearId')
    const academicTermId = searchParams.get('academicTermId')

    if (!schoolId || !academicYearId || !academicTermId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schedules = await db.query.timetables.findMany({
      where: and(
        eq(timetables.schoolId, schoolId),
        eq(timetables.academicYearId, academicYearId),
        eq(timetables.academicTermId, academicTermId)
      ),
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { schoolId, academicYearId, academicTermId, classId, subjectId, teacherId, day, period, room } = body

    if (!schoolId || !academicYearId || !academicTermId || !classId || !subjectId || !teacherId || !day || !period || !room) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for existing schedule in the same time slot
    const existingSchedule = await db.query.timetables.findFirst({
      where: and(
        eq(timetables.academicTermId, academicTermId),
        eq(timetables.day, day),
        eq(timetables.period, period),
        eq(timetables.classId, classId)
      )
    })

    if (existingSchedule) {
      return NextResponse.json({ 
        error: 'This time slot is already taken for this class',
        code: 'SCHEDULE_CONFLICT'
      }, { status: 409 })
    }

    // Also check if teacher is already scheduled for this period
    const existingTeacherSchedule = await db.query.timetables.findFirst({
      where: and(
        eq(timetables.academicTermId, academicTermId),
        eq(timetables.day, day),
        eq(timetables.period, period),
        eq(timetables.teacherId, teacherId)
      )
    })

    if (existingTeacherSchedule) {
      return NextResponse.json({ 
        error: 'The selected teacher is already scheduled for this period',
        code: 'TEACHER_CONFLICT'
      }, { status: 409 })
    }

    const newSchedule = await db.insert(timetables).values({
      schoolId,
      academicYearId,
      academicTermId,
      classId,
      subjectId,
      teacherId,
      day,
      period,
      room,
    }).returning()

    return NextResponse.json(newSchedule[0])
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 