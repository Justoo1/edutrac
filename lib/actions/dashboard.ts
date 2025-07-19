"use server"

import db from "@/lib/db"
import { eq, and, sql, desc } from "drizzle-orm"
import { 
  schools, 
  students, 
  staff, 
  classes, 
  attendance, 
  feePayments, 
  schoolContent,
  academicYears,
  academicTerms,
  termResults,
  expenses,
  financialTransactions
} from "@/lib/schema"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export interface DashboardData {
  school: {
    id: string
    name: string
    // Add other school properties as needed
  }
  currentAcademicYear: {
    id: string
    name: string
    status: string
  } | null
  currentTerm: {
    id: string
    name: string
    endDate: Date
  } | null
  statistics: {
    studentsCount: number
    staffCount: number
    classesCount: number
    feesCollected: number
    paymentCount: number
  }
  demographics: {
    maleCount: number
    femaleCount: number
    malePercentage: number
    femalePercentage: number
  }
  attendance: {
    presentCount: number
    totalAttendanceCount: number
    attendanceRate: number
    weeklyData: Array<{
      date: Date
      status: string
      count: number
    }>
  }
  topStudents: Array<{
    studentId: string
    studentName: string
    averageScore: number
    totalSubjects: number
    className: string | null
  }>
  recentAnnouncements: Array<{
    id: string
    title: string | null
    description: string | null
    createdAt: Date
  }>
  financialData: {
    monthlyExpenses: Array<{
      total: number
      month: string
    }>
    totalRevenue: number
    totalExpenses: number
    netIncome: number
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const session = await getSession()
  
  if (!session) {
    redirect("/login")
  }

  // Get school information
  const school = await db.query.schools.findFirst({
    where: eq(schools.adminId, session.user.id),
    columns: {
      id: true,
      name: true,
    }
  })

  if (!school) {
    redirect("/onboarding")
  }

  // Get current academic year and term
  const currentAcademicYear = await db.query.academicYears.findFirst({
    where: and(
      eq(academicYears.schoolId, school.id),
      eq(academicYears.isCurrent, true)
    ),
    columns: {
      id: true,
      name: true,
      status: true,
    }
  })

  const currentTerm = await db.query.academicTerms.findFirst({
    where: and(
      eq(academicTerms.schoolId, school.id),
      eq(academicTerms.isCurrent, true)
    ),
    columns: {
      id: true,
      name: true,
      endDate: true,
    }
  })

  // Fetch all dashboard data in parallel
  const [
    studentsData,
    staffData,
    classesData,
    announcementsData,
    feeData,
    attendanceData,
    topStudentsData,
    expensesData,
    demographicsData
  ] = await Promise.all([
    // Total students count
    db.select({ count: sql<number>`count(*)` })
      .from(students)
      .where(and(
        eq(students.schoolId, school.id),
        eq(students.status, 'active')
      )),

    // Total staff count
    db.select({ count: sql<number>`count(*)` })
      .from(staff)
      .where(and(
        eq(staff.schoolId, school.id),
        eq(staff.isActive, true)
      )),

    // Total classes count
    db.select({ count: sql<number>`count(*)` })
      .from(classes)
      .where(eq(classes.schoolId, school.id)),

    // Recent announcements
    db.select({
      id: schoolContent.id,
      title: schoolContent.title,
      description: schoolContent.description,
      createdAt: schoolContent.createdAt,
    })
      .from(schoolContent)
      .where(and(
        eq(schoolContent.schoolId, school.id),
        eq(schoolContent.contentType, 'announcement'),
        eq(schoolContent.published, true)
      ))
      .orderBy(desc(schoolContent.createdAt))
      .limit(5),

    // Total fees collected this academic year
    db.select({ 
      total: sql<number>`coalesce(sum(${feePayments.amount}), 0)`,
      count: sql<number>`count(*)`
    })
      .from(feePayments)
      .leftJoin(students, eq(feePayments.studentId, students.id))
      .where(and(
        eq(students.schoolId, school.id),
        eq(feePayments.academicYear, currentAcademicYear?.name || new Date().getFullYear().toString())
      )),

    // Recent attendance data
    db.select({
      date: attendance.date,
      status: attendance.status,
      count: sql<number>`count(*)`
    })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .where(and(
        eq(students.schoolId, school.id),
        sql`${attendance.date} >= CURRENT_DATE - INTERVAL '7 days'`
      ))
      .groupBy(attendance.date, attendance.status)
      .orderBy(desc(attendance.date)),

    // Top performing students
    db.select({
      studentId: termResults.studentId,
      studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
      averageScore: sql<number>`avg(${termResults.totalScore})`,
      totalSubjects: sql<number>`count(*)`,
      className: classes.name
    })
      .from(termResults)
      .leftJoin(students, eq(termResults.studentId, students.id))
      .leftJoin(classes, eq(termResults.classId, classes.id))
      .where(and(
        eq(termResults.schoolId, school.id),
        eq(termResults.academicYear, currentAcademicYear?.name || new Date().getFullYear().toString()),
        eq(termResults.term, currentTerm?.name || 'First Term')
      ))
      .groupBy(termResults.studentId, students.firstName, students.lastName, classes.name)
      .orderBy(desc(sql`avg(${termResults.totalScore})`))
      .limit(5),

    // Monthly expenses
    db.select({
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      month: sql<string>`date_trunc('month', ${expenses.expenseDate})`
    })
      .from(expenses)
      .where(and(
        eq(expenses.schoolId, school.id),
        sql`${expenses.expenseDate} >= CURRENT_DATE - INTERVAL '6 months'`
      ))
      .groupBy(sql`date_trunc('month', ${expenses.expenseDate})`)
      .orderBy(desc(sql`date_trunc('month', ${expenses.expenseDate})`)),

    // Gender distribution
    db.select({
      gender: students.gender,
      count: sql<number>`count(*)`
    })
      .from(students)
      .where(and(
        eq(students.schoolId, school.id),
        eq(students.status, 'active')
      ))
      .groupBy(students.gender)
  ])

  // Process the data
  const studentsCount = studentsData[0]?.count || 0
  const staffCount = staffData[0]?.count || 0
  const classesCount = classesData[0]?.count || 0
  const feesCollected = feeData[0]?.total || 0
  const paymentCount = feeData[0]?.count || 0

  // Calculate demographics
  const maleCount = demographicsData.find(g => g.gender === 'male')?.count || 0
  const femaleCount = demographicsData.find(g => g.gender === 'female')?.count || 0
  const totalGenderCount = maleCount + femaleCount
  const malePercentage = totalGenderCount > 0 ? Math.round((maleCount / totalGenderCount) * 100) : 0
  const femalePercentage = totalGenderCount > 0 ? Math.round((femaleCount / totalGenderCount) * 100) : 0

  // Calculate attendance
  const presentCount = attendanceData.filter(a => a.status === 'present').reduce((sum, a) => sum + a.count, 0)
  const totalAttendanceCount = attendanceData.reduce((sum, a) => sum + a.count, 0)
  const attendanceRate = totalAttendanceCount > 0 ? Math.round((presentCount / totalAttendanceCount) * 100) : 0

  // Calculate financial data
  const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.total, 0)
  const totalRevenue = feesCollected // For now, assuming revenue is mainly from fees
  const netIncome = totalRevenue - totalExpenses

  return {
    school: {
      id: school.id,
      name: school.name,
    },
    currentAcademicYear: currentAcademicYear ?? null,
    currentTerm: currentTerm ?? null,
    statistics: {
      studentsCount,
      staffCount,
      classesCount,
      feesCollected,
      paymentCount,
    },
    demographics: {
      maleCount,
      femaleCount,
      malePercentage,
      femalePercentage,
    },
    attendance: {
      presentCount,
      totalAttendanceCount,
      attendanceRate,
      weeklyData: attendanceData,
    },
    topStudents: topStudentsData,
    recentAnnouncements: announcementsData,
    financialData: {
      monthlyExpenses: expensesData,
      totalRevenue,
      totalExpenses,
      netIncome,
    },
  }
}

// Additional helper functions for specific dashboard sections
export async function getSchoolStatistics(schoolId: string) {
  const [studentsCount, staffCount, classesCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(students)
      .where(and(
        eq(students.schoolId, schoolId),
        eq(students.status, 'active')
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(staff)
      .where(and(
        eq(staff.schoolId, schoolId),
        eq(staff.isActive, true)
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(classes)
      .where(eq(classes.schoolId, schoolId)),
  ])

  return {
    studentsCount: studentsCount[0]?.count || 0,
    staffCount: staffCount[0]?.count || 0,
    classesCount: classesCount[0]?.count || 0,
  }
}

export async function getFinancialSummary(schoolId: string, academicYear?: string) {
  const [feeData, expensesData] = await Promise.all([
    db.select({ 
      total: sql<number>`coalesce(sum(${feePayments.amount}), 0)`,
      count: sql<number>`count(*)`
    })
      .from(feePayments)
      .leftJoin(students, eq(feePayments.studentId, students.id))
      .where(and(
        eq(students.schoolId, schoolId),
        academicYear ? eq(feePayments.academicYear, academicYear) : undefined
      )),
    
    db.select({
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
    })
      .from(expenses)
      .where(eq(expenses.schoolId, schoolId)),
  ])

  const totalRevenue = feeData[0]?.total || 0
  const totalExpenses = expensesData[0]?.total || 0
  const netIncome = totalRevenue - totalExpenses

  return {
    totalRevenue,
    totalExpenses,
    netIncome,
    paymentCount: feeData[0]?.count || 0,
  }
}

export async function getTopPerformers(schoolId: string, limit = 5) {
  return await db.select({
    studentId: termResults.studentId,
    studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
    averageScore: sql<number>`avg(${termResults.totalScore})`,
    totalSubjects: sql<number>`count(*)`,
    className: classes.name
  })
    .from(termResults)
    .leftJoin(students, eq(termResults.studentId, students.id))
    .leftJoin(classes, eq(termResults.classId, classes.id))
    .where(eq(termResults.schoolId, schoolId))
    .groupBy(termResults.studentId, students.firstName, students.lastName, classes.name)
    .orderBy(desc(sql`avg(${termResults.totalScore})`))
    .limit(limit)
}
