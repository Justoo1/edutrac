import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"
import { subjects, courses, classSubjects, subjectCourses, batches } from "@/lib/schema"
import { eq, isNull, notInArray, asc } from "drizzle-orm"

// PUT /api/subjects/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, code, description, courseIds } = body

    if (!id || !name) {
      return new Response("ID or name are required", { status: 400 })
    }

    // Get the subject to check ownership
    const subject = await db.query.subjects.findFirst({
      where: (subjects, { eq }) => eq(subjects.id, id)
    })

    if (!subject) {
      return new Response("Subject not found", { status: 404 })
    }

    // Check if user has access to this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, subject.schoolId ?? "")
    })

    if (!school || school.adminId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Update the subject
    const [updatedSubject] = await db
      .update(subjects)
      .set({
        name,
        code,
        description,
        updatedAt: new Date(),
      })
      .where(eq(subjects.id, id))
      .returning()

    // If SHS school, update course relationships
    if (school.schoolType === 'SHS') {
      // Delete existing course relationships
      await db.delete(subjectCourses).where(eq(subjectCourses.subjectId, id))
      
      // Create new course relationships if provided
      if (courseIds?.length > 0) {
        await db.insert(subjectCourses).values(
          courseIds.map((courseId: string) => ({
            subjectId: id,
            courseId,
          }))
        )
      }
    }

    // Fetch the updated subject with its courses if SHS
    const finalSubject = await db.query.subjects.findFirst({
      where: (subjects, { eq }) => eq(subjects.id, id),
      with: {
        school: true,
        ...(school.schoolType === 'SHS' ? {
          course: true
        } : {})
      }
    })

    return NextResponse.json({
      subject: finalSubject,
      success: true,
    })
  } catch (error) {
    console.error("Error updating subject:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

// DELETE /api/subjects/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return new Response("ID is required", { status: 400 })
    }

    // Get the subject to check ownership
    const subject = await db.query.subjects.findFirst({
      where: (subjects, { eq }) => eq(subjects.id, id)
    })

    if (!subject) {
      return new Response("Subject not found", { status: 404 })
    }

    // Check if user has access to this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, subject.schoolId ?? "")
    })

    if (!school || school.adminId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Delete the subject (cascade will handle related records)
    await db.delete(subjects).where(eq(subjects.id, id))

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting subject:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
} 