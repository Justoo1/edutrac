'use client'

import { Card, CardContent } from "@/components/ui/card"

interface TaskCompletedWidgetProps {
  count: number
}

export function TaskCompletedWidget({ count }: TaskCompletedWidgetProps) {
  return (
    <Card className="bg-purple-50 border-none">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-center mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-500">
              <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-center">{count}+</span>
          <span className="text-xs text-gray-500 text-center">Task Completed</span>
        </div>
      </CardContent>
    </Card>
  )
}