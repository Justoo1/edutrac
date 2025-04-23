"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { SelectSchool } from "@/lib/schema"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Gender is required",
  }),
  studentIdPrefix: z.string().min(1, "ID prefix is required"),
  studentIdNumber: z.string().min(1, "ID number is required"),
  currentGradeLevel: z.string().min(1, "Grade level is required"),
  status: z.enum(["active", "inactive", "graduated", "transferred"], {
    required_error: "Status is required"
  }).default("active"),
})

type FormValues = z.infer<typeof formSchema>

export function CreateStudentForm({ school }: { school: SelectSchool }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingId, setIsGeneratingId] = useState(false)
  const router = useRouter()

  const currentYear = new Date().getFullYear().toString().slice(-2)
  const defaultPrefix = school.name.slice(0, 3).toUpperCase() + currentYear
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: new Date(),
      gender: "MALE",
      studentIdPrefix: defaultPrefix,
      studentIdNumber: "",
      currentGradeLevel: "",
      status: "active",
    },
  })

  async function generateStudentId() {
    setIsGeneratingId(true)
    
    try {
      // Get the current count of students to generate a sequence number
      const response = await fetch(`/api/students/generate-id?schoolId=${school.id}&prefix=${form.getValues('studentIdPrefix')}`)
      
      if (!response.ok) {
        throw new Error("Failed to generate student ID")
      }
      
      const data = await response.json()
      form.setValue('studentIdNumber', data.number)
    } catch (error: any) {
      // If API fails, just generate a simple 4-digit number
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      form.setValue('studentIdNumber', randomNum.toString())
    } finally {
      setIsGeneratingId(false)
    }
  }

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    
    try {
      // Combine prefix and number to create the complete student ID
      const studentId = `${data.studentIdPrefix}${data.studentIdNumber}`
      
      const response = await fetch(`/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          studentId,
          schoolId: school.id,
          dateOfBirth: data.dateOfBirth.toISOString(),
          enrollmentDate: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create student")
      }

      toast.success("Student created successfully")
      router.push("/students")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-generate student ID when form loads
  useState(() => {
    generateStudentId()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Information</CardTitle>
        <CardDescription>Enter the student's details below to add them to your school.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Middle name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentGradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Kindergarten 1">Kindergarten 1</SelectItem>
                        <SelectItem value="Kindergarten 2">Kindergarten 2</SelectItem>
                        <SelectItem value="Primary 1">Primary 1</SelectItem>
                        <SelectItem value="Primary 2">Primary 2</SelectItem>
                        <SelectItem value="Primary 3">Primary 3</SelectItem>
                        <SelectItem value="Primary 4">Primary 4</SelectItem>
                        <SelectItem value="Primary 5">Primary 5</SelectItem>
                        <SelectItem value="Primary 6">Primary 6</SelectItem>
                        <SelectItem value="JHS 1">JHS 1</SelectItem>
                        <SelectItem value="JHS 2">JHS 2</SelectItem>
                        <SelectItem value="JHS 3">JHS 3</SelectItem>
                        <SelectItem value="SHS 1">SHS 1</SelectItem>
                        <SelectItem value="SHS 2">SHS 2</SelectItem>
                        <SelectItem value="SHS 3">SHS 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Student ID</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <FormField
                    control={form.control}
                    name="studentIdPrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Prefix</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Usually school code + year
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-1">
                  <FormField
                    control={form.control}
                    name="studentIdNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={generateStudentId}
                            disabled={isGeneratingId}
                          >
                            {isGeneratingId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "↺"
                            )}
                          </Button>
                        </div>
                        <FormDescription>
                          Sequential/unique number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-1">
                  <FormItem>
                    <FormLabel>Preview</FormLabel>
                    <div className="h-10 border rounded-md flex items-center px-3 text-lg font-mono">
                      {form.watch("studentIdPrefix")}{form.watch("studentIdNumber")}
                    </div>
                    <FormDescription>
                      Complete student ID
                    </FormDescription>
                  </FormItem>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Student"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 