import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { getSession } from "@/lib/auth"
import db from "@/lib/db"
import { classes, classEnrollments, students, users, schools } from "@/lib/schema"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const classId = params.id

    // Verify the class exists and user has access
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      with: {
        school: true,
        classTeacher: true,
      },
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if user is admin of the school
    const userSchoolAdmin = classData.schoolId ? await db.query.schools.findFirst({
      where: and(
        eq(schools.id, classData.schoolId),
        eq(schools.adminId, userId)
      ),
    }) : null;

    // If user is not the admin, check if they're at least a teacher or staff
    const userIsStaffOrTeacher = userSchoolAdmin || classData.classTeacherId === userId

    if (!userIsStaffOrTeacher) {
      return NextResponse.json(
        { error: "You don't have permission to view this class" },
        { status: 403 }
      )
    }

    // Get all enrollments for this class with student details
    const enrollments = await db.query.classEnrollments.findMany({
      where: eq(classEnrollments.classId, classId),
      with: {
        student: true,
      },
      orderBy: (enrollment) => [enrollment.createdAt],
    })

    // Count total enrollments
    const studentCount = enrollments.length

    // Combine all data
    const classWithDetails = {
      ...classData,
      enrollments,
      studentCount,
    }

    return NextResponse.json(classWithDetails)
  } catch (error) {
    console.error("Error fetching class details:", error)
    return NextResponse.json(
      { error: "Failed to fetch class details" },
      { status: 500 }
    )
  }
} 