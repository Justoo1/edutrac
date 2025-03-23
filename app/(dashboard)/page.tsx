import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import db from "@/lib/db";
import { getSchoolStats } from "@/lib/fetchers";
import {
  Users,
  GraduationCap,
  School,
  CalendarCheck,
  FileText,
  Banknote
} from "lucide-react";
import Link from "next/link";
import RecentAnnouncements from "@/components/dashboard/recent-announcements";
import UpcomingEvents from "@/components/dashboard/upcoming-events";
import AttendanceChart from "@/components/dashboard/attendance-chart";

export default async function DashboardHome({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  
  // Fetch the school data for the logged-in user
  const school = await db.query.schools.findFirst({
    where: (schools, { eq }) => eq(schools.adminId, session.user.id),
  });

  if (!school) {
    notFound();
  }

  // Get statistics for the school
  const stats = await getSchoolStats(school.id);

  // Card data for quick access
  const cards = [
    {
      title: "Students",
      value: stats.studentCount,
      icon: Users,
      color: "bg-blue-500",
      link: "/dashboard/students"
    },
    {
      title: "Staff",
      value: stats.staffCount,
      icon: School,
      color: "bg-green-500",
      link: "/dashboard/staff"
    },
    {
      title: "Classes",
      value: stats.classCount,
      icon: GraduationCap,
      color: "bg-amber-500",
      link: "/dashboard/classes"
    },
    {
      title: "Attendance",
      value: "96%",
      icon: CalendarCheck,
      color: "bg-purple-500",
      link: "/dashboard/attendance"
    },
    {
      title: "Assessments",
      value: "12",
      icon: FileText,
      color: "bg-rose-500",
      link: "/dashboard/assessments"
    },
    {
      title: "Finances",
      value: "GH₵ 25,400",
      icon: Banknote,
      color: "bg-cyan-500",
      link: "/dashboard/finances"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {session.user.name}</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Here&apos;s what&apos;s happening at {school.name} today.
        </p>
      </div>

      {/* Quick stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.link}
            className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center">
              <div className={`rounded-full ${card.color} p-3 text-white`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts and recent data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attendance chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Daily Attendance</h3>
          <div className="h-80">
            <AttendanceChart schoolId={school.id} />
          </div>
        </div>

        {/* Recent announcements */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Recent Announcements</h3>
          <RecentAnnouncements schoolId={school.id} />
        </div>
      </div>

      {/* Upcoming events */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Upcoming Events</h3>
        <UpcomingEvents schoolId={school.id} />
      </div>
    </div>
  );
}