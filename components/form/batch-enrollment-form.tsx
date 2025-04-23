"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { BatchWithSchool } from "@/types/batch";
import { Student } from "@/types/student";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  studentIds: z.array(z.string()).nonempty("Select at least one student"),
});

type FormValues = z.infer<typeof formSchema>;

interface BatchEnrollmentFormProps {
  batch: BatchWithSchool;
  availableStudents: Student[];
  onSuccess?: () => void;
}

export function BatchEnrollmentForm({ 
  batch, 
  availableStudents, 
  onSuccess 
}: BatchEnrollmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentIds: [],
    },
  });

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
      form.setValue("studentIds", []);
    } else {
      const allStudentIds = availableStudents.map(student => student.id);
      setSelectedStudents(allStudentIds);
      form.setValue("studentIds", allStudentIds);
    }
    setSelectAll(!selectAll);
  };

  const toggleStudent = (studentId: string) => {
    let updatedSelection;
    
    if (selectedStudents.includes(studentId)) {
      updatedSelection = selectedStudents.filter(id => id !== studentId);
    } else {
      updatedSelection = [...selectedStudents, studentId];
    }
    
    setSelectedStudents(updatedSelection);
    form.setValue("studentIds", updatedSelection);
    
    // Update selectAll state
    setSelectAll(updatedSelection.length === availableStudents.length);
  };

  async function onSubmit(data: FormValues) {
    if (data.studentIds.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/schools/${batch.schoolId}/batch-enrollments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId: batch.id,
          studentIds: data.studentIds,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 400 && responseData.alreadyEnrolledStudents) {
          // Show more detailed error for already enrolled students
          const students = responseData.alreadyEnrolledStudents;
          const details = students.map((s: any) => 
            `${s.name} (already in ${s.enrolledIn})`
          ).join(", ");
          
          toast.error(`${responseData.error}: ${details}`);
        } else if (response.status === 401) {
          toast.error("You don't have permission to enroll students");
        } else if (response.status === 404) {
          toast.error("Batch or student not found");
        } else {
          toast.error(responseData.error || "Failed to enroll students");
        }
        return;
      }

      toast.success(`Successfully enrolled ${data.studentIds.length} students to batch`);
      
      // Reset form
      form.reset();
      setSelectedStudents([]);
      setSelectAll(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error enrolling students:", error);
      toast.error("An error occurred while enrolling students");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Enroll Students to {batch.name}</CardTitle>
        <CardDescription>
          Select students to enroll in this batch
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="studentIds"
              render={() => (
                <FormItem>
                  <FormLabel>Students</FormLabel>
                  <FormControl>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox 
                                checked={selectAll}
                                onCheckedChange={toggleSelectAll}
                              />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availableStudents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-4">
                                No available students to enroll
                              </TableCell>
                            </TableRow>
                          ) : (
                            availableStudents.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedStudents.includes(student.id)}
                                    onCheckedChange={() => toggleStudent(student.id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  {student.firstName} {student.lastName}
                                </TableCell>
                                <TableCell>{student.email}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedStudents.length} student(s) selected
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedStudents.length === 0}
              className="ml-auto"
            >
              {isSubmitting ? "Enrolling..." : "Enroll Students"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 