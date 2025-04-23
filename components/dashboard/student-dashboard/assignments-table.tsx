import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"
import { Input } from "@/components/ui/input"

export function AssignmentsTable() {
  const assignments = [
    {
      id: "01",
      task: "Read Chapters 1-3",
      subject: "English Literature",
      dueDate: "May 1, 2024",
      time: "09:00 AM",
      status: "In Progress",
    },
    {
      id: "02",
      task: "Complete Problem Set #5",
      subject: "Mathematics",
      dueDate: "May 3, 2024",
      time: "10:30 AM",
      status: "Not Started",
    },
    {
      id: "03",
      task: "Write Lab Report on Acid-Base Titration",
      subject: "Chemistry",
      dueDate: "May 5, 2024",
      time: "11:12 AM",
      status: "In Progress",
    },
    {
      id: "04",
      task: "Prepare for Oral Presentation",
      subject: "History",
      dueDate: "May 2, 2024",
      time: "12:00 PM",
      status: "Not Started",
    },
    {
      id: "05",
      task: "Create Art Piece for Final Project",
      subject: "Art",
      dueDate: "May 6, 2024",
      time: "03:00 PM",
      status: "In Progress",
    },
  ]

  const getStatusClass = (status: string) => {
    switch (status) {
      case "In Progress":
        return "text-sky-500"
      case "Not Started":
        return "text-red-500"
      case "Completed":
        return "text-green-500"
      default:
        return ""
    }
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between p-6">
        <h3 className="text-lg font-medium">Assignments</h3>
        <div className="relative">
          <Input type="search" placeholder="Search by Subject" className="w-[300px] pl-8" />
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
            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Button size="sm" className="absolute right-1 top-1">
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
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>{assignment.id}</TableCell>
              <TableCell>{assignment.task}</TableCell>
              <TableCell>{assignment.subject}</TableCell>
              <TableCell>{assignment.dueDate}</TableCell>
              <TableCell>{assignment.time}</TableCell>
              <TableCell>
                <span className={getStatusClass(assignment.status)}>{assignment.status}</span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t px-4 py-2">
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

