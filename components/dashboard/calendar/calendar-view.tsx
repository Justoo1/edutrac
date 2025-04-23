import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function CalendarView() {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const weeks = [
    [
      { date: "28", events: [] },
      { date: "29", events: [] },
      { date: "30", events: [] },
      { date: "31", events: [] },
      { date: "01", events: [{ title: "Teacher Professional Day", type: "teacher" }] },
      { date: "02", events: [{ title: "AP Calculus Exam", type: "exam" }] },
      {
        date: "03",
        events: [
          { title: "Students Day", type: "student" },
          { title: "Spring Concert", type: "event" },
        ],
      },
    ],
    [
      { date: "04", events: [] },
      { date: "05", events: [{ title: "Cinco de Mayo Celebration", type: "event" }] },
      { date: "06", events: [] },
      { date: "07", events: [] },
      {
        date: "08",
        events: [
          { title: "Science Fair", type: "event" },
          { title: "Teacher Meeting", type: "teacher" },
        ],
      },
      { date: "09", events: [{ title: "Science Fair", type: "event" }] },
      { date: "10", events: [{ title: "PTA Meeting", type: "meeting" }] },
    ],
    [
      { date: "11", events: [] },
      { date: "12", events: [] },
      { date: "13", events: [{ title: "English Literature Club", type: "club" }] },
      { date: "14", events: [] },
      { date: "15", events: [{ title: "Varsity Track Meet", type: "sport" }] },
      { date: "16", events: [{ title: "Junior Prom", type: "event" }] },
      { date: "17", events: [] },
    ],
    [
      { date: "18", events: [] },
      {
        date: "19",
        events: [
          { title: "Senior Project Presentations", type: "academic" },
          { title: "Teacher Meeting", type: "teacher" },
        ],
      },
      { date: "20", events: [] },
      { date: "21", events: [] },
      {
        date: "22",
        events: [
          { title: "Art Exhibition", type: "event" },
          { title: "Board of Education Meeting", type: "meeting" },
        ],
      },
      {
        date: "23",
        events: [
          { title: "Drama Club Performance", type: "club" },
          { title: "PTA Meeting", type: "meeting" },
        ],
      },
      { date: "24", events: [] },
    ],
    [
      { date: "25", events: [] },
      { date: "26", events: [{ title: "Memorial Day", type: "holiday" }] },
      { date: "27", events: [] },
      {
        date: "28",
        events: [
          { title: "Sophomore Class Trip", type: "event" },
          { title: "Art Fair & Exhibition", type: "event" },
        ],
      },
      { date: "29", events: [] },
      { date: "30", events: [{ title: "Last Day of School", type: "event" }] },
      { date: "31", events: [] },
    ],
  ]

  const getEventClass = (type: string) => {
    switch (type) {
      case "teacher":
        return "bg-sky-100 text-sky-800 border-sky-200"
      case "student":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "exam":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "event":
        return "bg-green-100 text-green-800 border-green-200"
      case "meeting":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "club":
        return "bg-pink-100 text-pink-800 border-pink-200"
      case "sport":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "holiday":
        return "bg-red-100 text-red-800 border-red-200"
      case "academic":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {days.map((day) => (
              <TableHead key={day} className="text-center font-medium">
                {day}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {weeks.map((week, weekIndex) => (
            <TableRow key={weekIndex}>
              {week.map((day, dayIndex) => (
                <TableCell key={`${weekIndex}-${dayIndex}`} className="h-24 align-top p-2 border">
                  <div className="flex flex-col h-full">
                    <span
                      className={`text-sm font-medium mb-1 ${
                        day.date === "19"
                          ? "h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                          : ""
                      }`}
                    >
                      {day.date}
                    </span>
                    <div className="space-y-1">
                      {day.events.map((event, eventIndex) => (
                        <div key={eventIndex} className={`text-xs p-1 rounded border ${getEventClass(event.type)}`}>
                          {event.title}
                        </div>
                      ))}
                      {day.date === "08" && day.events.length > 1 && (
                        <div className="text-xs text-center text-muted-foreground">2 more</div>
                      )}
                    </div>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

