"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
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
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectSchool } from "@/lib/schema"

// Define types for the form
type Class = {
  id: string
  name: string
  gradeLevel: string
}

type Batch = {
  id: string
  name: string
  gradeLevel: string
}

type Student = {
  id: string
  firstName: string
  lastName: string
  studentId: string
  batchEnrollments?: {
    batch: {
      id: string
      name: string
      gradeLevel: string
    }
  }[]
}

// Define form schema
const formSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  batchId: z.string().min(1, "Batch is required"),
})

type FormValues = z.infer<typeof formSchema>

export function BatchEnrollDialog({ children, school }: { children: React.ReactNode, school: SelectSchool }) {
  const [open, setOpen] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([])
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: "",
      batchId: "",
    },
  })

  // Fetch classes, batches, students and enrollments when dialog opens
  useEffect(() => {
    const fetchData = async () => {
      if (open && school.id) {
        setLoading(true)
        try {
          const [classesResponse, batchesResponse, studentsResponse, enrollmentsResponse] = await Promise.all([
            fetch(`/api/classes?schoolId=${school.id}`),
            fetch(`/api/schools/${school.id}/batches`),
            fetch(`/api/students?schoolId=${school.id}`),
            fetch(`/api/enrollments?schoolId=${school.id}`),
          ])

          if (!classesResponse.ok || !batchesResponse.ok || !studentsResponse.ok || !enrollmentsResponse.ok) {
            throw new Error("Failed to fetch data")
          }

          const [classesData, batchesData, studentsData, enrollmentsData] = await Promise.all([
            classesResponse.json(),
            batchesResponse.json(),
            studentsResponse.json(),
            enrollmentsResponse.json(),
          ])

          // Filter active classes and batches
          const activeClasses = classesData.filter((c: any) => c.status === "active")
          
          // Store the data
          setClasses(activeClasses)
          setBatches(batchesData)
          setFilteredBatches(batchesData)
          
          // Filter active students and filter out already enrolled students
          const enrolledStudentIds = enrollmentsData.map((e: any) => e.studentId)
          const activeUnenrolledStudents = studentsData
            .filter((s: any) => s.status === "active" && !enrolledStudentIds.includes(s.id))
          
          setStudents(activeUnenrolledStudents)
        } catch (error: any) {
          toast.error(error.message || "Failed to load data")
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [open, school.id])

  // Filter batches when class is selected
  useEffect(() => {
    if (selectedClass) {
      const selectedClassData = classes.find(c => c.id === selectedClass)
      if (selectedClassData) {
        // Filter batches that match the selected class's grade level
        const matchingBatches = batches.filter(
          batch => batch.gradeLevel === selectedClassData.gradeLevel
        )
        setFilteredBatches(matchingBatches)
        
        // Reset batch selection if current selection doesn't match
        const currentBatchStillValid = matchingBatches.some(b => b.id === selectedBatch)
        if (!currentBatchStillValid) {
          setSelectedBatch(null)
          form.setValue("batchId", "")
        }
      }
    } else {
      setFilteredBatches(batches)
    }
  }, [selectedClass, classes, batches, selectedBatch, form])

  // Calculate eligible students when batch is selected
  useEffect(() => {
    const fetchBatchStudents = async () => {
      if (selectedClass && selectedBatch) {
        setLoading(true)
        try {
          // Fetch all students from this batch
          const response = await fetch(`/api/batches/${selectedBatch}/students`)
          if (!response.ok) {
            throw new Error("Failed to fetch batch students")
          }
          const batchStudents = await response.json()
          
          // Filter out students who are already enrolled in any class
          // We want to KEEP students who are in our unenrolled students list
          const filteredStudents = batchStudents.filter(
            (batchStudent: Student) => {
              // If student ID is in our unenrolled students list, keep them
              return students.some(unenrolledStudent => 
                unenrolledStudent.id === batchStudent.id
              )
            }
          )
          
          setEligibleStudents(filteredStudents)
        } catch (error: any) {
          toast.error(error.message || "Failed to load batch students")
          setEligibleStudents([])
        } finally {
          setLoading(false)
        }
      } else {
        setEligibleStudents([])
      }
    }

    fetchBatchStudents()
  }, [selectedClass, selectedBatch, students])

  const onClassChange = (classId: string) => {
    setSelectedClass(classId)
    form.setValue("classId", classId)
  }

  const onBatchChange = (batchId: string) => {
    setSelectedBatch(batchId)
    form.setValue("batchId", batchId)
  }

  async function onSubmit(data: FormValues) {
    if (eligibleStudents.length === 0) {
      toast.error("No eligible students to enroll from this batch")
      return
    }

    setIsSubmitting(true)
    try {
      // Extract student IDs
      const studentIds = eligibleStudents.map(student => student.id)
      
      // Prepare enrollment data
      const enrollmentData = {
        classId: data.classId,
        studentIds,
        enrollmentDate: new Date(),
      }

      // Send enrollment request
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(enrollmentData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          if (responseData.alreadyEnrolledStudents) {
            const enrolledInfo = responseData.alreadyEnrolledStudents
              .map((student: any) => `${student.name} (enrolled in ${student.enrolledIn})`)
              .join(", ")
            
            throw new Error(`Students can only be enrolled in one class at a time. Already enrolled: ${enrolledInfo}`)
          } else if (responseData.error) {
            throw new Error(responseData.error)
          }
        } else if (response.status === 401) {
          throw new Error("You don't have permission to perform this action")
        } else if (response.status === 404) {
          throw new Error("Class or batch not found")
        } else {
          throw new Error("Failed to enroll students")
        }
      }
      
      toast.success(`Successfully enrolled ${studentIds.length} students from ${
        batches.find(b => b.id === data.batchId)?.name || "batch"
      }`)
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Batch Enrollment</DialogTitle>
          <DialogDescription>
            Enroll all students from a batch into a class at once.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Class</FormLabel>
                  <Select
                    onValueChange={(value) => onClassChange(value)}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading classes...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Choose a class" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <SelectItem value="no-classes" disabled>
                          No classes available
                        </SelectItem>
                      ) : (
                        classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name} ({classItem.gradeLevel})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Batch</FormLabel>
                  <Select
                    onValueChange={(value) => onBatchChange(value)}
                    defaultValue={field.value}
                    disabled={loading || !selectedClass}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading batches...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder={selectedClass ? "Choose a batch" : "Select a class first"} />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!selectedClass ? (
                        <SelectItem value="select-class" disabled>
                          Select a class first
                        </SelectItem>
                      ) : filteredBatches.length === 0 ? (
                        <SelectItem value="no-batches" disabled>
                          No matching batches for this class&apos;s grade level
                        </SelectItem>
                      ) : (
                        filteredBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} ({batch.gradeLevel})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedBatch && (
              <div className="border rounded-md p-4 bg-muted/20 space-y-3">
                <h4 className="font-medium">Enrollment Summary</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Selected Batch:</span>
                    <span className="font-medium">{batches.find(b => b.id === selectedBatch)?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Grade Level:</span>
                    <span className="font-medium">{batches.find(b => b.id === selectedBatch)?.gradeLevel}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Target Class:</span>
                    <span className="font-medium">{classes.find(c => c.id === selectedClass)?.name}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Eligible Students</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {eligibleStudents.length} student{eligibleStudents.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  
                  {eligibleStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No eligible students found. Students may already be enrolled in another class or don&apos;t match the grade level.
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                      <ul className="space-y-1">
                        {eligibleStudents.map((student) => (
                          <li key={student.id} className="text-sm flex items-center justify-between">
                            <span>{student.firstName} {student.lastName}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {eligibleStudents.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Only students who aren&apos;t already enrolled in any class will be added.
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={loading || isSubmitting || !selectedClass || !selectedBatch || eligibleStudents.length === 0}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enrolling...</span>
                  </div>
                ) : (
                  "Enroll Batch"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 