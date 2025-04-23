import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function StudentCalendar() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const currentDate = new Date()
  const currentDay = currentDate.getDate()
  const month = "March"
  const year = "2030"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md">
          {month} {year}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <button className="rounded-full p-1 hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="rounded-full p-1 hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-center">
          {days.map((day) => (
            <div key={day} className="text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <div
              key={day}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                day === 19 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

