import { NextResponse } from 'next/server'
import { getGradeLevels } from '@/lib/fetchers'
import { getSession } from '@/lib/auth'
import { schools } from '@/lib/schema'
import db from '@/lib/db'
import { asc, eq } from 'drizzle-orm'
import { gradeLevels } from '@/lib/schema'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });
    console.log({school})

    if (!school) return [];

    const gradeLevelsData = await db.query.gradeLevels.findMany({
      where: eq(gradeLevels.schoolId, school.id),
      orderBy: [asc(gradeLevels.name)],
    });

    console.log({gradeLevelsData})

    return NextResponse.json(gradeLevelsData || [])
  } catch (error) {
    console.error('Error fetching grade levels:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 