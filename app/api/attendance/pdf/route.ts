import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { academicYears, attendance, classEnrollments, classes } from "@/lib/schema"
import { and, eq, gte, lte } from "drizzle-orm"
import { format } from "date-fns"

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
    const month = searchParams.get("month")
    const weekFilter = searchParams.get("weekFilter")

    if (!classId || !month) {
      return new NextResponse("Missing required parameters", { status: 400 })
    }

    // Parse the month and get start/end dates
    const [year, monthNum] = month.split("-").map(Number)
    const startDate = new Date(year, monthNum - 1, 1) // First day of month
    const endDate = new Date(year, monthNum, 0) // Last day of month

    // Get class info
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      with: {
        classTeacher: true
      }
    })

    if (!classInfo) {
      return new NextResponse("Class not found", { status: 404 })
    }

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

    // Generate dates array based on month and week filter
    const allDates = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      allDates.push(format(d, "yyyy-MM-dd"))
    }

    // Filter dates by week if needed
    const dates = weekFilter ? allDates.filter(date => {
      const dayOfMonth = new Date(date).getDate()
      switch(weekFilter) {
        case "week1": return dayOfMonth <= 7
        case "week2": return dayOfMonth > 7 && dayOfMonth <= 14
        case "week3": return dayOfMonth > 14 && dayOfMonth <= 21
        case "week4": return dayOfMonth > 21
        default: return true
      }
    }) : allDates

    // Transform the data
    const students = classStudents.map(enrollment => ({
      id: enrollment.studentId,
      name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      attendance: dates.map(date => {
        const record = attendanceRecords.find(r => 
          r.studentId === enrollment.studentId && 
          format(r.date, "yyyy-MM-dd") === date
        )
        return {
          date,
          status: record?.status === "present" ? "present" : 
                 record?.status === "absent" ? "absent" : 
                 "none"
        }
      })
    }))

    return NextResponse.json({
      classInfo: {
        name: classInfo.name,
        teacher: classInfo.classTeacher ? `${classInfo.classTeacher.name}` : "Unknown",
        createdBy: `${session.user.name}`
      },
      students,
      dates,
      month: format(startDate, "MMMM yyyy"),
      ...(weekFilter ? { weekFilter } : {})
    })
  } catch (error) {
    console.error("[ATTENDANCE_PDF_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 