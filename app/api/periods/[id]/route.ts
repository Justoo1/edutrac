import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import db from "@/lib/db"
import { periods } from "@/lib/schema"
import { eq, and, not } from "drizzle-orm"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getSession()
      if (!session || !session.user.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const { id: periodId } = await params;

      if (!periodId) {
        return NextResponse.json({ error: 'Missing period ID in URL' }, { status: 400 });
      }

      const body = await request.json()
      const { time, label, type, orderIndex } = body
  
      if (!time || !label?.trim() || !type || orderIndex === undefined) {
        return NextResponse.json({ error: 'Missing required fields in body' }, { status: 400 })
      }
  
      const existingPeriod = await db.query.periods.findFirst({
        where: and(
          eq(periods.schoolId, session.user.schoolId),
          eq(periods.orderIndex, orderIndex),
          not(eq(periods.id, periodId))
        )
      })
  
      if (existingPeriod) {
        return NextResponse.json({ 
          error: 'A period with this order index already exists',
          code: 'ORDER_CONFLICT'
        }, { status: 409 })
      }
  
      const updatedPeriod = await db.update(periods)
        .set({
          time,
          label,
          type,
          orderIndex,
          updatedAt: new Date(),
        })
        .where(and(
            eq(periods.id, periodId),
            eq(periods.schoolId, session.user.schoolId)
        ))
        .returning()
        
      if (updatedPeriod.length === 0) {
          return NextResponse.json({ error: 'Period not found or not authorized to update' }, { status: 404 });
      }
  
      return NextResponse.json(updatedPeriod[0])
    } catch (error) {
      console.error('Error updating period:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  
  export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getSession()
      if (!session || !session.user.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const { id: periodId } = await params
  
      if (!periodId) {
        return NextResponse.json({ error: 'Missing period ID' }, { status: 400 })
      }
      
      const deleteResult = await db.delete(periods)
        .where(and(
            eq(periods.id, periodId),
            eq(periods.schoolId, session.user.schoolId)
        ))
        .returning({ id: periods.id });

      if (deleteResult.length === 0) {
          return NextResponse.json({ error: 'Period not found or not authorized to delete' }, { status: 404 });
      }
  
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting period:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  } 