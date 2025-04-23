import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Bell, BookOpen, FileText } from "lucide-react"

export function StudentActivity() {
  const activities = [
    {
      id: 1,
      title: "Reminder: Attending Physics Group Meeting",
      time: "1:00 PM",
      icon: <Bell className="h-4 w-4 text-sky-500" />,
    },
    {
      id: 2,
      title: "Reminder: Art Supplies Collection",
      time: "10:30 AM",
      icon: <Bell className="h-4 w-4 text-sky-500" />,
    },
    {
      id: 3,
      title: "You got Award for 1st place student",
      time: "10:30 AM",
      icon: <Award className="h-4 w-4 text-purple-500" />,
    },
    {
      id: 4,
      title: "Biology with Ms. Carter Quiz Scheduled",
      time: "4:00 PM",
      icon: <BookOpen className="h-4 w-4 text-sky-500" />,
    },
    {
      id: 5,
      title: "Received Feedback on English Essay",
      time: "9:15 AM",
      icon: <FileText className="h-4 w-4 text-amber-500" />,
    },
    {
      id: 6,
      title: "Submitted Mathematics Assignment",
      time: "2:45 PM",
      icon: <FileText className="h-4 w-4 text-sky-500" />,
    },
    {
      id: 7,
      title: "Submit The Regional Robotics Champion",
      time: "2:45 PM",
      icon: <FileText className="h-4 w-4 text-sky-500" />,
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Recent Activity</CardTitle>
        <a href="#" className="text-sm font-medium">
          View All
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-sm font-medium">TODAY</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-primary/10 p-2">{activity.icon}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <h3 className="text-sm font-medium">YESTERDAY</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activities.slice(3).map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-primary/10 p-2">{activity.icon}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

