"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Book, 
  Users, 
  CheckCircle, 
  Loader2
} from "lucide-react";
import { format } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define the form schema with validation
const examFormSchema = z.object({
  name: z.string().min(3, {
    message: "Exam name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  examPeriodId: z.number({
    required_error: "Please select an exam period.",
  }),
  classId: z.string({
    required_error: "Please select a class.",
  }),
  subjectId: z.string({
    required_error: "Please select a subject.",
  }),
  assessmentTypeId: z.number({
    required_error: "Please select an assessment type.",
  }),
  totalMarks: z.number().min(1, {
    message: "Total marks must be at least 1.",
  }).default(100),
  duration: z.number().min(0).optional(),
  examDate: z.date({
    required_error: "Please select a date.",
  }),
});

type ExamFormValues = z.infer<typeof examFormSchema>;

interface ExamPeriod {
  id: number;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface AssessmentType {
  id: number;
  name: string;
  category: string;
}

interface CreateExamFormProps {
  schoolId: string;
  examPeriods: ExamPeriod[];
  classes: Class[];
  subjects: Subject[];
  assessmentTypes: AssessmentType[];
}

const CreateExamForm = ({
  schoolId,
  examPeriods,
  classes,
  subjects,
  assessmentTypes,
}: CreateExamFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [studentsToAssign, setStudentsToAssign] = useState<"all" | "select">("all");
  
  // Initialize the form with default values
  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      name: "",
      description: "",
      totalMarks: 100,
      duration: 60,
    },
  });

  // Handle form submission
  async function onSubmit(data: ExamFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          schoolId,
          assignAllStudents: studentsToAssign === "all",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create exam");
      }
      
      const result = await response.json();
      
      toast.success("Exam created successfully!");
      
      // Redirect to the exam details page or student assignment page
      if (studentsToAssign === "all") {
        router.push(`/exams/${result.id}`);
      } else {
        router.push(`/exams/${result.id}/assign-students`);
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast.error("Failed to create exam. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle class selection to possibly filter subjects
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    form.setValue("classId", classId);
  };
  
  // Filter subjects based on selected class (if your system limits subjects per class)
  const filteredSubjects = selectedClass 
    ? subjects.filter(subject => true) // Replace with actual filtering logic
    : subjects;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Exam Details</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathematics Class Test 1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a descriptive name for this exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="examPeriodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Period</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {examPeriods.map((period) => (
                          <SelectItem key={period.id} value={period.id.toString()}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The academic term for this exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select 
                      onValueChange={handleClassChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The class taking this exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!selectedClass}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedClass ? "Select a subject" : "Select a class first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The subject for this exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="assessmentTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Type</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assessment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="" disabled>By Category</SelectItem>
                        <SelectItem value="" disabled className="font-semibold text-blue-600">Class Score</SelectItem>
                        {assessmentTypes
                          .filter(type => type.category === "Class Score")
                          .map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))
                        }
                        <SelectItem value="" disabled className="font-semibold text-blue-600">Exam Score</SelectItem>
                        {assessmentTypes
                          .filter(type => type.category === "Exam Score")
                          .map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type of assessment (e.g., Class Test, Assignment, End of Term)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="examDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Exam Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The date when this exam will be conducted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Marks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum possible marks for this exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="60"
                        {...field}
                        onChange={(e) => 
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Time allowed for the exam (leave empty if not applicable)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional information about this exam..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="options" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Assignment</CardTitle>
                <CardDescription>
                  Choose which students will take this exam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  defaultValue="all" 
                  className="space-y-4"
                  onValueChange={(value) => setStudentsToAssign(value as "all" | "select")}
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="all" id="all-students" />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="all-students"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Assign to all students in the selected class
                      </label>
                      <p className="text-sm text-muted-foreground">
                        All students in the selected class will be automatically assigned to this exam
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="select" id="select-students" />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="select-students"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Select specific students
                      </label>
                      <p className="text-sm text-muted-foreground">
                        You&apos;ll be able to select which students will take this exam after creation
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Exam"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default CreateExamForm;
