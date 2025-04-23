import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import EnrollStudentModal from "./enroll-student-modal"

interface Subject {
  id: string
  name: string
  code: string
  description: string | null
  course?: {
    name: string
  } | null
  studentCount: number
  schoolId: string
}

interface SubjectsTableProps {
  subjects: Subject[]
  schoolType: 'SHS' | 'Basic'
  onSubjectUpdated?: () => void
}

export default function SubjectsTable({ subjects, schoolType, onSubjectUpdated }: SubjectsTableProps) {
  const router = useRouter()
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            {schoolType === 'SHS' && <TableHead>Course</TableHead>}
            <TableHead>Students</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell className="font-medium">{subject.name}</TableCell>
              <TableCell>{subject.code}</TableCell>
              {schoolType === 'SHS' && (
                <TableCell>
                  {subject.course ? (
                    <Badge variant="secondary">{subject.course.name}</Badge>
                  ) : (
                    <Badge variant="outline">No Course</Badge>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{subject.studentCount}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSubject(subject)
                        setIsEnrollModalOpen(true)
                      }}
                    >
                      Enroll Students
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/subjects/${subject.id}`)}
                    >
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedSubject && (
        <EnrollStudentModal
          schoolId={selectedSubject.schoolId}
          subjectId={selectedSubject.id}
          open={isEnrollModalOpen}
          onOpenChange={setIsEnrollModalOpen}
          onSuccess={() => {
            onSubjectUpdated?.()
            setIsEnrollModalOpen(false)
          }}
        />
      )}
    </>
  )
} 