'use client'

import { Card, CardContent } from "@/components/ui/card"

interface TaskInProgressWidgetProps {
  percentage: number
}

export function TaskInProgressWidget({ percentage }: TaskInProgressWidgetProps) {
  return (
    <Card className="bg-yellow-50 border-none">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-center mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-500">
              <path d="M13 2V4H11V2H13ZM19.03 4.39L17.61 5.81L15.81 4.01L17.23 2.59L19.03 4.39ZM12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6ZM12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM4.97 4.39L6.39 2.97L8.19 4.77L6.77 6.19L4.97 4.39ZM6.83 19.44L5.41 18.02L7.21 16.22L8.63 17.64L6.83 19.44ZM2 11V13H4V11H2ZM19 13H22V11H20V13H19ZM17.23 18.02L15.81 16.6L17.63 14.8L19.05 16.22L17.23 18.02ZM15 20H17V22H15V20ZM11 20H13V22H11V20ZM7 20H9V22H7V20Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-center">{percentage}%</span>
          <span className="text-xs text-gray-500 text-center">Task In Progress</span>
        </div>
      </CardContent>
    </Card>
  )
}