"use client"

import { useState, useEffect } from "react"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateClass } from "@/lib/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { SelectClass } from "@/lib/schema"
import { Loader2 } from "lucide-react"

type Staff = {
  id: string
  name: string
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  room: z.string().min(1, "Room is required"),
  classTeacherId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function EditClassroomDialog({
  children,
  classroom,
}: {
  children: React.ReactNode
  classroom: SelectClass
}) {
  const [open, setOpen] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: classroom.name,
      gradeLevel: classroom.gradeLevel,
      academicYear: classroom.academicYear,
      capacity: classroom.capacity || 30,
      room: classroom.room || "",
      classTeacherId: classroom.classTeacherId || "",
    },
  })
  
  // Prevent the dialog from closing during form submission
  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting && !newOpen) return;
    setOpen(newOpen);
  };

  // Fetch staff when dialog opens
  useEffect(() => {
    let isMounted = true;
    
    async function fetchStaff() {
      if (open) {
        setLoading(true)
        try {
          const response = await fetch(`/api/teachers`)
          if (!response.ok) {
            throw new Error("Failed to fetch staff")
          }
          
          if (isMounted) {
            const data = await response.json()
            setStaff(data)
          }
        } catch (error: any) {
          if (isMounted) {
            toast.error(error.message)
          }
        } finally {
          if (isMounted) {
            setLoading(false)
          }
        }
      }
    }

    fetchStaff()
    
    return () => {
      isMounted = false;
    }
  }, [open])

  async function onSubmit(data: FormValues) {
    if (isSubmitting) return;
    console.log({data})
    
    setIsSubmitting(true);
    try {
      // Fetch the school object first
      const schoolResponse = await fetch(`/api/schools/${classroom.schoolId}`);
      if (!schoolResponse.ok) {
        throw new Error("Failed to fetch school data");
      }
      const school = await schoolResponse.json();

      // Create FormData object
      const formData = new FormData();
      formData.append("id", classroom.id);
      formData.append("name", data.name);
      formData.append("gradeLevel", data.gradeLevel);
      formData.append("academicYear", data.academicYear);
      formData.append("capacity", data.capacity.toString());
      formData.append("room", data.room);
      if (data.classTeacherId) {
        formData.append("classTeacherId", data.classTeacherId);
      }
      
      // Pass the FormData to updateClass
      const result = await updateClass(formData, school, "class");
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Classroom updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to update classroom");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset({
        name: classroom.name,
        gradeLevel: classroom.gradeLevel,
        academicYear: classroom.academicYear,
        capacity: classroom.capacity || 30,
        room: classroom.room || "",
        classTeacherId: classroom.classTeacherId || "",
      });
    }
  }, [open, classroom, form]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => {
        e.preventDefault(); // Prevent the default action
        setOpen(true); // Explicitly set dialog to open
      }}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Classroom</DialogTitle>
          <DialogDescription>
            Update the classroom details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Primary 3A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gradeLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Level</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Primary 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="academicYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2023-2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
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
                    <Input placeholder="e.g., Room 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classTeacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Teacher</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading teachers...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select class teacher" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staff.length > 0 ? (
                        staff.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                          {loading ? "Loading..." : "No teachers found"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Classroom"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}