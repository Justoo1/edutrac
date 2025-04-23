import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"
import { subjects, courses, classSubjects, subjectCourses, batches } from "@/lib/schema"
import { eq, isNull, notInArray, asc } from "drizzle-orm"

// GET /api/subjects?schoolId=xxx
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const url = new URL(request.url)
    const schoolId = url.searchParams.get("schoolId")

    if (!schoolId) {
      return new Response("School ID is required", { status: 400 })
    }

    // Check if user has access to this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId)
    })

    if (!school || school.adminId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Fetch subjects with their student counts
    const subjectsList = await db.query.subjects.findMany({
      where: (subjects, { eq }) => eq(subjects.schoolId, schoolId),
      with: {
        school: true,
        course: true,
        studentEnrollments: {
          columns: {
            id: true
          }
        }
      }
    })

    // Transform the subjects to include student count
    const subjectsWithCounts = subjectsList.map(subject => ({
      ...subject,
      studentCount: subject.studentEnrollments.length
    }))

    return NextResponse.json({
      subjects: subjectsWithCounts,
      success: true,
    })
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

// POST /api/subjects
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, description, schoolId, courseId, isOptional } = body
    console.log({ name, code, description, schoolId, courseId, isOptional })

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if user has access to this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.adminId, session.user.id)
    })

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create the subject
    const [subject] = await db.insert(subjects).values({
      name,
      code,
      description,
      schoolId: school.id,
      courseId: school.schoolType === 'SHS' ? courseId : null,
      isOptional: school.schoolType === 'SHS' ? isOptional : false,
    }).returning()

    // Fetch the created subject with its course if SHS
    const createdSubject = await db.query.subjects.findFirst({
      where: (subjects, { eq }) => eq(subjects.id, subject.id),
      with: {
        school: true,
        ...(school.schoolType === 'SHS' ? {
          course: true
        } : {})
      }
    })

    return NextResponse.json({
      subject: createdSubject,
      success: true,
    })
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}