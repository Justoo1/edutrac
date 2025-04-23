import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AttendanceChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Attendance</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="weekly">
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="3">
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Grade 3</SelectItem>
              <SelectItem value="4">Grade 4</SelectItem>
              <SelectItem value="5">Grade 5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <span className="mr-1 h-3 w-3 rounded-full bg-amber-400"></span>
            <span>Total Present</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1 h-3 w-3 rounded-full bg-sky-300"></span>
            <span>Total Absent</span>
          </div>
        </div>
        <div className="mt-4 h-[200px] w-full relative">
          <div className="flex h-full items-end gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-sm bg-amber-400"
                    style={{ height: `${50 + Math.random() * 30}%` }}
                  ></div>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-sm bg-sky-300"
                    style={{ height: `${30 + Math.random() * 30}%` }}
                  ></div>
                </div>
                <span className="text-xs">{day}</span>
                {i === 2 && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-medium">
                    95%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

