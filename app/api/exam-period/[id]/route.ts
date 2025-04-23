import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import { examPeriods } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const { id } = await params
  
      if (!id) {
        return NextResponse.json({ error: 'Missing period ID' }, { status: 400 })
      }
  
      const body = await request.json()
      const { name, academicYear, term, startDate, endDate, isActive } = body
  
      if (!name || !academicYear || !term || !startDate || !endDate) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
  
      // Check for overlapping periods (excluding current period)
      const overlappingPeriod = await db.query.examPeriods.findFirst({
        where: and(
          eq(examPeriods.schoolId, session.user.schoolId!),
          eq(examPeriods.academicYear, academicYear),
          eq(examPeriods.term, term),
          eq(examPeriods.id, parseInt(id))
        )
      })
  
      if (overlappingPeriod) {
        return NextResponse.json({ 
          error: 'An exam period with this academic year and term already exists',
          code: 'PERIOD_CONFLICT'
        }, { status: 409 })
      }
  
      const updatedPeriod = await db.update(examPeriods)
        .set({
          name,
          academicYear,
          term,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: isActive ?? false,
          updatedAt: new Date()
        })
        .where(and(
          eq(examPeriods.id, parseInt(id)),
          eq(examPeriods.schoolId, session.user.schoolId!)
        ))
        .returning()
  
      if (updatedPeriod.length === 0) {
        return NextResponse.json({ error: 'Period not found' }, { status: 404 })
      }
  
      return NextResponse.json(updatedPeriod[0])
    } catch (error) {
      console.error('Error updating exam period:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  
  export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const { id } = await params
  
      if (!id) {
        return NextResponse.json({ error: 'Missing period ID' }, { status: 400 })
      }
  
      const deletedPeriod = await db.delete(examPeriods)
        .where(and(
          eq(examPeriods.id, parseInt(id)),
          eq(examPeriods.schoolId, session.user.schoolId!)
        ))
        .returning()
  
      if (deletedPeriod.length === 0) {
        return NextResponse.json({ error: 'Period not found' }, { status: 404 })
      }
  
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting exam period:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  