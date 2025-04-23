'use client'

// import { ProfileHeader } from '@/components/dashboard/header/ProfileHeader'
// import { SearchBar } from '@/components/dashboard/header/SearchBar'
import { AttendanceWidget } from '@/components/dashboard/students/widgets/AttendanceWidget'
import { TaskCompletedWidget } from '@/components/dashboard/students/widgets/TaskCompletedWidget'
import { TaskInProgressWidget } from '@/components/dashboard/students/widgets/TaskInProgressWidget'
import { RewardPointsWidget } from '@/components/dashboard/students/widgets/RewardPointsWidget'
import { CalendarWidget } from '@/components/dashboard/students/calendar/CalendarWidget'
import { PerformanceMeter } from '@/components/dashboard/students/performance/PerformanceMeter'
import { ScoreActivityChart } from '@/components/dashboard/students/charts/ScoreActivityChart'
import { GradeBySubjectChart } from '@/components/dashboard/students/charts/GradeBySubjectChart'
import { RecentActivity } from '@/components/dashboard/students/activity/RecentActivity'
import { AgendaList } from '@/components/dashboard/students/agenda/AgendaList'
import { MessagesList } from '@/components/dashboard/students/messages/MessageList'
import { AssignmentsTable } from '@/components/dashboard/students/assignments/AssignmentsTable'
import { NoticeBoard } from '../../notice-board'

export default function StudentDashboard() {
  return (
    <div className="p-6 pl-8">
      <div className="flex justify-between items-start mb-6">
        {/* <h1 className="text-2xl font-bold">SchoolHub</h1>
        <div className="flex gap-4 items-center">
          <SearchBar />
          <div className="flex gap-2 items-center">
            <span className="relative">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </span>
            <span className="text-sm font-medium">Mia Williams</span>
            <img className="w-8 h-8 rounded-full" src="/mia-williams.jpg" alt="Mia Williams" />
          </div>
        </div> */}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Profile Header Section */}
        {/* <div className="col-span-12 lg:col-span-8">
          <ProfileHeader />
        </div> */}

        {/* Stats Widgets Section */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
          <AttendanceWidget percentage={97} />
          <TaskCompletedWidget count={258} />
          <TaskInProgressWidget percentage={64} />
          <RewardPointsWidget points={245} />
        </div>

        {/* Performance and Calendar Row */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5">
            <PerformanceMeter gpa={3.4} maxGpa={4.0} />
          </div>
          <div className="col-span-12 md:col-span-7">
            <CalendarWidget />
          </div>
        </div>

        {/* Agenda Section */}
        <div className="col-span-12 lg:col-span-4">
          <AgendaList />
        </div>

        {/* Score Activity Chart */}
        <div className="col-span-12 lg:col-span-8">
          <ScoreActivityChart />
        </div>

        
        <div className="col-span-12 lg:col-span-12 grid grid-cols-12 gap-2">
          {/* Messages Section */}
            <div className="col-span-12 lg:col-span-4">
                <MessagesList />
            </div>
            <div className="col-span-12 md:col-span-4">
                <NoticeBoard />
            </div>
          {/* Recent Activity Section */}
            <div className="col-span-12 lg:col-span-4">
            <RecentActivity />
            </div>
        </div>

        

        {/* Grade by Subject Chart */}
        <div className="col-span-12 lg:col-span-12">
          <GradeBySubjectChart />
        </div>

        {/* Assignments Table (Full Width) */}
        <div className="col-span-12">
          <AssignmentsTable />
        </div>
      </div>
    </div>
  )
}