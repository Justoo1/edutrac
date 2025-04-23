import { AttendancePageWrapper } from "@/components/dashboard/attendance/attendance-page-wrapper"
import { Suspense } from "react"

export default function AttendancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttendancePageWrapper />
    </Suspense>
  )
}

