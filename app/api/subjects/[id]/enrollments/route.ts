import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"
import { subjects, studentSubjects } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: User not authenticated" },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { studentIds } = body

    console.log("Enrollment request:", { id, studentIds })

    if (!id) {
      return NextResponse.json(
        { error: "Bad Request: Subject ID is required" },
        { status: 400 }
      )
    }

    if (!studentIds) {
      return NextResponse.json(
        { error: "Bad Request: Student IDs array is required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: "Bad Request: Student IDs must be an array" },
        { status: 400 }
      )
    }

    if (studentIds.length === 0) {
      return NextResponse.json(
        { error: "Bad Request: At least one student ID is required" },
        { status: 400 }
      )
    }

    // Verify subject exists and belongs to user's school
    const subject = await db.query.subjects.findFirst({
      where: (subjects, { eq }) => eq(subjects.id, id)
    })

    if (!subject) {
      return NextResponse.json(
        { error: `Not Found: Subject with ID ${id} not found` },
        { status: 404 }
      )
    }

    // Check if user has access to this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, subject.schoolId ?? '')
    })

    if (!school) {
      return NextResponse.json(
        { error: `Not Found: School with ID ${subject.schoolId} not found` },
        { status: 404 }
      )
    }

    if (school.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to manage this school's subjects" },
        { status: 403 }
      )
    }

    // Create enrollments
    const enrollments = studentIds.map(studentId => ({
      subjectId: id,
      studentId,
      enrolledAt: new Date()
    }))

    try {
      await db.insert(studentSubjects).values(enrollments)
      return NextResponse.json({ 
        success: true,
        message: `Successfully enrolled ${studentIds.length} student(s) in subject ${subject.name}`
      })
    } catch (dbError) {
      console.error("Database error during enrollment:", dbError)
      return NextResponse.json(
        { 
          error: "Database Error: Failed to create enrollments",
          details: dbError instanceof Error ? dbError.message : "Unknown database error"
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in enrollment endpoint:", error)
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "An unexpected error occurred"
      },
      { status: 500 }
    )
  }
} 