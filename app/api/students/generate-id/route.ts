import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"
import { students, schools } from "@/lib/schema"
import { eq, and, like } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get("schoolId")
    const prefix = searchParams.get("prefix") || ""

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    // Check if user has access to this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    })

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Count existing students with this prefix to generate a sequential number
    const existingStudents = await db.query.students.findMany({
      where: and(
        eq(students.schoolId, schoolId),
        like(students.studentId, `${prefix}%`)
      ),
    })

    // Generate a sequential number padded to 4 digits
    const nextNumber = (existingStudents.length + 1).toString().padStart(4, '0')

    return NextResponse.json({ number: nextNumber })
  } catch (error) {
    console.error("[GENERATE_STUDENT_ID]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 