import { CalendarView } from "@/components/dashboard/calendar/calendar-view"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">May 2030</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Today
          </Button>
          <div className="flex">
            <Button variant="outline" size="icon" className="rounded-r-none">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-l-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex space-x-2 rounded-md bg-muted p-1 w-fit">
        <Button variant="secondary" size="sm" className="rounded-sm">
          Month
        </Button>
        <Button variant="ghost" size="sm" className="rounded-sm">
          Week
        </Button>
        <Button variant="ghost" size="sm" className="rounded-sm">
          Day
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="col-span-3">
          <CalendarView />
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between p-6">
              <h3 className="text-lg font-medium">Agenda</h3>
              <button className="text-sm text-muted-foreground">•••</button>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="rounded-md border-l-4 border-purple-500 bg-purple-50 p-3">
                <h4 className="font-medium">Big Day and Celebration Day</h4>
              </div>
              <div className="rounded-md border-l-4 border-purple-500 bg-purple-50 p-3">
                <h4 className="font-medium">Subject Presentation & Exam</h4>
              </div>
              <div className="rounded-md border-l-4 border-sky-500 bg-sky-50 p-3">
                <h4 className="font-medium">Spring Concert</h4>
              </div>
              <div className="rounded-md border-l-4 border-sky-500 bg-sky-50 p-3">
                <h4 className="font-medium">Fair, Exhibition & Performance</h4>
              </div>
              <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-3">
                <h4 className="font-medium">Official Meeting</h4>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between p-6">
              <h3 className="text-lg font-medium">May, 8 2030</h3>
              <button className="text-sm text-muted-foreground">•••</button>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">08:00 am</span>
                </div>
                <div className="rounded-md bg-sky-50 p-3">
                  <h4 className="font-medium">Science Fair Setup</h4>
                  <p className="text-sm text-muted-foreground">Science Club</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">11:00 am</span>
                </div>
                <div className="rounded-md bg-amber-50 p-3">
                  <h4 className="font-medium">Teacher Meeting</h4>
                  <p className="text-sm text-muted-foreground">All Teacher</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

