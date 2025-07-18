"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { CalendarIcon, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Schema for validation
const enrollmentSchema = z.object({
  classId: z.string().min(1, "Class selection is required"),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
  enrollmentDate: z.date({
    required_error: "Enrollment date is required",
  }),
  notes: z.string().optional(),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

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

interface Class {
  id: string;
  name: string;
  gradeLevel: string;
  section?: string;
  academicYear: string;
}

interface EnrollmentFormProps {
  schoolId: string;
}

export function EnrollmentForm({ schoolId }: EnrollmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [existingEnrollments, setExistingEnrollments] = useState<{classId: string, studentId: string}[]>([]);

  // Fetch students, classes, and enrollments data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsResponse, classesResponse, enrollmentsResponse] = await Promise.all([
          fetch(`/api/students?schoolId=${schoolId}`),
          fetch(`/api/classes?schoolId=${schoolId}`),
          fetch(`/api/enrollments?schoolId=${schoolId}`),
        ]);

        if (!studentsResponse.ok || !classesResponse.ok || !enrollmentsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [studentsData, classesData, enrollmentsData] = await Promise.all([
          studentsResponse.json(),
          classesResponse.json(),
          enrollmentsResponse.json(),
        ]);

        // Filter out inactive students
        const activeStudents = studentsData.filter(
          (student: any) => student.status === "active"
        );

        // Filter out inactive classes
        const activeClasses = classesData.filter(
          (classItem: any) => classItem.status === "active"
        );

        // Extract existing enrollments - ensure we have the correct property names
        const enrollments = enrollmentsData.map((enrollment: any) => ({
          classId: enrollment.classId,
          studentId: enrollment.studentId
        }));

        setStudents(activeStudents);
        setClasses(activeClasses);
        setExistingEnrollments(enrollments);
        
        // Don't set filtered students here - wait for class selection
        if (!selectedClass) {
          setFilteredStudents(activeStudents);
        } else {
          // Re-filter if a class is already selected
          filterStudentsByClass(selectedClass, activeStudents, activeClasses, enrollments);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load students and classes");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [schoolId, selectedClass]);

  // Define form with default values
  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      classId: "",
      studentIds: [],
      enrollmentDate: new Date(),
      notes: "",
    },
  });

  // Helper function to filter students based on class
  const filterStudentsByClass = (
    classId: string, 
    studentList: Student[] = students, 
    classList: Class[] = classes,
    enrollmentList: {classId: string, studentId: string}[] = existingEnrollments
  ) => {
    const selectedClassData = classList.find((c) => c.id === classId);
    
    if (!selectedClassData) return;
    
    // Get all enrolled students (in any class)
    const allEnrolledStudentIds = enrollmentList.map(enrollment => enrollment.studentId);
    
    // Filter students by matching batch grade level and NOT enrolled in any class
    const matchingStudents = studentList.filter(student => {
      const studentBatch = student.batchEnrollments?.[0]?.batch;
      return studentBatch?.gradeLevel === selectedClassData.gradeLevel && 
             !allEnrolledStudentIds.includes(student.id);
    });
    
    setFilteredStudents(matchingStudents);
  };

  // Update filtered students when class selection changes
  const onClassChange = (classId: string) => {
    setSelectedClass(classId);
    form.setValue("classId", classId);
    
    // Clear selected students when class changes
    setSelectedStudents([]);
    form.setValue("studentIds", []);
    
    // Filter students for the selected class
    filterStudentsByClass(classId);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSelection = prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId];
      
      form.setValue("studentIds", newSelection);
      return newSelection;
    });
  };

  async function onSubmit(data: EnrollmentFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          // Special handling for already enrolled students
          if (responseData.alreadyEnrolledStudents) {
            const enrolledInfo = responseData.alreadyEnrolledStudents.map((student: any) => 
              `${student.name} (enrolled in ${student.enrolledIn})`
            ).join(", ");
            
            toast.error(`Students can only be enrolled in one class at a time. Already enrolled: ${enrolledInfo}`);
          } else if (responseData.error) {
            // Show specific error message from the server
            toast.error(responseData.error);
          }
        } else if (response.status === 401) {
          toast.error("You don't have permission to perform this action");
        } else if (response.status === 404) {
          toast.error("Class or student not found");
        } else {
          throw new Error("Failed to enroll students");
        }
        return;
      }
      
      toast.success("Students enrolled successfully!");
      router.push("/enrollments");
      router.refresh();
    } catch (error: any) {
      console.error("Error enrolling students:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Enroll Students in Class</h3>
            
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Class</FormLabel>
                  <Select
                    onValueChange={(value) => onClassChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <SelectItem value="no-classes" disabled>
                          No classes available
                        </SelectItem>
                      ) : (
                        classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name} ({classItem.gradeLevel}
                            {classItem.section ? `, ${classItem.section}` : ""}) - {
                              classItem.academicYear
                            }
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enrollmentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Enrollment Date</FormLabel>
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
                  <FormDescription>
                    Date when students will be enrolled in the class
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about this enrollment"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="studentIds"
              render={() => (
                <FormItem>
                  <FormLabel>Select Students</FormLabel>
                  <FormDescription>
                    Select students to enroll in the selected class
                  </FormDescription>
                  
                  {filteredStudents.length === 0 ? (
                    <div className="rounded-md bg-yellow-50 p-4">
                      <p className="text-sm text-yellow-700">
                        {selectedClass 
                          ? "No eligible students found. Students are either already enrolled in a class or don't match this grade level."
                          : "No students available for enrollment."}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Grade Level</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student) => (
                            <TableRow 
                              key={student.id}
                              className={selectedStudents.includes(student.id) 
                                ? "bg-blue-50 dark:bg-blue-950" 
                                : ""
                              }
                              onClick={() => toggleStudentSelection(student.id)}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedStudents.includes(student.id)}
                                  onCheckedChange={() => toggleStudentSelection(student.id)}
                                />
                              </TableCell>
                              <TableCell>{student.studentId}</TableCell>
                              <TableCell>
                                {student.lastName}, {student.firstName}
                              </TableCell>
                              <TableCell>
                                {student.batchEnrollments?.[0]?.batch?.gradeLevel || 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    {selectedStudents.length > 0 ? (
                      <p className="text-sm text-green-600">
                        {selectedStudents.length} student(s) selected
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No students selected
                      </p>
                    )}
                  </div>
                  
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
          <Button 
            type="submit" 
            disabled={isSubmitting || selectedStudents.length === 0 || !selectedClass}
          >
            {isSubmitting ? "Enrolling..." : "Enroll Students"}
          </Button>
        </div>
      </form>
    </Form>
  );
}