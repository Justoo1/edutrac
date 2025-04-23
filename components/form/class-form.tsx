"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Schema for validation
const classSchema = z.object({
  name: z.string().min(2, "Class name must have at least 2 characters"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  section: z.string().optional(),
  academicYear: z.string().min(4, "Academic year is required"),
  description: z.string().optional(),
  teacher: z.string().optional(),
  room: z.string().optional(),
  maxCapacity: z.string().optional(),
  schoolId: z.string(),
});

type ClassFormValues = z.infer<typeof classSchema>;

interface ClassFormProps {
  initialData?: Partial<ClassFormValues>;
  schoolId: string;
}

export function ClassForm({ initialData, schoolId }: ClassFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define form with default values
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: initialData?.name || "",
      gradeLevel: initialData?.gradeLevel || "",
      section: initialData?.section || "",
      academicYear: initialData?.academicYear || new Date().getFullYear().toString(),
      description: initialData?.description || "",
      teacher: initialData?.teacher || "",
      room: initialData?.room || "",
      maxCapacity: initialData?.maxCapacity || "",
      schoolId: schoolId,
    },
  });

  async function onSubmit(data: ClassFormValues) {
    setIsSubmitting(true);
    
    try {
      // API endpoint depends on whether we're creating or updating
      const endpoint = initialData?.id 
        ? `/api/classes/${initialData.id}` 
        : "/api/classes";
      
      const response = await fetch(endpoint, {
        method: initialData?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save class data");
      }
      
      toast.success(`Class ${initialData?.id ? "updated" : "created"} successfully!`);
      router.push("/classes");
      router.refresh();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Grade level options
  const gradeLevels = [
    "Kindergarten",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
    "JHS 1",
    "JHS 2",
    "JHS 3",
  ];

  // Academic years (current year - 1, current year, current year + 1)
  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear-1}-${currentYear}`,
    `${currentYear}-${currentYear+1}`,
    `${currentYear+1}-${currentYear+2}`,
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Basic Class Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Class Details</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Class name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for the class (e.g., "Primary 3 Science")
                  </FormDescription>
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gradeLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
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
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="A, B, C, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    If there are multiple sections of the same class
                  </FormDescription>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the class"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Additional Class Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <FormField
              control={form.control}
              name="teacher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Teacher (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Teacher name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Primary instructor or class teacher
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classroom (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Room number or name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="maxCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Capacity (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Number of students" type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum number of students allowed in this class
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData?.id ? "Update Class" : "Create Class"}
          </Button>
        </div>
      </form>
    </Form>
  );
}