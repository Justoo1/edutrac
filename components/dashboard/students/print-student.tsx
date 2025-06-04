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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Download,
  Printer,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { formatDate } from "@/lib/utils"

// Updated interfaces to match your actual data structure
interface Student {
  id: string;
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: Date | string;
  gender?: string;
  status?: string;
  contactInfo?: any;
  guardian?: any;
  address?: string;
  enrollmentDate?: Date | string;
}

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
  academicYear?: string;
  academicTerm?: string;
  totalScore?: number;
  averageScore?: number;
  rank?: string;
  subjects: Grade[];
}

interface AttendanceData {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalDays: number;
  percentage: number;
  months: Array<{
    month: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

interface StudentData {
  student: Student & {
    classAverage: number;
    studentAverage: number;
    classPosition: string;
  };
  grades: TermGrades[];
  attendance: AttendanceData;
  assignments: any[];
}

interface PrintStudentProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  schoolId: string;
}

export function PrintStudent({ isOpen, onClose, studentId, schoolId }: PrintStudentProps) {
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [printType, setPrintType] = useState<"profile" | "record">("profile")
  
  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentData()
    }
  }, [isOpen, studentId, schoolId])

  const fetchStudentData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch student profile
      const studentResponse = await fetch(`/api/students/${studentId}?schoolId=${schoolId}`)
      if (!studentResponse.ok) {
        throw new Error(`Failed to fetch student: ${studentResponse.status}`)
      }
      const student = await studentResponse.json()

      // Fetch student academic records
      const recordsResponse = await fetch(`/api/students/${studentId}/records?schoolId=${schoolId}`)
      if (!recordsResponse.ok) {
        throw new Error(`Failed to fetch records: ${recordsResponse.status}`)
      }
      const records = await recordsResponse.json()

      // Combine the data
      const combinedData: StudentData = {
        student: {
          ...student,
          classAverage: records.student?.classAverage || 0,
          studentAverage: records.student?.studentAverage || 0,
          classPosition: records.student?.classPosition || 'N/A'
        },
        grades: records.grades || [],
        attendance: records.attendance || {
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          totalDays: 0,
          percentage: 0,
          months: []
        },
        assignments: records.assignments || []
      }

      setStudentData(combinedData)
    } catch (err) {
      console.error("Error fetching student data:", err)
      setError("Failed to load student data. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Student_${studentData?.student?.studentId || studentId}`,
    onAfterPrint: () => {
      console.log("Print completed")
    },
  })
  
  // Format full name
  const getFullName = (student: Student) => {
    return `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`
  }
  
  // Handle download as PDF
  const handleDownloadPDF = () => {
    // In a real implementation, you would generate a PDF
    alert(`Downloading ${printType === 'profile' ? 'profile' : 'records'} as PDF for ${studentData?.student?.firstName} ${studentData?.student?.lastName}`)
  }

  // Get latest term data
  const getLatestTerm = () => {
    if (!studentData?.grades || studentData.grades.length === 0) return null
    return studentData.grades[studentData.grades.length - 1]
  }

  // Get guardian information
  const getGuardianInfo = () => {
    const guardian = studentData?.student?.guardian
    if (typeof guardian === 'object' && guardian !== null) {
      return guardian
    }
    return null
  }

  // Format contact info
  const getContactInfo = () => {
    const contactInfo = studentData?.student?.contactInfo
    if (typeof contactInfo === 'object' && contactInfo !== null) {
      return contactInfo
    }
    return {}
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Student Information</DialogTitle>
          <DialogDescription>
            Preview and print student details or academic records
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
        ) : studentData ? (
          <>
            <Tabs defaultValue="profile" onValueChange={(value) => setPrintType(value as "profile" | "record")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  Student Profile
                </TabsTrigger>
                <TabsTrigger value="record">
                  <FileText className="h-4 w-4 mr-2" />
                  Academic Record
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                <div className="flex justify-end space-x-2 mb-4">
                  <Button variant="outline" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Save as PDF
                  </Button>
                  <Button onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
                
                <div className="border rounded-lg p-8 bg-white" ref={printRef}>
                  <TabsContent value="profile" className="mt-0">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold">Student Profile</h1>
                      <p className="text-muted-foreground">Edutrac School System</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle>Personal Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-col items-center">
                              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-2 print:border">
                                <span className="text-2xl font-bold">
                                  {studentData.student.firstName.charAt(0)}{studentData.student.lastName.charAt(0)}
                                </span>
                              </div>
                              <h2 className="text-lg font-bold">{getFullName(studentData.student)}</h2>
                              <p className="text-sm text-muted-foreground">ID: {studentData.student.studentId}</p>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Student ID:</span>
                                <span className="text-sm">{studentData.student.studentId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                <span className="text-sm capitalize">{studentData.student.status || 'Active'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Gender:</span>
                                <span className="text-sm">{studentData.student.gender || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Date of Birth:</span>
                                <span className="text-sm">
                                  {studentData.student.dateOfBirth ? 
                                    new Date(studentData.student.dateOfBirth).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Enrollment Date:</span>
                                <span className="text-sm">
                                  {studentData.student.enrollmentDate ? 
                                    new Date(studentData.student.enrollmentDate).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Card className="mb-6">
                          <CardHeader className="pb-3">
                            <CardTitle>Contact Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Address</p>
                                  <p className="text-sm">
                                    {studentData.student.address || 
                                     getContactInfo().address || 
                                     'No address provided'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Phone</p>
                                  <p className="text-sm">
                                    {getContactInfo().phone || 'No phone provided'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {getGuardianInfo() && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle>Parent/Guardian Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium">Name</p>
                                    <p className="text-sm">
                                      {getGuardianInfo()?.name || 
                                       `${getGuardianInfo()?.firstName || ''} ${getGuardianInfo()?.lastName || ''}`.trim() ||
                                       'Not provided'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium">Phone</p>
                                    <p className="text-sm">{getGuardianInfo()?.phone || 'Not provided'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p className="text-sm">{getGuardianInfo()?.email || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center text-xs text-muted-foreground print:mt-10">
                      <p>Printed on {new Date().toLocaleDateString()}</p>
                      <p>This document is confidential and for official use only.</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="record" className="mt-0">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold">Academic Record</h1>
                      <p className="text-muted-foreground">
                        {getFullName(studentData.student)} - {studentData.student.studentId}
                      </p>
                    </div>
                    
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Student Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Name</p>
                              <p className="text-sm">{getFullName(studentData.student)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Student ID</p>
                              <p className="text-sm">{studentData.student.studentId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Academic Year</p>
                              <p className="text-sm">
                                {getLatestTerm()?.academicYear || 'Current Year'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Report Date</p>
                              <p className="text-sm">{new Date().toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <h2 className="text-lg font-bold mb-4">Academic Performance</h2>
                    
                    {studentData.grades.map((term, termIndex) => (
                      <Card key={termIndex} className="mb-6">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {term.academicTerm || term.term} Grades
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-medium text-sm">Subject</th>
                                <th className="text-center py-2 font-medium text-sm">Class Score</th>
                                <th className="text-center py-2 font-medium text-sm">Exam Score</th>
                                <th className="text-center py-2 font-medium text-sm">Total</th>
                                <th className="text-center py-2 font-medium text-sm">Grade</th>
                                <th className="text-left py-2 font-medium text-sm">Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {term.subjects.map((subject, subjectIndex) => (
                                <tr key={subjectIndex} className="border-b">
                                  <td className="py-2 text-sm">{subject.name}</td>
                                  <td className="py-2 text-sm text-center">{subject.classScore}</td>
                                  <td className="py-2 text-sm text-center">{subject.examScore}</td>
                                  <td className="py-2 text-sm text-center">{subject.totalScore}%</td>
                                  <td className="py-2 text-sm text-center">{subject.grade}</td>
                                  <td className="py-2 text-sm">{subject.remarks}</td>
                                </tr>
                              ))}
                            </tbody>
                            {term.averageScore && (
                              <tfoot>
                                <tr className="border-t">
                                  <td className="py-2 text-sm font-medium">Average</td>
                                  <td className="py-2 text-sm text-center">-</td>
                                  <td className="py-2 text-sm text-center">-</td>
                                  <td className="py-2 text-sm text-center font-medium">
                                    {Math.round(term.averageScore * 10) / 10}%
                                  </td>
                                  <td className="py-2 text-sm text-center">-</td>
                                  <td className="py-2 text-sm font-medium">
                                    {term.rank && `Position: ${term.rank}`}
                                  </td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Attendance Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-muted/30 rounded-md">
                            <p className="text-lg font-medium">{studentData.attendance.presentDays}</p>
                            <p className="text-xs text-muted-foreground">Present Days</p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-md">
                            <p className="text-lg font-medium">{studentData.attendance.absentDays}</p>
                            <p className="text-xs text-muted-foreground">Absent Days</p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-md">
                            <p className="text-lg font-medium">{studentData.attendance.lateDays}</p>
                            <p className="text-xs text-muted-foreground">Late Arrivals</p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-md">
                            <p className="text-lg font-medium">{studentData.attendance.percentage}%</p>
                            <p className="text-xs text-muted-foreground">Attendance Rate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Class Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Class Position:</span>
                              <span className="text-sm font-medium">{studentData.student.classPosition}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Class Average:</span>
                              <span className="text-sm">{studentData.student.classAverage}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Student Average:</span>
                              <span className="text-sm font-medium">{studentData.student.studentAverage}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Overall Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Total Terms:</span>
                              <span className="text-sm">{studentData.grades.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Subjects:</span>
                              <span className="text-sm">
                                {getLatestTerm()?.subjects.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Latest Rank:</span>
                              <span className="text-sm font-medium">
                                {getLatestTerm()?.rank || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-6 flex justify-between border-t pt-4">
                      <div>
                        <p className="text-sm font-medium">Class Teacher:</p>
                        <div className="border-b border-gray-300 w-32 mt-2"></div>
                        <p className="text-xs text-muted-foreground mt-1">Signature</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Headmaster/Headmistress:</p>
                        <div className="border-b border-gray-300 w-32 mt-2"></div>
                        <p className="text-xs text-muted-foreground mt-1">Signature</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center text-xs text-muted-foreground print:mt-10">
                      <p>Printed on {new Date().toLocaleDateString()}</p>
                      <p>This document is confidential and for official use only.</p>
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No student data found.</p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint} disabled={!studentData}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}