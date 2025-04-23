import { Award, Trophy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function StudentActivity() {
  const activities = [
    {
      id: 1,
      title: "Regional Robotics Champion",
      description: "Winning robots triumph in engineering challenge",
      icon: <Trophy className="h-4 w-4 text-white" />,
      iconBg: "bg-blue-500",
      time: "2 days ago",
    },
    {
      id: 2,
      title: "Won Regional Debate Competition",
      description: "Debate team's compelling arguments reach national stage",
      icon: <Award className="h-4 w-4 text-white" />,
      iconBg: "bg-purple-500",
      time: "10 hours ago",
    },
    {
      id: 3,
      title: "2nd Place at Science State Fair",
      description: "Science Club earns state-level showcase",
      icon: <Award className="h-4 w-4 text-white" />,
      iconBg: "bg-amber-500",
      time: "3 weeks ago",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Student Activity</CardTitle>
        <CardDescription>
          <a href="#" className="text-sm font-medium">
            View All
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activity.iconBg}`}>
                {activity.icon}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium">{activity.title}</h4>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

