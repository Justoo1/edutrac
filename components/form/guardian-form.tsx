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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Schema for validation
const guardianSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, "First name must have at least 2 characters"),
  lastName: z.string().min(2, "Last name must have at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must have at least 10 digits"),
  alternativePhone: z.string().optional(),
  relationship: z.string().min(1, "Relationship is required"),
  occupation: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.boolean().default(true),
  notes: z.string().optional(),
  createAccount: z.boolean().default(true),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
  primaryStudentIds: z.array(z.string()).optional(),
});

type GuardianFormValues = z.infer<typeof guardianSchema>;

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  batchEnrollments?: {
    batch: {
      id: string;
      name: string;
      gradeLevel: string;
    };
  }[];
}

interface GuardianFormProps {
  initialData?: Partial<GuardianFormValues>;
  schoolId: string;
}

export function GuardianForm({ initialData, schoolId }: GuardianFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch students for the school
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(`/api/students?schoolId=${schoolId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch students");
        }
        const data = await response.json();
        // Filter active students only
        const activeStudents = data.filter((student: any) => student.status === "active");
        setStudents(activeStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [schoolId]);

  // Define form with default values
  const form = useForm<GuardianFormValues>({
    resolver: zodResolver(guardianSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      alternativePhone: initialData?.alternativePhone || "",
      relationship: initialData?.relationship || "",
      occupation: initialData?.occupation || "",
      address: initialData?.address || "",
      emergencyContact: initialData?.emergencyContact !== undefined ? initialData.emergencyContact : true,
      notes: initialData?.notes || "",
      createAccount: initialData?.id ? false : true, // Don't create account if editing
      studentIds: initialData?.studentIds || [],
      primaryStudentIds: initialData?.primaryStudentIds || [],
    },
  });

  // Watch student selections to manage primary students
  const selectedStudentIds = form.watch("studentIds");
  
  // Update primary students when selected students change
  useEffect(() => {
    const primaryIds = form.getValues("primaryStudentIds") || [];
    const validPrimaryIds = primaryIds.filter(id => selectedStudentIds.includes(id));
    
    // If there are selected students but no valid primary students, set the first selected student as primary
    if (selectedStudentIds.length > 0 && validPrimaryIds.length === 0) {
      form.setValue("primaryStudentIds", [selectedStudentIds[0]]);
    } else {
      form.setValue("primaryStudentIds", validPrimaryIds);
    }
  }, [selectedStudentIds, form]);

  const onSubmit = async (data: GuardianFormValues) => {
    setIsSubmitting(true);
    
    try {
      // API endpoint depends on whether we're creating or updating
      const endpoint = initialData?.id 
        ? `/api/guadians/${initialData.id}` 
        : "/api/guadians";
      
      const response = await fetch(endpoint, {
        method: initialData?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          schoolId, // Add schoolId for validation on the server
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save guardian data");
      }
      
      toast.success(`Guardian ${initialData?.id ? "updated" : "created"} successfully!`);
      router.push("/guardian");
      router.refresh();
    } catch (error) {
      console.error("Error saving guardian:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Relationship options
  const relationshipOptions = [
    "Father",
    "Mother",
    "Grandparent",
    "Uncle",
    "Aunt",
    "Brother",
    "Sister",
    "Legal Guardian",
    "Other",
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Guardian Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Enter the guardian&apos;s basic contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email address" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
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
                name="alternativePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternative Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Alternative phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship to Student</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationshipOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
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
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Occupation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
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
              
              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Emergency Contact</FormLabel>
                      <FormDescription>
                        Whether this guardian should be contacted in case of emergency
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
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Student Association and Account Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  Select the students associated with this guardian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="studentIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Associated Students</FormLabel>
                        <FormDescription>
                          Select all students that this guardian is responsible for
                        </FormDescription>
                      </div>
                      <div className="space-y-2">
                        {students.length === 0 ? (
                          <p className="text-sm text-yellow-600">No students available to select</p>
                        ) : (
                          students.map((student) => (
                            <FormField
                              key={student.id}
                              control={form.control}
                              name="studentIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={student.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(student.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, student.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== student.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {student.lastName}, {student.firstName} ({student.studentId}) - {student.batchEnrollments?.[0]?.batch?.gradeLevel || 'N/A'}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedStudentIds.length > 0 && (
                  <FormField
                    control={form.control}
                    name="primaryStudentIds"
                    render={() => (
                      <FormItem className="mt-6">
                        <div className="mb-4">
                          <FormLabel className="text-base">Primary Student(s)</FormLabel>
                          <FormDescription>
                            Select the primary student(s) for this guardian. This affects permissions and notifications.
                          </FormDescription>
                        </div>
                        <div className="space-y-2">
                          {students
                            .filter(student => selectedStudentIds.includes(student.id))
                            .map((student) => (
                              <FormField
                                key={student.id}
                                control={form.control}
                                name="primaryStudentIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={student.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(student.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value || [], student.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== student.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {student.lastName}, {student.firstName} ({student.studentId}) - {student.batchEnrollments?.[0]?.batch?.gradeLevel || 'N/A'}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
            
            {!initialData?.id && (
              <Card>
                <CardHeader>
                  <CardTitle>User Account</CardTitle>
                  <CardDescription>
                    Create a user account for the guardian to access the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="createAccount"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Create User Account</FormLabel>
                          <FormDescription>
                            Create login credentials for this guardian to access the system
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
                  {form.watch("createAccount") && (
                    <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        A temporary password will be generated and sent to the guardian&apos;s email address.
                        They will be prompted to change it on first login.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
          <Button 
            type="submit" 
            disabled={isSubmitting || selectedStudentIds.length === 0}
          >
            {isSubmitting ? "Saving..." : initialData?.id ? "Update Guardian" : "Add Guardian"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
