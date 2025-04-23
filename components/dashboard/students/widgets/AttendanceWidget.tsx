'use client'

import { Card, CardContent } from "@/components/ui/card"

interface AttendanceWidgetProps {
  percentage: number
}

export function AttendanceWidget({ percentage }: AttendanceWidgetProps) {
  return (
    <Card className="bg-blue-50 border-none">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-center mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-center">{percentage}%</span>
          <span className="text-xs text-gray-500 text-center">Attendance</span>
        </div>
      </CardContent>
    </Card>
  )
}