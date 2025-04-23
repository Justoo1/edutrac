import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import { examPeriods } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 })
    }

    const periods = await db.query.examPeriods.findMany({
      where: eq(examPeriods.schoolId, schoolId),
      orderBy: (periods, { desc }) => [desc(periods.createdAt)],
    })

    return NextResponse.json(periods)
  } catch (error) {
    console.error('Error fetching exam periods:', error)
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
    const { schoolId, name, academicYearId, academicTermId, startDate, endDate } = body

    if (!schoolId || !name || !academicYearId || !academicTermId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for overlapping periods
    const overlappingPeriod = await db.query.examPeriods.findFirst({
      where: and(
        eq(examPeriods.schoolId, schoolId),
        eq(examPeriods.academicYear, academicYearId),
        eq(examPeriods.term, academicTermId),
        eq(examPeriods.name, name)
      )
    })

    if (overlappingPeriod) {
      return NextResponse.json({ 
        error: 'An exam period with this academic year and term already exists',
        code: 'PERIOD_CONFLICT'
      }, { status: 409 })
    }

    const newPeriod = await db.insert(examPeriods).values({
      schoolId,
      name,
      academicYear: academicYearId,
      term: academicTermId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: false,
    }).returning()

    return NextResponse.json(newPeriod[0])
  } catch (error) {
    console.error('Error creating exam period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
