"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Check } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SelectSchool } from "@/lib/schema"

// Define types for the form
type Batch = {
  id: string
  name: string
  gradeLevel: string
}

type Student = {
  id: string
  firstName: string
  lastName: string
  studentId?: string
}

// Define form schema
const formSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
})

type FormValues = z.infer<typeof formSchema>

interface AddStudentsToBatchDialogProps {
  children: React.ReactNode;
  school: SelectSchool;
  batch?: Batch;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddStudentsToBatchDialog({ 
  children, 
  school, 
  batch,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onSuccess
}: AddStudentsToBatchDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [batches, setBatches] = useState<Batch[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<string | null>(batch?.id || null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const router = useRouter()

  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchId: batch?.id || "",
      studentIds: [],
    },
  })

  // Fetch batches and students data
  useEffect(() => {
    const fetchData = async () => {
      if (open && school.id) {
        setLoading(true)
        try {
          const [batchesResponse, studentsResponse, allBatchEnrollmentsResponse] = await Promise.all([
            fetch(`/api/schools/${school.id}/batches`),
            fetch(`/api/students?schoolId=${school.id}`),
            fetch(`/api/schools/${school.id}/batch-enrollments`)
          ])

          if (!batchesResponse.ok || !studentsResponse.ok || !allBatchEnrollmentsResponse.ok) {
            throw new Error("Failed to fetch data")
          }

          const [batchesData, studentsData, allBatchEnrollmentsData] = await Promise.all([
            batchesResponse.json(),
            studentsResponse.json(),
            allBatchEnrollmentsResponse.json()
          ])

          setBatches(batchesData)
          
          // Get only active students
          const activeStudents = studentsData.filter((s: any) => s.status === "active")
          setStudents(activeStudents)
          
          // Get all students who are already in any batch
          const studentsInAnyBatch = new Set(
            allBatchEnrollmentsData
              .filter((enrollment: any) => enrollment.status === "active")
              .map((enrollment: any) => enrollment.studentId)
          )
          
          // Filter out students who are already in ANY batch
          const availableStudents = activeStudents.filter(
            student => !studentsInAnyBatch.has(student.id)
          )
          
          setUnassignedStudents(availableStudents)
          
          // Pre-select batch if provided
          if (batch?.id) {
            setSelectedBatch(batch.id)
            form.setValue("batchId", batch.id)
          }
        } catch (error: any) {
          toast.error(error.message || "Failed to load data")
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [open, school.id, batch, form])

  const onBatchChange = (batchId: string) => {
    setSelectedBatch(batchId)
    form.setValue("batchId", batchId)
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSelection = prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
      
      form.setValue("studentIds", newSelection)
      return newSelection
    })
  }

  async function onSubmit(data: FormValues) {
    if (data.studentIds.length === 0) {
      toast.error("Please select at least one student")
      return
    }

    setIsSubmitting(true)
    try {
      // Send request to add students to batch
      const response = await fetch(`/api/batches/${data.batchId}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentIds: data.studentIds
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to add students to batch")
      }

      // Show success message
      toast.success(`Successfully added ${data.studentIds.length} students to batch`)
      
      // Show warning if there were grade level mismatches
      if (responseData.warning) {
        toast.warning(responseData.warning)
      }
      
      setOpen(false)
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add Students to Batch</DialogTitle>
          <DialogDescription>
            Select students who are not yet assigned to any batch and add them to a grade level batch.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 grid-cols-1">
              <FormField
                control={form.control}
                name="studentIds"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Select Students to Assign</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Showing students not yet assigned to any batch
                      </p>
                    </div>
                    
                    {loading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : unassignedStudents.length === 0 ? (
                      <Card className="p-4 text-center text-muted-foreground">
                        No unassigned students found. All students are already assigned to batches.
                      </Card>
                    ) : (
                      <Card className="p-2">
                        <div className="flex justify-between items-center px-3 py-2 border-b">
                          <span className="font-medium">Student Name</span>
                          <span className="font-medium">Select</span>
                        </div>
                        <ScrollArea className="h-[260px]">
                          {unassignedStudents.map((student) => (
                            <div 
                              key={student.id} 
                              className="flex justify-between items-center px-3 py-2 hover:bg-muted/50"
                            >
                              <div>
                                <p className="font-medium">{student.firstName} {student.lastName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {student.studentId || student.id}
                                </p>
                              </div>
                              <Checkbox
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={() => toggleStudentSelection(student.id)}
                              />
                            </div>
                          ))}
                        </ScrollArea>
                      </Card>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {unassignedStudents.length > 0 
                        ? `${selectedStudents.length} of ${unassignedStudents.length} students selected`
                        : "No students available to assign"
                      }
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Target Batch</FormLabel>
                    <Select
                      onValueChange={onBatchChange}
                      defaultValue={field.value}
                      disabled={loading || !!batch || selectedStudents.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading batches...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Choose a batch" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {batches.length === 0 ? (
                          <SelectItem value="no-batches" disabled>
                            No batches available
                          </SelectItem>
                        ) : (
                          batches.map((batchItem) => (
                            <SelectItem key={batchItem.id} value={batchItem.id}>
                              {batchItem.name} ({batchItem.gradeLevel})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={loading || isSubmitting || !selectedBatch || selectedStudents.length === 0}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Adding Students...</span>
                  </div>
                ) : (
                  `Add ${selectedStudents.length} Students to Batch`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 