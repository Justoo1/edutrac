import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function MessagesWidget() {
  const messages = [
    {
      id: 1,
      sender: {
        name: "Dr. Lila Ramirez",
        avatar: "/placeholder.svg",
        initials: "LR",
      },
      message: "Please ensure the monthly attendance report is accurate before the April 30th deadline.",
      time: "9:00 AM",
    },
    {
      id: 2,
      sender: {
        name: "Ms. Heather Morris",
        avatar: "/placeholder.svg",
        initials: "HM",
      },
      message: "Don't forget the staff training on digital tools scheduled for May 5th at 3 PM in the conference room.",
      time: "10:15 AM",
    },
    {
      id: 3,
      sender: {
        name: "Mr. Carl Jenkins",
        avatar: "/placeholder.svg",
        initials: "CJ",
      },
      message: "Budget review meeting for the next fiscal year is on April 28th at 10 AM.",
      time: "2:00 PM",
    },
    {
      id: 4,
      sender: {
        name: "Officer Dan Brooks",
        avatar: "/placeholder.svg",
        initials: "DB",
      },
      message: "Review the updated security protocols effective May 1st. Familiarize yourself with the new procedures.",
      time: "3:10 PM",
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

