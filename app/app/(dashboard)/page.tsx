import { StatsCard } from "@/components/dashboard/stats-card"
import { AttendanceChart, AttendanceData } from "@/components/dashboard/attendance-chart"
import { EarningsChart } from "@/components/dashboard/earnings-chart"
import { StudentActivity } from "@/components/dashboard/students/student-activity"
import { NoticeBoard } from "@/components/dashboard/notice-board"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { 
  ArrowUp, 
  ArrowDown,
  Award, 
  School, 
  User, 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BookOpen,
  Calendar,
  Clock,
  Bell,
  Target,
  PieChart
} from "lucide-react"
import { redirect } from "next/navigation"
import db from "@/lib/db"
import { eq, and, sql, desc, asc } from "drizzle-orm"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "recharts"

// Enhanced Dashboard with Real Database Integration
export default async function DashboardPage() {
  const session = await getSession();
  if(!session) {
    redirect("/login")
  }
  
  // Get school information
  const school = await db.query.schools.findFirst({
    where: eq(schools.adminId, session.user.id),
  });
  
  if(!school) {
    redirect("/onboarding")
  }

  // Get current academic year and term
  const currentAcademicYear = await db.query.academicYears.findFirst({
    where: and(
      eq(academicYears.schoolId, school.id),
      eq(academicYears.isCurrent, true)
    )
  });

  const currentTerm = await db.query.academicTerms.findFirst({
    where: and(
      eq(academicTerms.schoolId, school.id),
      eq(academicTerms.isCurrent, true)
    )
  });

  // Fetch real dashboard data
  const dashboardData = await Promise.all([
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
    db.select()
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
      total: sql<number>`sum(${feePayments.amount})`,
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
      date: sql<string>`DATE(${attendance.date})`,
      status: attendance.status,
      count: sql<number>`CAST(count(*) AS INTEGER)`
    })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .where(and(
        eq(students.schoolId, school.id),
        sql`${attendance.date} >= CURRENT_DATE - INTERVAL '7 days'`
      ))
      .groupBy(sql`DATE(${attendance.date})`, attendance.status)
      .orderBy(desc(sql`DATE(${attendance.date})`)),

    // Top performing students (based on term results)
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
      total: sql<number>`sum(${expenses.amount})`,
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
  ]);

  const [
    totalStudents,
    totalStaff,
    totalClasses,
    recentAnnouncements,
    feeCollectionData,
    attendanceData,
    topStudents,
    monthlyExpenses,
    genderDistribution
  ] = dashboardData;

  const processedAttendanceData: AttendanceData[] = attendanceData.reduce((acc: any[], curr) => {
    const existingDate = acc.find(item => item.date === curr.date);
    
    if (existingDate) {
      if (curr.status === 'present') {
        existingDate.present = Number(curr.count); // Convert to number
      } else if (curr.status === 'absent') {
        existingDate.absent = Number(curr.count); // Convert to number
      }
    } else {
      acc.push({
        date: curr.date,
        present: curr.status === 'present' ? Number(curr.count) : 0, // Convert to number
        absent: curr.status === 'absent' ? Number(curr.count) : 0, // Convert to number
        total: 0,
        rate: 0
      });
    }
    
    return acc;
  }, []);

  // Calculate totals and rates
  processedAttendanceData.forEach(day => {
    day.total = day.present + day.absent;
    day.rate = day.total > 0 ? Math.round((day.present / day.total) * 100) : 0;
  });

  // Calculate statistics
  const studentsCount = totalStudents[0]?.count || 0;
  const staffCount = totalStaff[0]?.count || 0;
  const classesCount = totalClasses[0]?.count || 0;
  const feesCollected = feeCollectionData[0]?.total || 0;
  const paymentCount = feeCollectionData[0]?.count || 0;

  // Calculate gender percentages
  const maleCount = genderDistribution.find(g => g.gender === 'male')?.count || 0;
  const femaleCount = genderDistribution.find(g => g.gender === 'female')?.count || 0;
  const totalGenderCount = maleCount + femaleCount;
  const malePercentage = totalGenderCount > 0 ? Math.round((maleCount / totalGenderCount) * 100) : 0;
  const femalePercentage = totalGenderCount > 0 ? Math.round((femaleCount / totalGenderCount) * 100) : 0;

  // Calculate attendance rate
  const presentCount = attendanceData
  .filter(a => a.status === 'present')
  .reduce((sum, a) => sum + Number(a.count), 0)

  const totalAttendanceCount = attendanceData
    .reduce((sum, a) => sum + Number(a.count), 0)

  const attendanceRate = totalAttendanceCount > 0 
    ? Math.round((presentCount / totalAttendanceCount) * 100) 
    : 0

  console.log({attendanceRate, presentCount, totalAttendanceCount})

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {school.name}!</h1>
            <p className="text-blue-100 mt-2">
              Here&apos;s what&apos;s happening at your school today
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Academic Year</p>
            <p className="text-xl font-semibold">{currentAcademicYear?.name || 'Not Set'}</p>
            <p className="text-blue-100 text-sm">{currentTerm?.name || 'No Active Term'}</p>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={studentsCount.toLocaleString()}
          iconName="Users"
          
          color="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Teaching Staff"
          value={staffCount.toLocaleString()}
          iconName="School"
          
          color="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatsCard
          title="Classes"
          value={classesCount.toLocaleString()}
          iconName="BookOpen"
          
          color="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Fees Collected"
          value={`GH₵ ${feesCollected.toLocaleString()}`}
          iconName="DollarSign"
          trend={{
            value: feesCollected.toLocaleString(),
            isPositive: true,
            label: `${feesCollected.toLocaleString()} payments`
          }}
          color="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Enhanced Student Demographics */}
        <div className="md:col-span-1 lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Student Demographics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative h-40 w-40">
                    <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        strokeDasharray={`${(malePercentage / 100) * 283} 283`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="10"
                        strokeDasharray={`${(femalePercentage / 100) * 283} 283`}
                        strokeDashoffset={`-${(malePercentage / 100) * 283}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{studentsCount}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">Boys</span>
                    </div>
                    <div className="text-2xl font-bold">{maleCount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">({malePercentage}%)</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                      <span className="text-sm font-medium">Girls</span>
                    </div>
                    <div className="text-2xl font-bold">{femaleCount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">({femalePercentage}%)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Attendance Chart */}
        <div className="md:col-span-1 lg:col-span-4">
          <AttendanceChart data={processedAttendanceData} overallRate={attendanceRate} totalStudents={studentsCount} />
        </div>
      </div>

      {/* Performance and Financial Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Performing Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Leading students this term
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStudents.map((student, index) => (
                <div key={student.studentId} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{student.studentName}</p>
                      <Badge variant="secondary">{student.className}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{student.totalSubjects} subjects</span>
                      <span className="font-medium text-green-600">
                        {student.averageScore?.toFixed(1)}% avg
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Announcements
            </CardTitle>
            <CardDescription>
              Latest school updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium line-clamp-2">{announcement.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  {announcement.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {announcement.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Frequently used features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <button className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Add New Student</p>
                  <p className="text-xs text-muted-foreground">Register a new student</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Record Payment</p>
                  <p className="text-xs text-muted-foreground">Process fee payment</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Send Announcement</p>
                  <p className="text-xs text-muted-foreground">Broadcast to parents</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">View Reports</p>
                  <p className="text-xs text-muted-foreground">Academic performance</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StudentActivity />
        <div className="space-y-6">
          <CalendarWidget />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Academic Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Term Ends</p>
                    <p className="text-xs text-muted-foreground">Current term conclusion</p>
                  </div>
                  <Badge variant="secondary">
                    {currentTerm?.endDate ? new Date(currentTerm.endDate).toLocaleDateString() : 'TBD'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Academic Year</p>
                    <p className="text-xs text-muted-foreground">
                      {currentAcademicYear?.status || 'Not Set'}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {currentAcademicYear?.name || 'N/A'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <RecentActivity />
      </div>
    </div>
  )
}