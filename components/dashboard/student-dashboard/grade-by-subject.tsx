import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function GradeBySubject() {
  const subjects = [
    { name: "Biology", grade: 85 },
    { name: "Chemistry", grade: 75 },
    { name: "Geography", grade: 90 },
    { name: "History", grade: 95 },
    { name: "Literature", grade: 88 },
    { name: "Art", grade: 92 },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Grade by Subject</CardTitle>
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
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{subject.name}</span>
                <span className="text-sm text-muted-foreground">{subject.grade}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-purple-400" style={{ width: `${subject.grade}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

