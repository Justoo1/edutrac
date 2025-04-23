"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  Loader2,
  PenSquare,
  Plus,
  User,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  name: string;
  indexNumber: string;
  status: "present" | "absent" | "exempted" | "sick" | "assigned";
  score?: number;
  grade?: string;
}

interface Exam {
  id: string;
  name: string;
  description?: string;
  examPeriodId: number;
  examPeriod: {
    name: string;
  };
  classId: string;
  class: {
    name: string;
    level: string;
  };
  subjectId: string;
  subject: {
    name: string;
    code: string;
  };
  examType: string;
  examTypeName?: string;
  totalMarks: number;
  duration?: number;
  examDate: string;
  status: string;
  students: Student[];
  createdAt: string;
}

interface ExamDetailsClientProps {
  examId: string;
  schoolId: string;
}

export default function ExamDetailsClient({ examId, schoolId }: ExamDetailsClientProps) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/exams/${examId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch exam details");
        }
        
        const data = await response.json();
        setExam(data);
      } catch (error) {
        console.error("Error fetching exam details:", error);
        toast.error("Failed to load exam details");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExamDetails();
  }, [examId]);
  
  const fetchStudents = async () => {
    if (exam?.students && exam.students.length > 0) return;
    
    try {
      setStudentsLoading(true);
      const response = await fetch(`/api/exams/${examId}/students`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      
      const data = await response.json();
      
      setExam(prev => {
        if (!prev) return null;
        return { ...prev, students: data };
      });
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setStudentsLoading(false);
    }
  };
  
  const handleStudentsTab = () => {
    setActiveTab("students");
    fetchStudents();
  };
  
  const formatDateTime = (dateString: string, includeTime = true) => {
    try {
      const date = new Date(dateString);
      if (includeTime) {
        return format(date, "PPP 'at' h:mm a");
      }
      return format(date, "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft": return "bg-gray-200 text-gray-800";
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "active": 
      case "in progress": return "bg-green-100 text-green-800";
      case "completed": return "bg-purple-100 text-purple-800";
      case "graded": return "bg-amber-100 text-amber-800";
      case "published": return "bg-teal-100 text-teal-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStudentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present": return "bg-green-100 text-green-800";
      case "absent": return "bg-red-100 text-red-800";
      case "exempted": return "bg-purple-100 text-purple-800";
      case "sick": return "bg-amber-100 text-amber-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <p className="text-lg text-muted-foreground mb-4">Exam not found</p>
        <Button onClick={() => router.push("/exams")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/exams")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Results
          </Button>
          <Button>
            <PenSquare className="mr-2 h-4 w-4" /> Edit Exam
          </Button>
        </div>
      </div>
      
      {/* Exam Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h1 className="text-2xl font-bold">{exam.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(exam.status)}>
                  {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {exam.subject?.name} • {exam.class?.name}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end mt-4 md:mt-0">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">
                  {formatDateTime(exam.examDate, false)}
                </span>
              </div>
              {exam.duration && (
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{exam.duration} minutes</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" /> Details
          </TabsTrigger>
          <TabsTrigger value="students" onClick={handleStudentsTab}>
            <Users className="h-4 w-4 mr-2" /> Students
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          {/* Exam Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
              <CardDescription>Details about this examination</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Period</h3>
                  <p>{exam.examPeriod?.name || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Subject</h3>
                  <p>{exam.subject?.name} ({exam.subject?.code})</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Class</h3>
                  <p>{exam.class?.name} ({exam.class?.level})</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Exam Type</h3>
                  <p>{exam.examTypeName || "Standard Exam"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Marks</h3>
                  <p>{exam.totalMarks}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Duration</h3>
                  <p>{exam.duration ? `${exam.duration} minutes` : "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Exam Date</h3>
                  <p>{formatDateTime(exam.examDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                  <p>{formatDateTime(exam.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {exam.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{exam.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  Students assigned to take this exam
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Students
              </Button>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !exam.students || exam.students.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-10 h-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                  <p className="text-muted-foreground">No students assigned to this exam yet</p>
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Students
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exam.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.indexNumber}
                          </TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <Badge className={getStudentStatusColor(student.status)}>
                              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {student.score !== undefined ? student.score : "-"}
                          </TableCell>
                          <TableCell>
                            {student.grade || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost">
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 