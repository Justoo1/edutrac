"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { SelectSchool } from "@/lib/schema"
import { CalendarIcon, CheckIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

// Define types for student and class
type Student = {
  id: string
  firstName: string
  lastName: string
  studentId: string
}

type Class = {
  id: string
  name: string
  gradeLevel: string
}

const formSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
  enrollmentDate: z.date({
    required_error: "Enrollment date is required",
  }),
  status: z.string().default("active"),
})

type FormValues = z.infer<typeof formSchema>

export function EnrollStudentDialog({ children, school }: { children: React.ReactNode, school: SelectSchool }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: "",
      studentIds: [],
      enrollmentDate: new Date(),
      status: "active",
    },
  })

  // Update form when selected students change
  useEffect(() => {
    form.setValue("studentIds", selectedStudents)
  }, [selectedStudents, form])

  // Fetch students and classes when dialog opens
  useEffect(() => {
    async function fetchData() {
      if (open) {
        setLoading(true)
        try {
          if (!school.id) {
            throw new Error("School ID not found")
          }

          // Fetch students
          const studentsResponse = await fetch(`/api/students?schoolId=${school.id}`)
          if (!studentsResponse.ok) {
            throw new Error("Failed to fetch students")
          }

          // Fetch classes
          const classesResponse = await fetch(`/api/classes?schoolId=${school.id}`)
          if (!classesResponse.ok) {
            throw new Error("Failed to fetch classes")
          }

          const studentsData = await studentsResponse.json()
          const classesData = await classesResponse.json()

          setStudents(studentsData)
          setClasses(classesData)
        } catch (error: any) {
          toast.error(error.message)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [open, school.id])

  // Handle student selection
  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  // Select all students
  const selectAllStudents = () => {
    const filteredStudents = students
      .filter(student => 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(student => student.id)
    
    setSelectedStudents(filteredStudents)
  }

  // Deselect all students
  const deselectAllStudents = () => {
    setSelectedStudents([])
  }

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/enrollments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: data.classId,
          studentIds: data.studentIds,
          enrollmentDate: data.enrollmentDate.toISOString(),
          schoolId: school.id,
          status: data.status
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to enroll students")
      }

      toast.success(`${data.studentIds.length} student(s) enrolled successfully`)
      setOpen(false)
      form.reset()
      setSelectedStudents([])
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      // Reset form and selections when dialog closes
      form.reset()
      setSelectedStudents([])
      setSearchTerm("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll Students</DialogTitle>
          <DialogDescription>
            Enroll multiple students in a classroom at once. Select a class and the students you want to enroll.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classroom</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading classrooms...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a classroom" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.length > 0 ? (
                        classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name} ({classItem.gradeLevel})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                          {loading ? "Loading..." : "No classrooms found."}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studentIds"
              render={() => (
                <FormItem>
                  <FormLabel>Students</FormLabel>
                  <FormDescription>
                    Select students to enroll in this class.
                  </FormDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {selectedStudents.length} of {students.length} selected
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={selectAllStudents}
                          disabled={loading || students.length === 0}
                        >
                          Select All
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={deselectAllStudents}
                          disabled={loading || selectedStudents.length === 0}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading students...</span>
                        </div>
                      ) : filteredStudents.length > 0 ? (
                        <div className="space-y-2">
                          {filteredStudents.map((student) => (
                            <div key={student.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`student-${student.id}`} 
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={() => toggleStudent(student.id)}
                              />
                              <label 
                                htmlFor={`student-${student.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {student.firstName} {student.lastName} ({student.studentId})
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground gap-2">
                          {searchTerm ? "No matching students found." : "No students available."}
                          <Link href="/students/create">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => setOpen(false)}
                            >
                              Create New Student
                            </Button>
                          </Link>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enrollmentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Enrollment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={loading || isSubmitting || selectedStudents.length === 0}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enrolling {selectedStudents.length} student(s)...</span>
                  </div>
                ) : (
                  `Enroll ${selectedStudents.length} Student(s)`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 