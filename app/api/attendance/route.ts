import { NextResponse } from "next/server"
import db from "@/lib/db"
import { attendance, classEnrollments, students, staff, classes, academicYears } from "@/lib/schema"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { and, eq, gte, lte, inArray, or } from "drizzle-orm"

interface AttendanceRecord {
  studentId: string
  classId: string
  date: Date
  status: string
  student: {
    id: string
    name: string
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const academicYear = await db.query.academicYears.findFirst({
      where: (and(
        eq(academicYears.isCurrent, true),
        eq(academicYears.schoolId, session.user.schoolId)
      )
      )
    })

    if (!academicYear) {
      return new NextResponse("Academic year not found", { status: 404 })
    }

    const body = await req.json()
    const { classId, weekId, dates, isEditing } = body

    // Get all students enrolled in the class
    const enrollments = await db.query.classEnrollments.findMany({
      where: eq(classEnrollments.classId, classId),
      with: {
        student: true
      }
    })

    if (isEditing) {
      // Get existing attendance records for the date range
      const existingRecords = await db.query.attendance.findMany({
        where: and(
          eq(attendance.classId, classId),
          eq(attendance.academicYearId, academicYear.id),
          eq(attendance.schoolId, session.user.schoolId),
          gte(attendance.date, new Date(dates[0])),
          lte(attendance.date, new Date(dates[dates.length - 1]))
        )
      })

      // Find students who don't have attendance records
      const studentsWithRecords = new Set(existingRecords.map(record => record.studentId))
      const newStudents = enrollments.filter(enrollment => !studentsWithRecords.has(enrollment.studentId))

      // Create attendance records only for new students
      const newAttendanceRecords = newStudents.flatMap(enrollment => 
        dates.map((date: string) => ({
          studentId: enrollment.studentId,
          classId,
          academicYearId: academicYear.id,
          schoolId: session.user.schoolId,
          date: new Date(date),
          status: "none",
          createdBy: session.user.id
        }))
      )

      
      if (newAttendanceRecords.length > 0) {
        console.log({ newAttendanceRecords })
        await db.insert(attendance).values(newAttendanceRecords)
      }

      return NextResponse.json({ 
        success: true, 
        message: `Added attendance records for ${newStudents.length} new students` 
      })
    } else {
      // Create attendance records for each student
      const attendanceRecords = enrollments.flatMap(enrollment => 
        dates.map((date: string) => ({
          studentId: enrollment.studentId,
          classId,
          academicYearId: academicYear.id,
          schoolId: session.user.schoolId,
          date: new Date(date),
          status: "none",
          createdBy: session.user.id
        }))
      )

      console.log({ attendanceRecords })

      // Insert attendance records
      await db.insert(attendance).values(attendanceRecords)

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("[ATTENDANCE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const academicYear = await db.query.academicYears.findFirst({
      where: (and(
        eq(academicYears.isCurrent, true),
        eq(academicYears.schoolId, session.user.schoolId)
      )
      )
    })

    if (!academicYear) {
      return new NextResponse("Academic year not found", { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId")
    const month = searchParams.get("month") // Format: YYYY-MM

    if (!classId || !month) {
      return new NextResponse("Missing required parameters", { status: 400 })
    }

    // Parse the month and get start/end dates
    const [year, monthNum] = month.split("-").map(Number)
    const startDate = new Date(year, monthNum - 1, 1) // First day of month
    const endDate = new Date(year, monthNum, 0) // Last day of month

    // Get all students in the class
    const classStudents = await db.query.classEnrollments.findMany({
      where: eq(classEnrollments.classId, classId),
      with: {
        student: {
          columns: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Get class information including teacher
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      with: {
        classTeacher: {
          columns: {
            id: true,
            name: true
          }
        }
      }
    })

    // Get attendance records for the month
    const attendanceRecords = await db.query.attendance.findMany({
      where: and(
        eq(attendance.classId, classId),
        eq(attendance.academicYearId, academicYear.id),
        eq(attendance.schoolId, session.user.schoolId),
        gte(attendance.date, startDate),
        lte(attendance.date, endDate)
      )
    })

    // Transform the data
    const students = classStudents.map(enrollment => ({
      id: enrollment.studentId,
      name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      attendance: attendanceRecords
        .filter(record => record.studentId === enrollment.studentId)
        .map(record => ({
          date: record.date.toISOString().split("T")[0],
          status: record.status,
          createdBy: classInfo?.classTeacher?.name || 'Unknown'
        }))
    }))

    return NextResponse.json(students)
  } catch (error) {
    console.error("[ATTENDANCE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const academicYear = await db.query.academicYears.findFirst({
      where: (and(
        eq(academicYears.isCurrent, true),
        eq(academicYears.schoolId, session.user.schoolId)
      )
      )
    })

    if (!academicYear) {
      return new NextResponse("Academic year not found", { status: 404 })
    }

    const body = await req.json()
    const { studentId, classId, date, status } = body

    // Update the attendance record
    await db.update(attendance)
      .set({ status })
      .where(and(
        eq(attendance.studentId, studentId),
        eq(attendance.schoolId, session.user.schoolId),
        eq(attendance.academicYearId, academicYear.id),
        eq(attendance.classId, classId),
        eq(attendance.date, new Date(date))
      ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ATTENDANCE_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 