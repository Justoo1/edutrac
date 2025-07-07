// Replace the attendance section in your dashboard with this:

import { AttendanceChart } from "@/components/dashboard/attendance-chart"

// In your dashboard component, replace the attendance card with:
<div className="md:col-span-1 lg:col-span-4">
  <AttendanceChart
    data={attendance.weeklyData}
    overallRate={attendance.attendanceRate}
    totalStudents={statistics.studentsCount}
  />
</div>
