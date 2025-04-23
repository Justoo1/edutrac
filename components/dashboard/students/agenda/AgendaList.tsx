'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AgendaItem } from "@/types/dashboard"
import Link from "next/link"

// Sample data for agenda items
const agendaItems: AgendaItem[] = [
  {
    id: '1',
    title: 'Homeroom & Announcement',
    date: new Date(2030, 2, 26), // March 26, 2030
    subject: 'Mathematics'
  },
  {
    id: '2',
    title: 'Science Fair Preparation',
    date: new Date(2024, 3, 24), // April 24, 2024
    subject: 'Science'
  },
  {
    id: '3',
    title: 'History Documentary Viewing',
    date: new Date(2024, 3, 26), // April 26, 2024
    subject: 'History'
  },
  {
    id: '4',
    title: 'Art Champion Announcement',
    date: new Date(2024, 3, 11), // April 11, 2024
    subject: 'Art'
  }
]

export function AgendaList() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Agenda</CardTitle>
        <Link href="#" className="text-xs text-blue-500 hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          {agendaItems.map((item) => {
            // Format the date
            const date = item.date
            const formattedDate = `${date.toLocaleDateString('en-US', { weekday: 'long' })} - ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
            
            // Determine the subject color
            const getSubjectColor = (subject: string) => {
              const colors: Record<string, { bg: string, text: string }> = {
                'Mathematics': { bg: 'bg-blue-50', text: 'text-blue-500' },
                'Science': { bg: 'bg-green-50', text: 'text-green-500' },
                'History': { bg: 'bg-yellow-50', text: 'text-yellow-600' },
                'Art': { bg: 'bg-purple-50', text: 'text-purple-500' }
              }
              return colors[subject] || { bg: 'bg-gray-50', text: 'text-gray-500' }
            }
            
            const subjectColor = getSubjectColor(item.subject)
            
            return (
              <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
                <p className="text-xs text-gray-500 mb-1">{formattedDate}</p>
                <h4 className="text-sm font-medium mb-1">{item.title}</h4>
                <div className={`inline-block px-2 py-1 rounded-md text-xs ${subjectColor.bg} ${subjectColor.text}`}>
                  {item.subject}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
