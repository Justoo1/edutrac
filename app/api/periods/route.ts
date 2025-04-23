import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import { periods } from '@/lib/schema'
import { eq, and, not } from 'drizzle-orm'
import { schools } from '@/lib/schema'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { schoolId, time, label, type, orderIndex } = body

    if (!schoolId || !time || !label || !type || orderIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for existing period with same order index
    const existingPeriod = await db.query.periods.findFirst({
      where: and(
        eq(periods.schoolId, schoolId),
        eq(periods.orderIndex, orderIndex)
      )
    })

    if (existingPeriod) {
      return NextResponse.json({ 
        error: 'A period with this order index already exists',
        code: 'ORDER_CONFLICT'
      }, { status: 409 })
    }

    const newPeriod = await db.insert(periods).values({
      schoolId,
      time,
      label,
      type,
      orderIndex,
    }).returning()

    return NextResponse.json(newPeriod[0])
  } catch (error) {
    console.error('Error creating period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const schoolPeriods = await db.query.periods.findMany({
      where: eq(periods.schoolId, school.id),
      orderBy: (periods, { asc }) => [asc(periods.orderIndex)],
    })

    return NextResponse.json(schoolPeriods)
  } catch (error) {
    console.error('Error fetching periods:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract ID from URL path
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()

    if (!id) {
      return NextResponse.json({ error: 'Missing period ID in URL path' }, { status: 400 })
    }

    // Parse and validate body
    const body = await request.json()
    const { time, label, type, orderIndex } = body

    if (!time || !label || !type || orderIndex === undefined) {
      // Match the frontend validation message
      if (!label?.trim()) return NextResponse.json({ error: 'Label cannot be empty.'}, { status: 400 });
      if (!time) return NextResponse.json({ error: 'Time is required.'}, { status: 400 }); // Should be handled by frontend too
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for order index conflict (excluding the current period)
    const existingPeriodWithOrder = await db.query.periods.findFirst({
      where: and(
        eq(periods.schoolId, session.user.schoolId!), // Ensure check is for the correct school
        eq(periods.orderIndex, orderIndex),
        not(eq(periods.id, id)) // Exclude the period being updated
      )
    })

    if (existingPeriodWithOrder) {
      return NextResponse.json({ 
        error: 'A period with this order index already exists',
        code: 'ORDER_CONFLICT'
      }, { status: 409 })
    }

    // Perform the update
    const updatedPeriod = await db.update(periods)
      .set({
        time,
        label,
        type,
        orderIndex,
        updatedAt: new Date() // Update the timestamp
      })
      .where(and(
        eq(periods.id, id),
        eq(periods.schoolId, session.user.schoolId!) // Ensure update is only for the correct school
      ))
      .returning()

    if (updatedPeriod.length === 0) {
      return NextResponse.json({ error: 'Period not found or update failed' }, { status: 404 })
    }

    return NextResponse.json(updatedPeriod[0])
  } catch (error) {
    console.error('Error updating period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  // Implementation of DELETE handler
}
