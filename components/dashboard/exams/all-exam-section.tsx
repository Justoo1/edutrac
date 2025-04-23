"use client";

import { useState, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FilePlus,
  Search,
  Users,
  Calendar,
  Clock,
  Download,
  PenSquare,
  ArrowLeft,
  Plus,
  User,
  FileText,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  generateExamScoresTemplate, 
  downloadCSV, 
  formatDateForFileName, 
  parseScoresCSV, 
  generateMultiExamScoresTemplate,
  parseMultiExamScoresCSV 
} from "@/lib/excel-utils";
import ExportModal from "./export-modal";

interface Student {
  id: string;
  name: string;
  indexNumber: string;
  status: "present" | "absent" | "exempted" | "sick" | "assigned";
  score?: number;
  grade?: string;
}

interface ExamScore {
  id: string;
  studentId: string;
  rawScore: number;
  scaledScore: number;
  gradeId: number;
  remarks: string;
  gradedBy: string;
  gradedAt: string;
}

interface Exam {
  id: string;
  name: string;
  description?: string;
  examPeriodId: number;
  examPeriod: {
    name: string;
  };
  subject: {
    name: string;
    code: string;
  };
  class: {
    name: string;
    level: string;
  };
  examType?: string;
  examTypeName?: string;
  totalMarks: number;
  duration?: number;
  examDate: string;
  status: string;
  createdAt: string;
  examStudents?: {
    id: string;
    studentId: string;
    status: string;
    student?: {
      id: string;
      firstName: string;
      lastName: string;
      studentId: string;
    };
  }[];
}

interface AllExamSectionProps {
  schoolId: string;
}

export default function AllExamSection({ schoolId }: AllExamSectionProps) {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [examStudents, setExamStudents] = useState<Student[]>([]);
  const [examScores, setExamScores] = useState<ExamScore[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportClassId, setExportClassId] = useState<string | null>(null);
  const [exportSubjectId, setExportSubjectId] = useState<string | null>(null);
  const [exportPeriodId, setExportPeriodId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  
  // Mock data for demo purposes - these would come from real API calls
  const classOptions = [
    { id: "class1", name: "Form 1A" },
    { id: "class2", name: "Form 1B" },
    { id: "class3", name: "Form 2A" },
  ];
  
  const subjectOptions = [
    { id: "subj1", name: "Mathematics", code: "MATH" },
    { id: "subj2", name: "Science", code: "SCI" },
    { id: "subj3", name: "English", code: "ENG" },
  ];
  
  const periodOptions = [
    { id: "period1", name: "First Term" },
    { id: "period2", name: "Second Term" },
    { id: "period3", name: "Third Term" },
  ];
  
  useEffect(() => {
    fetchExams();
  }, [schoolId]);
  
  const fetchExams = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching exams for school:', schoolId);
      
      const response = await fetch(`/api/exams?schoolId=${schoolId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch exams: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Exams fetched successfully:', data.length);
      setExams(data);
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error("Failed to load exams. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExamDetails = async (examId: string) => {
    try {
        toast.loading("Fetching exam details...")
      const response = await fetch(`/api/exams/${examId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch exam details");
      }
      
      const data = await response.json();
      toast.dismiss()
      setSelectedExam(data);
      const students = data.examStudents.map((es: any) => ({
        id: es.student?.id || es.id,
        name: es.student ? `${es.student.firstName} ${es.student.lastName}` : "Unknown",
        indexNumber: es.student?.studentId || "",
        status: es.status as "present" | "absent" | "exempted" | "sick" | "assigned",
      }));
      const scores = data.examScores.map((er: any) => ({
        id: er.id,
        studentId: er.studentId,
        rawScore: er.rawScore,
        scaledScore: er.scaledScore,
        gradeId: er.gradeId,
      }));

      setExamStudents(students);
      setExamScores(scores);
      setIsExamDialogOpen(true);
      setActiveTab("details");
    } catch (error) {
      toast.dismiss()
      console.error("Error fetching exam details:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load exam details");
    }
  };
  
  const fetchStudents = async (examId: string) => {
    if (selectedExam?.examStudents && selectedExam.examStudents.length > 0) {
      // Transform existing data
      const students = selectedExam.examStudents.map(es => ({
        id: es.student?.id || es.id,
        name: es.student ? `${es.student.firstName} ${es.student.lastName}` : "Unknown",
        indexNumber: es.student?.studentId || "",
        status: es.status as "present" | "absent" | "exempted" | "sick" | "assigned",
        score: undefined,
        grade: undefined,
      }));
      console.log({students})
      setExamStudents(students);
      return;
    }
    
    try {
      setStudentsLoading(true);
      const response = await fetch(`/api/exams/${examId}/students`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      
      const data = await response.json();
      setExamStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setStudentsLoading(false);
    }
  };
  
  const handleDeleteExam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    
    try {
      const response = await fetch(`/api/exams/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete exam");
      }
      
      setExams(prev => prev.filter(exam => exam.id !== id));
      if (selectedExam?.id === id) {
        setIsExamDialogOpen(false);
        setSelectedExam(null);
      }
      toast.success("Exam deleted successfully");
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error("Failed to delete exam");
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
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
  
  const handleStudentsTab = (examId: string) => {
    setActiveTab("students");
    // fetchStudents(examId);
  };
  
  const handleExportSingleExam = () => {
    if (!selectedExam || !examStudents.length) {
      toast.error("No students available for export");
      return;
    }
    
    try {
      // Format date for display and filename
      const formattedDate = formatDateTime(selectedExam.examDate, false);
      const dateForFilename = formatDateForFileName(selectedExam.examDate);
      
      // Create content for simple CSV export
      const headerRow = "Index Number,Student Name,Score,Remarks";
      const studentRows = examStudents.map(student => 
        `${student.indexNumber},"${student.name}",,`
      );
      
      const csvContent = [
        `Exam Name,${selectedExam.name}`,
        `Subject,${selectedExam.subject.name}`,
        `Class,${selectedExam.class.name}`,
        `Date,${formattedDate}`,
        `Total Marks,${selectedExam.totalMarks}`,
        '',
        headerRow,
        ...studentRows
      ].join('\n');
      
      // Create filename with exam info
      const filename = `${selectedExam.subject.code || 'SUBJ'}_${selectedExam.class.name.replace(/\s+/g, '')}_${dateForFilename}_scores.csv`;
      
      // Trigger download
      downloadCSV(filename, csvContent);
      
      toast.success("Exam template exported successfully");
    } catch (error) {
      console.error("Error exporting exam data:", error);
      toast.error("Failed to export exam data");
    }
  };
  
  const handleImportScores = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExam) return;
    
    try {
      setIsUploading(true);
      toast.loading("Processing scores...");
      
      // This part would handle single exam score uploads
      // We'll leave this as a placeholder since we've moved to multi-exam uploads
      
      toast.dismiss();
      toast.success("This feature has been replaced with multi-exam uploads");
      
      // Close the modal and reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading scores:", error);
      toast.dismiss();
      toast.error("Failed to upload scores");
    } finally {
      setIsUploading(false);
    }
  };
  
  const filteredExams = exams.filter(exam => 
    exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.class.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>All Exams</CardTitle>
              <CardDescription>
                View and manage all examination records
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => router.push("/exams/new")}>
                <FilePlus className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
              <Button variant="outline" onClick={() => setIsExportModalOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "No exams match your search query" 
                  : "No exams found"}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push("/exams/new")}>
                  Create Your First Exam
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => (
                    <TableRow key={exam.id} className="cursor-pointer hover:bg-muted/50" onClick={() => fetchExamDetails(exam.id)}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.subject.name}</TableCell>
                      <TableCell>{exam.class.name}</TableCell>
                      <TableCell>{formatDate(exam.examDate)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(exam.status)}>
                          {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{exam.examStudents?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              fetchExamDetails(exam.id);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/exams/${exam.id}/edit`);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Exam
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteExam(exam.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Exam
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exam Details Dialog */}
      <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedExam?.name}</h2>
                <Badge className={selectedExam && selectedExam.status ? getStatusColor(selectedExam.status) : ""}>
                  {selectedExam?.status ? selectedExam.status.charAt(0).toUpperCase() + selectedExam.status.slice(1) : ""}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {selectedExam?.subject.name} • {selectedExam?.class.name}
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDateTime(selectedExam.examDate, false)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportSingleExam}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                  <Button size="sm" onClick={() => router.push(`/exams/${selectedExam.id}/edit`)}>
                    <PenSquare className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="details">
                    <FileText className="h-4 w-4 mr-2" /> Details
                  </TabsTrigger>
                  <TabsTrigger value="students" onClick={() => handleStudentsTab(selectedExam.id)}>
                    <Users className="h-4 w-4 mr-2" /> Students
                  </TabsTrigger>
                  <TabsTrigger value="scores">
                    <FileText className="h-4 w-4 mr-2" /> Scores
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Period</h3>
                        <p>{selectedExam.examPeriod?.name || "Not specified"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Subject</h3>
                        <p>{selectedExam.subject?.name} ({selectedExam.subject?.code})</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Class</h3>
                        <p>{selectedExam.class?.name} ({selectedExam.class?.level})</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Exam Type</h3>
                        <p>{selectedExam.examTypeName || "Standard Exam"}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Marks</h3>
                        <p>{selectedExam.totalMarks}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Duration</h3>
                        <p>{selectedExam.duration ? `${selectedExam.duration} minutes` : "Not specified"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Exam Date</h3>
                        <p>{formatDateTime(selectedExam.examDate)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                        <p>{formatDateTime(selectedExam.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedExam.description && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                      <p className="whitespace-pre-line">{selectedExam.description}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="students">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : examStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-10 h-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                      <p className="text-muted-foreground">No students assigned to this exam yet</p>
                      <Button className="mt-4" variant="outline">
                        <Plus className="h-4 w-4 mr-2" /> Add Students
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 mt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Students List</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleExportSingleExam}
                        >
                          <Download className="h-4 w-4 mr-2" /> Export Template
                        </Button>
                      </div>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {examStudents.map((student) => (
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
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="scores">
                  {examScores.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No scores available for this exam</p>
                      <div className="mt-4 flex justify-center gap-2">
                        <Button 
                          variant="outline" 
                          onClick={handleExportSingleExam}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Upload Scores
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleImportScores}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Scores
                        </Button>
                      </div>
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                        aria-label="Upload exam scores CSV file"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 mt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Exam Scores</h3>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleExportSingleExam}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Update Scores
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleImportScores}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Import Scores
                          </Button>
                        </div>
                      </div>
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                        aria-label="Upload exam scores CSV file"
                      />
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Raw Score</TableHead>
                              <TableHead>Scaled Score</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead>Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {examScores.map((score) => {
                              const student = examStudents.find(s => s.id === score.studentId);
                              return (
                                <TableRow key={score.id}>
                                  <TableCell className="font-medium">
                                    {student?.indexNumber || score.studentId}
                                  </TableCell>
                                  <TableCell>{student?.name || "Unknown"}</TableCell>
                                  <TableCell>{score.rawScore}</TableCell>
                                  <TableCell>{score.scaledScore}</TableCell>
                                  <TableCell>{score.gradeId}</TableCell>
                                  <TableCell>{score.remarks || "-"}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Multi Exam Export Modal */}
      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        schoolId={schoolId}
        onExamsUpdated={fetchExams}
      />

      {/* Hidden file input for legacy single-exam upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileUpload}
        aria-label="Upload exam scores CSV file"
      />
    </>
  );
}