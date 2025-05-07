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
      
      toast.success("Terminal reports generated successfully!");
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : "Failed to generate reports"}`);
      toast.error(error instanceof Error ? error.message : "Failed to generate reports");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReports = (): void => {
    if (!result?.reportUrl) return;
    
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = result.reportUrl;
    link.setAttribute('download', `Terminal_Reports_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewReports = (): void => {
    if (!result?.reportUrl) return;
    window.open(result.reportUrl, '_blank');
  };

  const handleReset = (): void => {
    setActiveTab("form");
    setProgress(0);
    setStatus("");
    setResult(null);
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/reports')}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Reports
        </Button>
        <h1 className="text-3xl font-bold">Generate Terminal Reports</h1>
        <p className="text-muted-foreground mt-1">
          Create end-of-term academic reports for students
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="form" disabled={isGenerating}>
            <FileText className="mr-2 h-4 w-4" /> Report Options
          </TabsTrigger>
          <TabsTrigger value="progress" disabled={!status}>
            <Loader2 className="mr-2 h-4 w-4" /> Progress
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Terminal Report Configuration</CardTitle>
              <CardDescription>
                Configure the settings for generating terminal reports
              </CardDescription>
            </CardHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            Select the academic year for report generation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                            Select the term for report generation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                                {classItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the class for report generation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                  
                  {!generateAllStudents && students.length > 0 && (
                    <div className="border rounded-md p-4">
                      <FormLabel className="block mb-2">Select Students</FormLabel>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {students.map((student) => (
                          <div key={student.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={form.getValues().selectedStudents?.includes(student.id)}
                              onCheckedChange={(checked) => {
                                const currentSelected = form.getValues().selectedStudents || [];
                                if (checked) {
                                  form.setValue("selectedStudents", [
                                    ...currentSelected,
                                    student.id,
                                  ]);
                                } else {
                                  form.setValue(
                                    "selectedStudents",
                                    currentSelected.filter((id) => id !== student.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`student-${student.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {student.firstName} {student.lastName} ({student.studentId})
                            </label>
                          </div>
                        ))}
                      </div>
                      {!form.getValues().selectedStudents?.length && (
                        <p className="text-sm text-red-500 mt-2">
                          Please select at least one student
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              Add teacher comments to the reports
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
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
                            <FormLabel>Include attendance record</FormLabel>
                            <FormDescription>
                              Add attendance statistics to the reports
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/reports')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={
                      isLoading || 
                      (!generateAllStudents && 
                        (!form.getValues().selectedStudents || 
                          form.getValues().selectedStudents.length === 0))
                    }
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Reports
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Report Generation Progress</CardTitle>
              <CardDescription>
                Terminal report generation status and progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="flex items-center gap-2 text-sm border rounded-md p-4">
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : progress === 100 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
                <span>{status}</span>
              </div>
              
              {result && (
                <div className="border rounded-md p-4 bg-muted/20">
                  <h3 className="font-medium mb-2">Generation Complete</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generated {result.reportsCount} reports successfully.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={handleViewReports}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Reports
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadReports}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Reports
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                type="button" 
                onClick={handleReset}
                disabled={isGenerating}
                variant="outline"
                className="w-full"
              >
                Back to Form
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}