import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function StudentMessages() {
  const messages = [
    {
      id: 1,
      sender: {
        name: "Ms. Carter",
        avatar: "/placeholder.svg",
        initials: "MC",
      },
      message: "Don't forget semester 1 lab report on titration is due by 9 AM. Make sure you...",
      time: "4:15 PM",
    },
    {
      id: 2,
      sender: {
        name: "Jake",
        avatar: "/placeholder.svg",
        initials: "JK",
      },
      message: "Hey, are we still meeting up after school to study for the math test?",
      time: "12:30 PM",
    },
    {
      id: 3,
      sender: {
        name: "Coach Simmons",
        avatar: "/placeholder.svg",
        initials: "CS",
      },
      message: "Practice is moved to 1 PM today because of the assembly. Please inform the rest of...",
      time: "2:00 PM",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Messages</CardTitle>
        <a href="#" className="text-sm font-medium">
          View All
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-4">
              <Avatar>
                <AvatarImage src={message.sender.avatar} />
                <AvatarFallback>{message.sender.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{message.sender.name}</h4>
                  <span className="text-xs text-muted-foreground">{message.time}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{message.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

