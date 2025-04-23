'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, ActivityType } from "@/types/dashboard"
import { Bell, Award, FileText, CheckCircle } from "lucide-react"
import Link from "next/link"

// Sample data
const activities: Activity[] = [
  {
    id: '1',
    type: 'reminder',
    title: 'Reminder: Attending Physics Group Meeting',
    description: '',
    time: '1:00 PM',
    date: new Date(),
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Reminder: Art Supplies Collection',
    description: '',
    time: '10:30 AM',
    date: new Date(),
  },
  {
    id: '3',
    type: 'award',
    title: 'You got Award for 1st place student',
    description: '',
    time: '10:30 AM',
    date: new Date(),
  },
  {
    id: '4',
    type: 'submission',
    title: 'Biology with Ms. Carter Quiz Scheduled',
    description: '',
    time: '4:00 PM',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  },
  {
    id: '5',
    type: 'received',
    title: 'Received Feedback on English Essay',
    description: '',
    time: '9:15 AM',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  },
  {
    id: '6',
    type: 'submission',
    title: 'Submitted Mathematics Assignment',
    description: '',
    time: '2:45 PM',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  },
  {
    id: '7',
    type: 'submission',
    title: 'Submit The Regional Robotics Champion',
    description: '',
    time: '2:45 PM',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  }
]

// Group activities by date
const groupActivitiesByDate = (activities: Activity[]) => {
  const groups: { [key: string]: Activity[] } = {}
  
  activities.forEach((activity) => {
    const today = new Date()
    const isToday = activity.date.getDate() === today.getDate() && 
                    activity.date.getMonth() === today.getMonth() && 
                    activity.date.getFullYear() === today.getFullYear()
    
    const isYesterday = activity.date.getDate() === today.getDate() - 1 && 
                        activity.date.getMonth() === today.getMonth() && 
                        activity.date.getFullYear() === today.getFullYear()
    
    const key = isToday ? 'TODAY' : isYesterday ? 'YESTERDAY' : 'EARLIER'
    
    if (!groups[key]) {
      groups[key] = []
    }
    
    groups[key].push(activity)
  })
  
  return groups
}

// Get activity icon based on type
const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'reminder':
      return <Bell className="h-4 w-4 text-blue-500" />
    case 'award':
      return <Award className="h-4 w-4 text-purple-500" />
    case 'submission':
      return <FileText className="h-4 w-4 text-blue-500" />
    case 'received':
      return <CheckCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

export function RecentActivity() {
  const groupedActivities = groupActivitiesByDate(activities)
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Recent Activity</CardTitle>
        <Link href="#" className="text-xs text-blue-500 hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="pt-2 overflow-auto max-h-96">
        {Object.entries(groupedActivities).map(([date, activities]) => (
          <div key={date} className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 mb-2">{date}</h4>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-50 p-1 rounded-md">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.title}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
