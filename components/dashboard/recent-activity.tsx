import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      user: {
        name: "Ms. Johnson",
        avatar: "/placeholder.svg",
        initials: "MJ",
      },
      action: "assigned new",
      subject: "English Literature",
      type: "homework",
      time: "20 minutes ago",
    },
    {
      id: 2,
      user: {
        name: "David Lee",
        avatar: "/placeholder.svg",
        initials: "DL",
      },
      action: "already submitted",
      subject: "History",
      type: "quiz",
      time: "1 hour ago",
    },
    {
      id: 3,
      user: {
        name: "Permission Slip Reminder",
        avatar: "/placeholder.svg",
        initials: "PS",
      },
      action: "",
      subject: "Science Museum Field Trip",
      type: "",
      time: "3 hours ago",
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
          <h3 className="text-sm font-medium">Today</h3>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <Avatar>
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback>{activity.user.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span> {activity.action && `${activity.action} `}
                    <span className="font-medium">{activity.subject}</span>
                    {activity.type && ` ${activity.type}`}.
                  </p>
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
