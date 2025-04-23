"use client"

import React, { useState, useEffect } from 'react'
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

// Form schema for subject creation
const subjectFormSchema = z.object({
  name: z.string().min(2, {
    message: "Subject name must be at least 2 characters.",
  }),
  code: z.string().min(2, {
    message: "Subject code must be at least 2 characters.",
  }),
  description: z.string().optional(),
  courseId: z.string().optional(),
  isOptional: z.boolean().default(false),
})

type FormValues = {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  courseId?: string;
  isOptional?: boolean;
}

interface CreateSubjectFormProps {
  onSuccess?: () => void;
  initialValues?: FormValues;
  mode?: 'create' | 'edit';
  schoolType: 'SHS' | 'Basic';
  schoolId: string;
}

const CreateSubjectForm = ({ 
  onSuccess, 
  initialValues,
  mode = 'create',
  schoolType = 'SHS',
  schoolId
}: CreateSubjectFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courseOptions, setCourseOptions] = useState<{id: string, name: string, department: string}[]>([])

  // Fetch available courses only for SHS schools
  useEffect(() => {
    const fetchCourses = async () => {
      if (schoolType === 'SHS') {
        try {
          const response = await fetch(`/api/courses?schoolId=${schoolId}`)
          if (!response.ok) throw new Error('Failed to fetch courses')
          const data = await response.json()
          setCourseOptions(data.courses || [])
        } catch (err) {
          console.error('Error fetching courses:', err)
          setError('Failed to load courses. Please try again later.')
        }
      }
    }

    fetchCourses()
  }, [schoolId, schoolType])

  // Define form with validation
  const form = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: initialValues?.name || "",
      code: initialValues?.code || "",
      description: initialValues?.description || "",
      courseId: initialValues?.courseId || "",
      isOptional: initialValues?.isOptional || false,
    },
  })

  // Auto-generate code when name changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name && !initialValues?.code) {
        const firstTwoLetters = value.name
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
          .slice(0, 2)
        const randomNumbers = Math.floor(Math.random() * 900 + 100) // Generates 3-digit number between 100-999
        const generatedCode = `${firstTwoLetters}${randomNumbers}`
        form.setValue('code', generatedCode)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, initialValues?.code])

  // Submit handler
  async function onSubmit(values: z.infer<typeof subjectFormSchema>) {
    setIsLoading(true)
    setError(null)
    
    try {
      const apiUrl = mode === 'create' 
        ? '/api/subjects' 
        : `/api/subjects/${initialValues?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      // Prepare the request body
      const requestBody = {
        name: values.name,
        code: values.code,
        description: values.description || '',
        schoolId: schoolId,
        ...(schoolType === 'SHS' && {
          courseId: values.courseId || null,
          isOptional: values.isOptional || false
        })
      }
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || errorData.message || 'Failed to save subject')
        toast.error(errorData.error || errorData.message || 'Failed to save subject')
        return
      }
      
      if (mode === 'edit') {
        toast.success("Subject updated successfully!")
      } else {
        toast.success("Subject created successfully!")
      }
      
      form.reset()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error saving subject:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save subject'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Mathematics" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the full name of the subject
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. MA101" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e)
                        // Allow manual editing while preserving auto-generation
                        if (!initialValues?.code) {
                          const firstTwoLetters = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z]/g, '')
                            .slice(0, 2)
                          const randomNumbers = Math.floor(Math.random() * 900 + 100)
                          const generatedCode = `${firstTwoLetters}${randomNumbers}`
                          form.setValue('code', generatedCode)
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    A unique code for the subject (auto-generated from name)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course field only shown for SHS */}
            {schoolType === 'SHS' && (
              <>
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course/Programme</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Core Subject (No Course)</SelectItem>
                          {courseOptions.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name} ({course.department})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The course/programme this subject belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isOptional"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Optional Subject</FormLabel>
                        <FormDescription>
                          Is this an elective/optional subject?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide a description of this subject"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Brief description of what this subject covers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Subject' : 'Update Subject'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default CreateSubjectForm 