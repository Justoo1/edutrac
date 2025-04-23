"use client"

import React, { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

// Form schema for enrollment
const enrollmentSchema = z.object({
  studentId: z.string({
    required_error: "Please select a student",
  }),
  classId: z.string({
    required_error: "Please select a class",
  }),
  subjectIds: z.array(z.string()).min(1, {
    message: "Please select at least one subject",
  }),
})

interface EnrollStudentFormProps {
  onSuccess?: () => void;
  schoolType: 'SHS' | 'Basic';
}

const EnrollStudentForm = ({ onSuccess, schoolType }: EnrollStudentFormProps) => {
  // Mock data - would be fetched from API
  const students = [
    { id: '1', name: 'John Doe', grade: 'SHS 1', course: 'General Science' },
    { id: '2', name: 'Jane Smith', grade: 'SHS 2', course: 'General Arts' },
    { id: '3', name: 'Alex Johnson', grade: 'SHS 1', course: 'Business' },
    { id: '4', name: 'Samuel Osei', grade: 'JHS 3', course: null },
    { id: '5', name: 'Ama Owusu', grade: 'Primary 6', course: null },
  ]

  const classes = [
    { id: '1', name: 'SHS 1A', gradeLevel: 'SHS 1' },
    { id: '2', name: 'SHS 1B', gradeLevel: 'SHS 1' },
    { id: '3', name: 'SHS 2A', gradeLevel: 'SHS 2' },
    { id: '4', name: 'JHS 3A', gradeLevel: 'JHS 3' },
    { id: '5', name: 'Primary 6', gradeLevel: 'Primary 6' },
  ]

  const subjects = [
    { id: '1', name: 'Mathematics', courseId: null, gradeLevel: 'SHS 1' },
    { id: '2', name: 'English Language', courseId: null, gradeLevel: 'SHS 1' },
    { id: '3', name: 'Biology', courseId: '1', gradeLevel: 'SHS 1' }, // Science
    { id: '4', name: 'Chemistry', courseId: '1', gradeLevel: 'SHS 1' }, // Science
    { id: '5', name: 'Physics', courseId: '1', gradeLevel: 'SHS 1' }, // Science
    { id: '6', name: 'Literature', courseId: '2', gradeLevel: 'SHS 1' }, // Arts
    { id: '7', name: 'Government', courseId: '2', gradeLevel: 'SHS 1' }, // Arts
    { id: '8', name: 'Economics', courseId: '5', gradeLevel: 'SHS 1' }, // Business
    { id: '9', name: 'Accounting', courseId: '5', gradeLevel: 'SHS 1' }, // Business
    { id: '10', name: 'Social Studies', courseId: null, gradeLevel: 'JHS 3' },
    { id: '11', name: 'Integrated Science', courseId: null, gradeLevel: 'JHS 3' },
    { id: '12', name: 'Religious Studies', courseId: null, gradeLevel: 'Primary 6' },
  ]

  // Define form with validation
  const form = useForm<z.infer<typeof enrollmentSchema>>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      subjectIds: [],
    },
  })

  // Submit handler
  function onSubmit(values: z.infer<typeof enrollmentSchema>) {
    // This would submit the data to your API
    console.log(values)
    alert("Student enrolled successfully!")
    form.reset()
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess()
    }
  }

  // Track selected student and class for filtering subjects
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  // Handler for student selection
  const handleStudentChange = (value: string) => {
    setSelectedStudent(value)
    form.setValue('studentId', value)

    // Find student to get their grade and course
    const student = students.find(s => s.id === value)
    if (student) {
      // Find a matching class
      const matchingClass = classes.find(c => c.gradeLevel === student.grade)
      if (matchingClass) {
        setSelectedClass(matchingClass.id)
        form.setValue('classId', matchingClass.id)
      }
    }
  }

  // Handler for class selection
  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    form.setValue('classId', value)
  }

  // Filter subjects based on class and student course
  const getFilteredSubjects = () => {
    if (!selectedClass) return []

    const selectedClassObj = classes.find(c => c.id === selectedClass)
    if (!selectedClassObj) return []

    const gradeLevel = selectedClassObj.gradeLevel
    
    // For SHS, filter by both grade level and course
    if (schoolType === 'SHS' && selectedStudent) {
      const student = students.find(s => s.id === selectedStudent)
      if (student && student.course) {
        // Find course ID
        const courseId = student.course === 'General Science' ? '1' : 
                        student.course === 'General Arts' ? '2' : 
                        student.course === 'Business' ? '5' : null
                        
        // Return core subjects (courseId is null) and subjects for this course
        return subjects.filter(s => 
          s.gradeLevel === gradeLevel && 
          (s.courseId === null || s.courseId === courseId)
        )
      }
    }
    
    // For basic schools, just filter by grade level
    return subjects.filter(s => s.gradeLevel === gradeLevel)
  }

  const filteredSubjects = getFilteredSubjects()

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Student</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? students.find((student) => student.id === field.value)?.name
                            : "Select student"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search student..." />
                        <CommandEmpty>No student found.</CommandEmpty>
                        <CommandGroup>
                          {students
                            .filter(student => 
                              schoolType === 'SHS' 
                                ? student.grade.startsWith('SHS')
                                : !student.grade.startsWith('SHS')
                            )
                            .map((student) => (
                              <CommandItem
                                key={student.id}
                                value={student.id}
                                onSelect={() => handleStudentChange(student.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    student.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {student.name} - {student.grade}
                                {student.course && ` (${student.course})`}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the student you want to enroll
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select
                    onValueChange={handleClassChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes
                        .filter(c => 
                          schoolType === 'SHS' 
                            ? c.gradeLevel.startsWith('SHS')
                            : !c.gradeLevel.startsWith('SHS')
                        )
                        .map((class_) => (
                          <SelectItem key={class_.id} value={class_.id}>
                            {class_.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the class for enrollment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subjectIds"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Subjects</FormLabel>
                  <FormDescription>
                    Select the subjects for enrollment
                  </FormDescription>
                </div>
                {filteredSubjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSubjects.map((subject) => (
                      <FormField
                        key={subject.id}
                        control={form.control}
                        name="subjectIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={subject.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(subject.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, subject.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== subject.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {subject.name}
                                {subject.courseId && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (Course-specific)
                                  </span>
                                )}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center text-muted-foreground text-sm">
                        {selectedClass
                          ? "No subjects available for the selected class"
                          : "Select a student and class first"}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={filteredSubjects.length === 0}
            >
              Enroll Student
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default EnrollStudentForm 