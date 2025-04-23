import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NoticeBoard() {
  const notices = [
    {
      id: 1,
      title: "Math Olympiad Competition",
      date: "04/18/2030",
      author: {
        name: "Ms. Jackson",
        role: "Math Teacher",
      },
    },
    {
      id: 2,
      title: "Yearbook Photo Submissions Wanted",
      date: "04/15/2030",
      author: {
        name: "Yearbook Committee",
        role: "",
      },
    },
    {
      id: 3,
      title: "Reminder: School Play Auditions This Week",
      date: "04/12/2030",
      author: {
        name: "Mr. Rodriguez",
        role: "Drama Teacher",
      },
    },
    {
      id: 4,
      title: "Lost and Found Overflowing!",
      date: "04/10/2030",
      author: {
        name: "School Administration",
        role: "",
      },
    },
    {
      id: 5,
      title: "Important Update: School Uniform Policy",
      date: "04/09/2030",
      author: {
        name: "Principal Smith",
        role: "",
      },
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Notice Board</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {notices.map((notice) => (
            <div key={notice.id} className="flex items-start gap-4">
              <div className="rounded-md border p-2">
                <img src={`/placeholder.svg?height=40&width=40`} alt="" className="h-10 w-10" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{notice.title}</h4>
                  <span className="text-xs text-sky-500">{notice.date}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  By {notice.author.name}
                  {notice.author.role && ` (${notice.author.role})`}
                </p>
                <div className="flex items-center gap-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
                    {notice.id === 1
                      ? "1.2K"
                      : notice.id === 2
                        ? "587"
                        : notice.id === 3
                          ? "1.2K"
                          : notice.id === 4
                            ? "492"
                            : "192"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

