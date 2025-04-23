import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function NoticeList() {
  const notices = [
    {
      id: 1,
      title: "Welcome Back to School!",
      author: "Principal Linda Carter",
      date: "August 1, 2024",
      content:
        "As we embark on another exciting academic year, let's embrace the opportunities that lie ahead. We're thrilled to welcome new faces and reunite with returning students. Don't miss our opening assembly on August 5th!",
      views: "1.2K",
    },
    {
      id: 2,
      title: "Fall Sports Tryouts Schedule",
      author: "Coach Michael Jordan",
      date: "August 15, 2024",
      content:
        "Get ready to show your spirit and skills! Tryouts for soccer, volleyball, and football start next week. Check the gym bulletin board for exact dates and required gear. Go Eagles!",
      views: "850",
    },
    {
      id: 3,
      title: "Library Hours Extension",
      author: "Librarian Sarah Knox",
      date: "September 5, 2024",
      content:
        "Attention students! To support your exam preparation, the library will offer extended hours starting September 15th. Join us for additional study sessions and access thousands of resources!",
      views: "500",
    },
    {
      id: 4,
      title: "Flu Vaccination Clinic",
      author: "Nurse Emily White",
      date: "October 10, 2024",
      content:
        "Protect yourself this flu season! The school nurse's office will host a vaccination clinic on October 20th. Sign up in the main office. Vaccines are free and available to all students and staff.",
      views: "300",
    },
    {
      id: 5,
      title: "Annual Food Drive Kickoff",
      author: "Head of Student Council, Tom Briggs",
      date: "November 1, 2024",
      content:
        "Let's make a difference together! Our annual food drive starts November 5th. Please bring non-perishable food items to Room 108. Help us reach our goal to collect over 2,000 pounds of food for local food banks.",
      views: "400",
    },
  ]

  return (
    <div className="space-y-4">
      {notices.map((notice) => (
        <div key={notice.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>{notice.author.split(" ")[0][0] + notice.author.split(" ")[1][0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{notice.title}</h3>
                  <span className="text-xs text-muted-foreground">{notice.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">By {notice.author}</p>
                <p className="mt-2 text-sm">{notice.content}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
                      {notice.views}
                    </span>
                    <span>Views</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm">
          Previous
        </Button>
        <div className="text-sm">Page 1 of 12</div>
        <Button variant="outline" size="sm">
          Next
        </Button>
      </div>
    </div>
  )
}

