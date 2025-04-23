import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, GraduationCap, Phone } from "lucide-react"

export function StudentProfile() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>MW</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <div>
                <h2 className="text-2xl font-bold">Welcome, Mia Williams</h2>
                <p className="text-sm text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.
                </p>
              </div>
              <Button size="sm">
                <span className="sr-only">Edit Profile</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-4">
              <div className="flex items-center gap-1 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>Grade 12</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>November 29, 2009</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>+28 1234 5678</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>miawilliams@gmail.co</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

