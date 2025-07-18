'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  day: z.string().min(1, "Day is required"),
  period: z.string().min(1, "Period is required"),
  room: z.string().min(1, "Room is required"),
})

interface Class {
  id: string
  name: string
  room: string | null
}

interface Subject {
  id: string
  name: string
}

interface Teacher {
  id: string
  name: string | null
  classSubjects?: {
    subject: {
      id: string
    }
  }[]
}

export interface Period {
  id: string
  time: string
  label: string
  type: string
  orderIndex: number
}

interface ScheduleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  onEdit: (data: any) => void
  initialData?: any
  classes: Class[]
  subjects: Subject[]
  teachers: Teacher[]
  periods: Period[]
  selectedRoom: string
  schedule?: any
}

export function ScheduleDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  onEdit,
  initialData,
  classes,
  subjects,
  teachers,
  periods,
  selectedRoom,
  schedule
}: ScheduleDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      classId: "",
      subjectId: "",
      teacherId: "",
      day: "",
      period: "",
      room: selectedRoom || "",
    },
  })

  // Watch for subject changes to auto-select teacher
  const selectedSubjectId = form.watch("subjectId")
  React.useEffect(() => {
    if (selectedSubjectId) {
      const teacherForSubject = teachers.find(teacher => 
        teacher.classSubjects?.some(cs => cs.subject.id === selectedSubjectId)
      )
      if (teacherForSubject) {
        form.setValue("teacherId", teacherForSubject.id)
      }
    }
  }, [selectedSubjectId, teachers, form])

  React.useEffect(() => {
    if (selectedRoom) {
      form.setValue("room", selectedRoom)
    }
  }, [selectedRoom, form])

  const selectedClassId = form.watch("classId");

  React.useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find(c => c.id === selectedClassId)
      if (selectedClass?.room) {
        form.setValue("room", selectedClass.room)
      }
    }
  }, [selectedClassId, classes, form])

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      if (schedule) {
        await onEdit({ ...data, id: schedule.id })
      } else {
        await onSubmit(data)
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter room number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : schedule ? 'Update Schedule' : 'Add Schedule'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 