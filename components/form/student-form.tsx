"use client";

import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { DynamicJsonForm } from "./dynamic-json-form";

// Schema for validation
const studentSchema = z.object({
  firstName: z.string().min(2, "First name must have at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must have at least 2 characters"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
  address: z.string().optional(),
  parentName: z.string().min(2, "Parent/Guardian name is required"),
  parentPhone: z.string().min(10, "Phone number must have at least 10 digits"),
  parentEmail: z.string().email("Invalid email address").optional(),
  emergencyContact: z.string().optional(),
  admissionDate: z.date({
    required_error: "Admission date is required",
  }),
  studentId: z.string().optional(),
  notes: z.string().optional(),
  schoolId: z.string(),
  contactInfo: z.record(z.string()).optional(),
  healthInfo: z.record(z.string()).optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  initialData?: Partial<StudentFormValues>;
  schoolId: string;
  onSuccess?: () => void;
}

// Add this function before the StudentForm component
function getYears() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 100; i--) {
    years.push(i);
  }
  return years;
}

// Add this function before the StudentForm component
function getMonths() {
  return [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];
}

export function StudentForm({ initialData, schoolId, onSuccess }: StudentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(initialData?.dateOfBirth || new Date());

  // Define form with default values
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      middleName: initialData?.middleName || "",
      lastName: initialData?.lastName || "",
      dateOfBirth: initialData?.dateOfBirth || undefined,
      gender: initialData?.gender || undefined,
      address: initialData?.address || "",
      parentName: initialData?.parentName || "",
      parentPhone: initialData?.parentPhone || "",
      parentEmail: initialData?.parentEmail || "",
      emergencyContact: initialData?.emergencyContact || "",
      admissionDate: initialData?.admissionDate || new Date(),
      studentId: initialData?.studentId || "",
      notes: initialData?.notes || "",
      schoolId: schoolId,
      contactInfo: initialData?.contactInfo || {},
      healthInfo: initialData?.healthInfo || {},
    },
  });

  // Update the displayed month whenever the date of birth field changes
  const dateOfBirth = form.watch("dateOfBirth");
  useEffect(() => {
    if (dateOfBirth) {
      setCalendarMonth(dateOfBirth);
    } else {
      setCalendarMonth(new Date()); // Reset to current month if date is cleared
    }
  }, [dateOfBirth]);

  async function onSubmit(data: StudentFormValues) {
    setIsSubmitting(true);
    
    try {
      // API endpoint depends on whether we're creating or updating
      const endpoint = initialData?.studentId ? `/api/students/${initialData.studentId}` : "/api/students";
      
      const response = await fetch(endpoint, {
        method: initialData?.studentId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save student data");
      }
      
      toast.success(`Student ${initialData?.studentId ? "updated" : "created"} successfully!`);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default navigation if no callback provided
        router.push("/students");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving student:", error);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Student Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            
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
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Middle name (optional)" {...field} />
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
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
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
                      <div className="flex items-center justify-between p-2">
                        <Select
                          value={calendarMonth.getFullYear().toString()}
                          onValueChange={(value) => {
                            const newDate = new Date(calendarMonth);
                            newDate.setFullYear(parseInt(value));
                            setCalendarMonth(newDate);
                            // Update the form value if a date is already selected
                            if (field.value) {
                              const updatedDate = new Date(field.value);
                              updatedDate.setFullYear(parseInt(value));
                              field.onChange(updatedDate);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {getYears().map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={calendarMonth.getMonth().toString()}
                          onValueChange={(value) => {
                            const newDate = new Date(calendarMonth);
                            newDate.setMonth(parseInt(value));
                            setCalendarMonth(newDate);
                            // Update the form value if a date is already selected
                            if (field.value) {
                              const updatedDate = new Date(field.value);
                              updatedDate.setMonth(parseInt(value));
                              field.onChange(updatedDate);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {getMonths().map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          if (date) {
                            setCalendarMonth(date);
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth} // Update state when month changes via arrows
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Home address"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Parent/Guardian Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Parent/Guardian Information</h3>
            
            <FormField
              control={form.control}
              name="parentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent/Guardian Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="parentPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="parentEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Alternative phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Academic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Academic Information</h3>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="admissionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Admission Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
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
                          date > new Date() || date < new Date("2000-01-01")
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
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Student ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank for auto-generation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Medical conditions, special needs, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Information</h3>
          
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
                  Add additional contact information (e.g., alternative phone, social media)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="healthInfo"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DynamicJsonForm
                    label="Health Information"
                    value={field.value || {}}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Add health-related information (e.g., allergies, medical conditions)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
            {isSubmitting ? "Saving..." : initialData?.studentId ? "Update Student" : "Add Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
}