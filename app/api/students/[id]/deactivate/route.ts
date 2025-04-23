import { NextResponse } from "next/server"
import db from "@/lib/db"
import { students } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Update student status to inactive
    await db.update(students)
      .set({ status: 'inactive' })
      .where(eq(students.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deactivating student:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate student' },
      { status: 500 }
    )
  }
} 