"use client"

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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SelectStaff, updateTeacher } from "@/lib/actions"
import { DynamicJsonForm } from "@/components/form/dynamic-json-form"
import { useState } from "react"

const teacherFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  staffId: z.string().min(1, "Staff ID is required"),
  position: z.string().min(1, "Position is required"),
  department: z.string().min(1, "Department is required"),
  qualification: z.string().min(1, "Qualification is required"),
  contactInfo: z.record(z.string()),
})

type TeacherFormValues = z.infer<typeof teacherFormSchema>

interface TeacherFormProps {
  teacher?: SelectStaff
  isLoading?: boolean
  onSuccess?: () => void
  onSubmit?: (data: TeacherFormValues) => Promise<void>
}

export function TeacherForm({ teacher, isLoading, onSubmit, onSuccess }: TeacherFormProps) {
  const router = useRouter()
  
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: teacher?.name || "",
      email: teacher?.email || "",
      staffId: teacher?.staffId || "",
      position: teacher?.position || "",
      department: teacher?.department || "",
      qualification: teacher?.qualification || "",
      contactInfo: teacher?.contactInfo || {},
    },
  })

  async function handleSubmit(data: TeacherFormValues) {
    try {
      if (onSubmit) {
        // Use the provided onSubmit function (for API route)
        await onSubmit(data);
      } else if (teacher) {
        // Update via server action (fallback)
        const result = await updateTeacher(teacher.id, {
          staffId: data.staffId,
          position: data.position,
          department: data.department,
          qualification: data.qualification,
          contactInfo: data.contactInfo,
        });
        
        if (result) {
          toast.success("Teacher updated successfully");
          router.refresh();
          onSuccess?.();
        } else {
          toast.error("Failed to update teacher");
        }
      } else {
        toast.error("No submission handler provided")
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter teacher's name" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter teacher's email" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="staffId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Staff ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter staff ID" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input placeholder="Enter position" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Enter department" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="qualification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Qualification</FormLabel>
                <FormControl>
                  <Input placeholder="Enter qualification" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4">
        <FormField
            control={form.control}
            name="contactInfo"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DynamicJsonForm
                    label="Contact Information"
                    value={field.value || {}}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Add additional contact information (e.g., phone, address, social media)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {teacher ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{teacher ? "Update" : "Create"} Teacher</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 