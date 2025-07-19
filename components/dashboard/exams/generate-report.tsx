"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Users,
  User,
  BookOpen,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";

// Type definitions
interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface AcademicTerm {
  id: string;
  name: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  academicYearId: string;
  isCurrent: boolean;
}

interface Class {
  id: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  capacity?: number;
  schoolId: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  schoolId: string;
  status: string;
}

interface GenerationResult {
  success: boolean;
  message?: string;
  reportUrl?: string;
  reportsCount?: number;
  failedCount?: number;
}

// Form schema
const reportFormSchema = z.object({
  academicYearId: z.string({
    required_error: "Please select an academic year",
  }),
  academicTermId: z.string({
    required_error: "Please select a term",
  }),
  classId: z.string({
    required_error: "Please select a class",
  }),
  generateAllStudents: z.boolean().default(true),
  selectedStudents: z.array(z.string()).optional(),
  includeComments: z.boolean().default(true),
  includeAttendance: z.boolean().default(true),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

interface GenerateTerminalReportsPageProps {
  schoolId: string;
}

export default function GenerateTerminalReportsPage({ schoolId }: GenerateTerminalReportsPageProps) {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>("form");

  // Initialize form
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      generateAllStudents: true,
      includeComments: true,
      includeAttendance: true,
      selectedStudents: [],
    },
  });

  // Watch for classId changes to load students
  const selectedClassId = form.watch("classId");
  const selectedYearId = form.watch("academicYearId");
  const selectedTermId = form.watch("academicTermId");
  const generateAllStudents = form.watch("generateAllStudents");

  // Load academic years on component mount
  useEffect(() => {
    const fetchAcademicYears = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/schools/${schoolId}/academic/years`);
        if (!response.ok) throw new Error("Failed to fetch academic years");
        const data: AcademicYear[] = await response.json();
        setAcademicYears(data);
        
        // Set default to current academic year if available
        const currentYear = data.find(year => year.isCurrent);
        if (currentYear) {
          form.setValue("academicYearId", currentYear.id);
        }
      } catch (error) {
        toast.error("Error loading academic years");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchClasses = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/classes?schoolId=${schoolId}`);
        if (!response.ok) throw new Error("Failed to fetch classes");
        const data: Class[] = await response.json();
        setClasses(data);
      } catch (error) {
        toast.error("Error loading classes");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcademicYears();
    fetchClasses();
  }, [schoolId, form]);

  // Load terms when academic year changes
  useEffect(() => {
    if (!selectedYearId) return;
    
    const fetchAcademicTerms = async (): Promise<void> => {
      setIsLoading(true);
      try {
        // Updated to use the correct endpoint from your existing code
        const response = await fetch(`/api/schools/${schoolId}/academic/terms`);
        if (!response.ok) {
            throw new Error("Failed to fetch academic terms");
        }
        const data: AcademicTerm[] = await response.json();
        setAcademicTerms(data);
        
        // Set default to current term if available
        const currentTerm = data.find(term => term.isCurrent);
        if (currentTerm) {
          form.setValue("academicTermId", currentTerm.id);
        }
      } catch (error) {
        toast.error("Error loading academic terms");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcademicTerms();
  }, [selectedYearId, schoolId, form]);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    
    const fetchStudents = async (): Promise<void> => {
      setIsLoading(true);
      try {
        // Using the endpoint from your existing code
        const response = await fetch(`/api/classes/${selectedClassId}/details`);
        if (!response.ok) throw new Error("Failed to fetch students");
        const classData = await response.json()
        const data: Student[] = classData.enrollments.student
        setStudents(data);
      } catch (error) {
        toast.error("Error loading students");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClassId]);

  const onSubmit = async (data: ReportFormValues): Promise<void> => {
    setIsGenerating(true);
    setProgress(0);
    setStatus("Preparing to generate reports...");
    setActiveTab("progress");
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 500);
      
      setStatus("Generating terminal reports...");
      
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId,
          classId: data.classId,
          academicYearId: data.academicYearId,
          academicTermId: data.academicTermId,
          options: {
            generateForAllStudents: data.generateAllStudents,
            studentIds: !data.generateAllStudents ? data.selectedStudents : undefined,
            includeComments: data.includeComments,
            includeAttendance: data.includeAttendance,
          },
        }),
      });

      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate reports");
      }
      
      const result: GenerationResult = await response.json();
      setProgress(100);
      setStatus("Report generation completed successfully!");
      setResult(result);
      
      // Show success message
      toast.success(`Successfully generated ${result.reportsCount} reports`);
      
    } catch (error) {
      console.error("Error generating reports:", error);
      setProgress(0);
      setStatus("Failed to generate reports");
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred"
      });
      toast.error("Failed to generate reports");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = (): void => {
    form.reset();
    setResult(null);
    setActiveTab("form");
  };

  const downloadReport = async (): Promise<void> => {
    if (!result?.reportUrl) return;
    
    try {
      window.open(result.reportUrl, "_blank");
    } catch (error) {
      toast.error("Error downloading report");
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push("/dashboard/exams")}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold ml-2">Generate Terminal Reports</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="form" disabled={isGenerating}>
            <FileText className="h-4 w-4 mr-2" />
            Report Options
          </TabsTrigger>
          <TabsTrigger value="progress" disabled={!isGenerating && !result}>
            {result ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Generation Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Terminal Report Generator</CardTitle>
              <CardDescription>
                Configure and generate terminal reports for students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Academic Year Selection */}
                  <FormField
                    control={form.control}
                    name="academicYearId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.map((year) => (
                              <SelectItem key={year.id} value={year.id}>
                                {year.name} {year.isCurrent && "(Current)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          <Calendar className="inline h-4 w-4 mr-1" />
                          Select the academic year for the reports
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Academic Term Selection */}
                  <FormField
                    control={form.control}
                    name="academicTermId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Term</FormLabel>
                        <Select
                          disabled={isLoading || !selectedYearId}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select academic term" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicTerms.map((term) => (
                              <SelectItem key={term.id} value={term.id}>
                                {term.name} {term.isCurrent && "(Current)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          <BookOpen className="inline h-4 w-4 mr-1" />
                          Select the term for the reports
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Class Selection */}
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map((classItem) => (
                              <SelectItem key={classItem.id} value={classItem.id}>
                                {classItem.name} ({classItem.gradeLevel})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          <Users className="inline h-4 w-4 mr-1" />
                          Select the class for which to generate reports
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Generate for all students checkbox */}
                  <FormField
                    control={form.control}
                    name="generateAllStudents"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Generate for all students</FormLabel>
                          <FormDescription>
                            Generate reports for all students in the selected class
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Student Selection (when not generating for all) */}
                  {!generateAllStudents && selectedClassId && (
                    <FormField
                      control={form.control}
                      name="selectedStudents"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Select Students</FormLabel>
                            <FormDescription>
                              <User className="inline h-4 w-4 mr-1" />
                              Choose specific students for report generation
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                            {students.map((student) => (
                              <FormField
                                key={student.id}
                                control={form.control}
                                name="selectedStudents"
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
                                        {student.firstName} {student.lastName} ({student.studentId})
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                            {students.length === 0 && (
                              <p className="text-sm text-muted-foreground">
                                No students found in this class
                              </p>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Include Comments Checkbox */}
                  <FormField
                    control={form.control}
                    name="includeComments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include teacher comments</FormLabel>
                          <FormDescription>
                            <MessageSquare className="inline h-4 w-4 mr-1" />
                            Include teacher comments in the generated reports
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Include Attendance Checkbox */}
                  <FormField
                    control={form.control}
                    name="includeAttendance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include attendance records</FormLabel>
                          <FormDescription>
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Include attendance statistics in the generated reports
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={resetForm}
                disabled={isGenerating}
              >
                Reset
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={isGenerating || isLoading || (!generateAllStudents && (!form.getValues().selectedStudents || form?.getValues()?.selectedStudents?.length === 0))}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Reports
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>
                {result ? (
                  result.success ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Report Generation Complete
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Report Generation Failed
                    </div>
                  )
                ) : (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Reports
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {status}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="w-full" />
              
              {result && (
                <div className="space-y-2 mt-4">
                  {result.success ? (
                    <div className="text-sm">
                      <p>Successfully generated {result.reportsCount} reports.</p>
                      {result.failedCount && result.failedCount > 0 && (
                        <p className="text-yellow-600 mt-2">
                          Note: {result.failedCount} reports could not be generated.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-3 rounded-md">
                      <p>{result.message || "An error occurred during report generation."}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("form")}
                disabled={isGenerating}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Options
              </Button>
              {result && result.success && result.reportUrl && (
                <Button 
                  onClick={downloadReport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Reports
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
