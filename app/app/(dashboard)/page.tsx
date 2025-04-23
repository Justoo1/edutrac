import { StatsCard } from "@/components/dashboard/stats-card"
import { AttendanceChart } from "@/components/dashboard/attendance-chart"
import { EarningsChart } from "@/components/dashboard/earnings-chart"
import { StudentActivity } from "@/components/dashboard/students/student-activity"
import { NoticeBoard } from "@/components/dashboard/notice-board"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { ArrowUp, Award, School, User, Users } from "lucide-react"
import { redirect } from "next/navigation"
import db from "@/lib/db"
import { eq } from "drizzle-orm"
import { schools } from "@/lib/schema"
import { getSession } from "@/lib/auth"

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
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Students"
          value="124,684"
          icon={<Users className="h-5 w-5" />}
          trend={
            <span className="text-emerald-500 flex items-center text-xs">
              <ArrowUp className="h-3 w-3 mr-1" /> 15%
            </span>
          }
          color="bg-purple-100"
          iconColor="text-purple-500"
        />
        <StatsCard
          title="Teachers"
          value="12,379"
          icon={<School className="h-5 w-5" />}
          trend={
            <span className="text-emerald-500 flex items-center text-xs">
              <ArrowUp className="h-3 w-3 mr-1" /> 3%
            </span>
          }
          color="bg-amber-100"
          iconColor="text-amber-500"
        />
        <StatsCard
          title="Staffs"
          value="29,300"
          icon={<User className="h-5 w-5" />}
          trend={
            <span className="text-emerald-500 flex items-center text-xs">
              <ArrowUp className="h-3 w-3 mr-1" /> 3%
            </span>
          }
          color="bg-purple-100"
          iconColor="text-purple-500"
        />
        <StatsCard
          title="Awards"
          value="95,800"
          icon={<Award className="h-5 w-5" />}
          trend={
            <span className="text-emerald-500 flex items-center text-xs">
              <ArrowUp className="h-3 w-3 mr-1" /> 5%
            </span>
          }
          color="bg-amber-100"
          iconColor="text-amber-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-1 lg:col-span-3">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between p-6">
              <h3 className="text-lg font-medium">Students</h3>
              <button className="text-sm text-muted-foreground">•••</button>
            </div>
            <div className="p-6 pt-0">
              <div className="flex justify-center">
                <div className="relative h-40 w-40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-blue-400">
                          <Users className="h-5 w-5" />
                        </span>
                        <span className="text-amber-400">
                          <Users className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <h4 className="text-2xl font-bold">45,414</h4>
                  <p className="text-sm text-muted-foreground">Boys (47%)</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold">40,270</h4>
                  <p className="text-sm text-muted-foreground">Girls (53%)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-1 lg:col-span-4">
          <AttendanceChart />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-1 lg:col-span-4">
          <EarningsChart />
        </div>
        <div className="md:col-span-1 lg:col-span-3">
          <div className="grid gap-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Olympic Students</p>
                    <h3 className="text-2xl font-bold">24,680</h3>
                  </div>
                  <div className="rounded-md bg-cyan-100 p-2 text-cyan-600">
                    <School className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[15%] rounded-full bg-cyan-500"></div>
                    </div>
                    <span className="ml-2 text-xs font-medium">15%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Competition</p>
                    <h3 className="text-2xl font-bold">3,000</h3>
                  </div>
                  <div className="rounded-md bg-amber-100 p-2 text-amber-600">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[8%] rounded-full bg-red-500"></div>
                    </div>
                    <span className="ml-2 text-xs font-medium">8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StudentActivity />
        <NoticeBoard />
        <div className="space-y-6">
          <CalendarWidget />
          <RecentActivity />
        </div>
      </div>
    </div>  
  )
}
