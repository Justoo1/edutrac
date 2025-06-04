"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  BarChart,
  BookOpen,
  Calendar,
  Download,
  FileText,
  Loader2,
  Award,
  ClipboardList,
  BookCopy,
  AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { PerformanceChart } from "./performance-chart"
import { useReactToPrint } from "react-to-print"

// Define interfaces for the academic data
interface Grade {
  name: string;
  score: number;
  grade: string;
  remarks: string;
  batchPosition: number;
  classPosition: number;
  classScore: string;
  examScore: string;
  totalScore: string;
}

interface TermGrades {
  term: string;
  subjects: Grade[];
}

interface AttendanceMonth {
  month: string;
  present: number;
  absent: number;
  late: number;
}

interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalDays: number;
  percentage: number;
  months: AttendanceMonth[];
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  submittedDate: string | null;
  score: number | null;
  totalMarks: number;
  status: 'submitted' | 'pending' | 'late';
  subject: string;
}

interface AcademicData {
  student: {
    id: string;
    name: string;
    studentId: string;
    classAverage: number;
    studentAverage: number;
    classPosition: string;
  };
  grades: TermGrades[];
  attendance: AttendanceSummary;
  assignments: Assignment[];
}

interface ViewStudentRecordsProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  schoolId: string;
  studentName: string;
}

export function ViewStudentRecords({ isOpen, onClose, studentId, schoolId, studentName }: ViewStudentRecordsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("grades")
  const [academicData, setAcademicData] = useState<AcademicData | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentRecords()
    }
  }, [isOpen, studentId, schoolId])

  const handlePrint = useReactToPrint({
    contentRef: printRef, // Changed from 'content' to 'contentRef'
    documentTitle: `Student_${studentName || studentId}`,
    onAfterPrint: () => {
      console.log("Print completed")
    },
  })
  
  const fetchStudentRecords = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // In a production environment, we would call the actual API endpoint
      const response = await fetch(`/api/students/${studentId}/records?schoolId=${schoolId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch student records: ${response.status}`)
      }
      
      const data = await response.json()
      console.log({data})
      setAcademicData(data)
    } catch (err) {
      console.error("Error fetching student records:", err)
      setError("Failed to load academic records. Please try again.")
      
      // Fallback to demo data if in development mode or if there's an error
      if (process.env.NODE_ENV === 'development') {
        console.log("Using fallback academic data")
        // Set mock data
        setAcademicData({
          student: {
            id: studentId,
            name: studentName,
            studentId: studentId.startsWith("demo") ? "2023-ST-" + studentId.split("-")[1] : studentId,
            classAverage: 78,
            studentAverage: 83,
            classPosition: "3rd out of 25"
          },
          grades: [
            { 
              term: "First Term", 
              subjects: [
                { name: "Mathematics", score: 85, grade: "A", remarks: "Good performance" , batchPosition: 1, classPosition: 1, classScore: "78", examScore: "85", totalScore: "163"},
                { name: "English Language", score: 78, grade: "B", remarks: "Satisfactory" , batchPosition: 2, classPosition: 2, classScore: "78", examScore: "78", totalScore: "156"},
                { name: "Science", score: 92, grade: "A+", remarks: "Excellent" , batchPosition: 3, classPosition: 3, classScore: "78", examScore: "92", totalScore: "170"},
                { name: "Social Studies", score: 75, grade: "B", remarks: "Satisfactory", batchPosition: 4, classPosition: 4, classScore: "78", examScore: "75", totalScore: "155"},
                { name: "ICT", score: 88, grade: "A", remarks: "Good performance", batchPosition: 5, classPosition: 5, classScore: "78", examScore: "88", totalScore: "166"}
              ] 
            },
            { 
              term: "Second Term", 
              subjects: [
                { name: "Mathematics", score: 82, grade: "A", remarks: "Improved", batchPosition: 6, classPosition: 6, classScore: "78", examScore: "82", totalScore: "160"},
                { name: "English Language", score: 80, grade: "A", remarks: "Improved", batchPosition: 7, classPosition: 7, classScore: "78", examScore: "80", totalScore: "158"},
                { name: "Science", score: 90, grade: "A+", remarks: "Excellent", batchPosition: 8, classPosition: 8, classScore: "78", examScore: "90", totalScore: "168"},
                { name: "Social Studies", score: 78, grade: "B", remarks: "Improved", batchPosition: 9, classPosition: 9, classScore: "78", examScore: "78", totalScore: "156"},
                { name: "ICT", score: 85, grade: "A", remarks: "Good performance", batchPosition: 10, classPosition: 10, classScore: "78", examScore: "85", totalScore: "163"}
              ] 
            }
          ],
          attendance: {
            presentDays: 45,
            absentDays: 3,
            lateDays: 2,
            totalDays: 50,
            percentage: 90,
            months: [
              { month: "January", present: 20, absent: 1, late: 1 },
              { month: "February", present: 18, absent: 2, late: 0 },
              { month: "March", present: 16, absent: 0, late: 1 }
            ]
          },
          assignments: [
            { 
              id: "assign-001", 
              title: "Mathematics Homework", 
              dueDate: "2023-11-10", 
              submittedDate: "2023-11-09", 
              score: 18, 
              totalMarks: 20,
              status: "submitted",
              subject: "Mathematics" 
            },
            { 
              id: "assign-002", 
              title: "English Essay", 
              dueDate: "2023-11-15", 
              submittedDate: "2023-11-14", 
              score: 15, 
              totalMarks: 20,
              status: "submitted",
              subject: "English Language" 
            },
            { 
              id: "assign-003", 
              title: "Science Project", 
              dueDate: "2023-11-20", 
              submittedDate: null, 
              score: null, 
              totalMarks: 30,
              status: "pending",
              subject: "Science" 
            }
          ]
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    try {
      // In a real implementation, this would create a PDF using a library
      toast.info(`Downloading PDF report for ${studentName}`)
    } catch (err) {
      toast.error("Failed to generate PDF report")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Academic Records</DialogTitle>
          <DialogDescription>
            View academic records and performance for {studentName}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        ) : academicData ? (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10">
                            {studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{academicData.student.name}</h3>
                          <p className="text-sm text-muted-foreground">Student ID: {academicData.student.studentId}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handlePrint}>
                          <FileText className="h-4 w-4 mr-2" />
                          Print
                        </Button>
                        <Button size="sm" onClick={handleDownloadPDF}>
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Tabs defaultValue="grades" value={activeTab} onValueChange={setActiveTab} className="w-full" ref={printRef}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="grades">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Grades
                    </TabsTrigger>
                    <TabsTrigger value="attendance">
                      <Calendar className="h-4 w-4 mr-2" />
                      Attendance
                    </TabsTrigger>
                    <TabsTrigger value="assignments">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Assignments
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="grades" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Award className="h-5 w-5 mr-2" />
                          Academic Performance
                        </CardTitle>
                        <CardDescription>
                          Student&apos;s grades across all subjects and terms
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {academicData.grades.map((term, index) => (
                          <div key={index} className="mb-4">
                            <div className="bg-muted/50 p-3 font-medium">
                              {term.term}
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Subject</TableHead>
                                  <TableHead className="text-center">Score</TableHead>
                                  <TableHead className="text-center">Grade</TableHead>
                                  <TableHead>Remarks</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {term.subjects.map((subject, subjectIndex) => (
                                  <TableRow key={subjectIndex}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <BookCopy className="h-4 w-4 text-muted-foreground" />
                                        <span>{subject.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="font-medium">{subject.totalScore}%</span>
                                        <Progress value={Number(subject.totalScore)} className="h-1.5 w-16" />
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant={subject.grade.startsWith('A') ? 'default' : 'outline'}>
                                        {subject.grade}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{subject.remarks}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </CardContent>
                      <CardFooter className="bg-muted/30 p-3">
                        <div className="flex justify-between w-full">
                          <div>
                            <span className="text-sm font-medium">Class Average:</span>
                            <span className="text-sm ml-2">{academicData.student.classAverage}%</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Student Average:</span>
                            <span className="text-sm ml-2 font-medium text-primary">{academicData.student.studentAverage}%</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Class Position:</span>
                            <span className="text-sm ml-2">{academicData.student.classPosition}</span>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <BarChart className="h-5 w-5 mr-2" />
                          Performance Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-center bg-muted/30 rounded-md">
                          <PerformanceChart 
                            grades={academicData.grades}
                            studentAverage={academicData.student.studentAverage}
                            classAverage={academicData.student.classAverage}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="attendance" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          Attendance Summary
                        </CardTitle>
                        <CardDescription>
                          Attendance records for current academic term
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{academicData.attendance.presentDays}</p>
                                <p className="text-sm text-muted-foreground">Present Days</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-destructive">{academicData.attendance.absentDays}</p>
                                <p className="text-sm text-muted-foreground">Absent Days</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-500">{academicData.attendance.lateDays}</p>
                                <p className="text-sm text-muted-foreground">Late Arrivals</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold">{academicData.attendance.percentage}%</p>
                                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Table>
                          <TableCaption>Monthly attendance breakdown</TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Month</TableHead>
                              <TableHead className="text-center">Present</TableHead>
                              <TableHead className="text-center">Absent</TableHead>
                              <TableHead className="text-center">Late</TableHead>
                              <TableHead className="text-center">Attendance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {academicData.attendance.months.map((month, index) => {
                              const total = month.present + month.absent;
                              const percentage = total ? Math.round((month.present / total) * 100) : 0;
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell>{month.month}</TableCell>
                                  <TableCell className="text-center">{month.present}</TableCell>
                                  <TableCell className="text-center">{month.absent}</TableCell>
                                  <TableCell className="text-center">{month.late}</TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center gap-2 justify-center">
                                      <Progress value={percentage} className="h-2 w-16" />
                                      <span>{percentage}%</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="assignments" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <ClipboardList className="h-5 w-5 mr-2" />
                          Assignments & Homework
                        </CardTitle>
                        <CardDescription>
                          All assignments and their submission status
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Assignment</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {academicData.assignments.map((assignment) => (
                              <TableRow key={assignment.id}>
                                <TableCell>{assignment.title}</TableCell>
                                <TableCell>{assignment.subject}</TableCell>
                                <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={assignment.status === 'submitted' ? 'default' : 'outline'}
                                    className={
                                      assignment.status === 'submitted' 
                                        ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                        : 'border-yellow-200 text-yellow-800'
                                    }
                                  >
                                    {assignment.status === 'submitted' ? 'Submitted' : 'Pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {assignment.score !== null 
                                    ? `${assignment.score}/${assignment.totalMarks}` 
                                    : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                      <CardFooter className="bg-muted/30 p-3">
                        <div className="flex justify-between w-full text-sm">
                          <div>Total Assignments: {academicData.assignments.length}</div>
                          <div>Completed: {academicData.assignments.filter(a => a.status === 'submitted').length}</div>
                          <div>Pending: {academicData.assignments.filter(a => a.status === 'pending').length}</div>
                          <div>
                            Average Score: {(() => {
                              const completed = academicData.assignments.filter(a => a.score !== null);
                              if (completed.length === 0) return 'N/A';
                              const totalScore = completed.reduce((sum, a) => sum + (a.score || 0), 0);
                              const totalMarks = completed.reduce((sum, a) => sum + a.totalMarks, 0);
                              return `${Math.round((totalScore / totalMarks) * 100)}%`;
                            })()}
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No academic records found for this student.</p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint}>Print Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 