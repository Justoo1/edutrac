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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClass } from "@/lib/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { SelectSchool } from "@/lib/schema"

// Define batch type
type Batch = {
  id: string
  name: string
  gradeLevel: string
}

type Staff = {
  id: string
  name: string
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  room: z.string().min(1, "Room is required"),
  classTeacherId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function CreateClassroomDialog({ children, school }: { children: React.ReactNode, school: SelectSchool }) {
  const [open, setOpen] = useState(false)
  const [batches, setBatches] = useState<Batch[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gradeLevel: "",
      capacity: 30,
      room: "",
      classTeacherId: "",
    },
  })

  // Fetch batches and staff when dialog opens
  useEffect(() => {
    async function fetchData() {
      if (open) {
        setLoading(true)
        try {
          if (!school.id) {
            throw new Error("School ID not found")
          }

          const [batchesResponse, staffResponse] = await Promise.all([
            fetch(`/api/batches`),
            fetch(`/api/teachers`)
          ])

          if (!batchesResponse.ok || !staffResponse.ok) {
            throw new Error("Failed to fetch data")
          }

          const [batchesData, staffData] = await Promise.all([
            batchesResponse.json(),
            staffResponse.json()
          ])

          setBatches(batchesData)
          setStaff(staffData)
        } catch (error: any) {
          toast.error(error.message)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [open, school.id])

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString())
      })
      
      // Add a default academic year (current year format)
      const currentYear = new Date().getFullYear()
      formData.append("academicYear", `${currentYear}-${currentYear + 1}`)
      

      const result = await createClass(formData, school, null)
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast.success("Classroom created successfully")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create a unique list of grade levels from batches
  const uniqueGradeLevels = [...new Set(batches.map(batch => batch.gradeLevel))]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Classroom</DialogTitle>
          <DialogDescription>
            Create a new classroom for your school. Fill in the details below.
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
                            <span>Loading grade levels...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select grade level" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {uniqueGradeLevels.length > 0 ? (
                        uniqueGradeLevels.map((gradeLevel) => (
                          <SelectItem key={gradeLevel} value={gradeLevel}>
                            {gradeLevel}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                          {loading ? "Loading..." : "No grade levels found. Please create batches first."}
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
                    defaultValue={field.value}
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
              <Button type="submit" disabled={loading || uniqueGradeLevels.length === 0 || isSubmitting }>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Classroom"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 