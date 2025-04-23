import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { schools, batches } from '@/lib/schema'
import db from '@/lib/db'
import { asc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });

    if (!school) return [];

    const batchesData = await db.query.batches.findMany({
      where: eq(batches.schoolId, school.id),
      orderBy: [asc(batches.gradeLevel)],
    });

    return NextResponse.json(batchesData || [])
  } catch (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 