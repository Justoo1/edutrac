"use client"

import { useState, useEffect } from "react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, 
  GraduationCap,
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  User,
  Clock,
  Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDate } from "@/lib/utils"

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: Date | string;
  gender?: string;
  status?: string;
  currentGradeLevel?: string;
  contactInfo?: any;
  guardian?: any;
  primaryGuardian?: any;
  guardians?: any[];
  email?: string;
  phone?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  emergencyContact?: string;
}

interface ViewStudentProfileProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  schoolId: string;
}

// Define interfaces for academic data
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

interface TermGrades {
  term: string;
  subjects: {
    name: string;
    score: number;
    grade: string;
    remarks: string;
  }[];
}

interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalDays: number;
  percentage: number;
  months: MonthlyAttendance[];
}

interface MonthlyAttendance {
  month: string;
  present: number;
  absent: number;
  late: number;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string | null;
  submittedDate: string | null;
  score: number | null;
  totalMarks: number;
  status: string;
  subject: string;
}

export function ViewStudentProfile({ isOpen, onClose, studentId, schoolId }: ViewStudentProfileProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [academicData, setAcademicData] = useState<AcademicData | null>(null)
  const [academicLoading, setAcademicLoading] = useState(false)
  const [academicError, setAcademicError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && studentId) {
      const fetchStudentData = async () => {
        setLoading(true)
        setError(null)
        
        try {
          // Real API call to fetch student data
          const response = await fetch(`/api/students/${studentId}?schoolId=${schoolId}`)
          
          if (!response.ok) {
            throw new Error(`Failed to fetch student data: ${response.status}`)
          }
          
          const data = await response.json()
          setStudent(data)
          setLoading(false)
        } catch (err) {
          console.error("Error fetching student:", err)
          setError("Failed to load student details. Please try again.")
          setLoading(false)
          
          // Optional fallback for development/testing
          if (process.env.NODE_ENV === 'development') {
            console.log("Using fallback data in development mode")
            setTimeout(() => {
              setStudent({
                id: studentId,
                studentId: studentId.startsWith("demo") ? "2023-ST-" + studentId.split("-")[1] : studentId,
                firstName: "Sarah",
                lastName: "Miller",
                middleName: "Jane",
                email: "sarahmiller@eduprohigh.edu",
                dateOfBirth: "2008-04-18",
                gender: "Female",
                currentGradeLevel: "Grade 10",
                status: "active",
                phone: "(555) 101-0101",
                address: "101 High St, Springfield, IL",
                parentName: "John Miller",
                parentPhone: "(555) 101-0202",
                parentEmail: "john.miller@example.com",
                emergencyContact: "Jane Miller (Mother)",
              })
              setLoading(false)
              setError(null)
            }, 1000)
          }
        }
      }
      
      fetchStudentData()
    }
  }, [isOpen, studentId, schoolId])

  // Function to get student initials for avatar
  const getInitials = (student: Student) => {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`
  }
  
  // Function to get full name
  const getFullName = (student: Student) => {
    return `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`
  }
  
  // Function to get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'graduated':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'new':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Function to fetch academic data when academic tab is selected
  useEffect(() => {
    if (isOpen && activeTab === "academic" && studentId && !academicData && !academicLoading) {
      fetchAcademicData()
    }
  }, [isOpen, activeTab, studentId, academicData, academicLoading])

  const fetchAcademicData = async () => {
    setAcademicLoading(true)
    setAcademicError(null)
    
    try {
      const response = await fetch(`/api/students/${studentId}/records?schoolId=${schoolId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch academic data: ${response.status}`)
      }
      
      const data = await response.json()
      setAcademicData(data)
      setAcademicLoading(false)
    } catch (err) {
      console.error("Error fetching academic data:", err)
      setAcademicError("Failed to load academic records. Please try again.")
      setAcademicLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
          <DialogDescription>
            View detailed information about this student
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        ) : student ? (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex flex-col items-center md:w-1/3">
                  <Avatar className="h-24 w-24 mb-2">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getInitials(student)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-medium text-center">{getFullName(student)}</h3>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                  <div className="mt-2">
                    <Badge className={getStatusColor(student.status)}>
                      {student.status || 'Active'}
                    </Badge>
                  </div>
                  <div className="mt-4 w-full">
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{student.currentGradeLevel || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{student.gender || 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="academic" onClick={() => {
                        if (!academicData && !academicLoading) {
                          fetchAcademicData()
                        }
                      }} className="relative">
                        Academic
                        {academicLoading && <Loader2 className="h-3 w-3 ml-1 inline animate-spin" />}
                      </TabsTrigger>
                      <TabsTrigger value="contact">Contact</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Student Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Student ID</p>
                              <p className="text-sm text-muted-foreground">{student.studentId}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <p className="text-sm text-muted-foreground capitalize">{student.status || 'Active'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Grade Level</p>
                              <p className="text-sm text-muted-foreground">{student.currentGradeLevel || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Date of Birth</p>
                              <p className="text-sm text-muted-foreground">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Last attendance recorded</p>
                                <p className="text-sm text-muted-foreground">Yesterday, 8:30 AM</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Last assessment</p>
                                <p className="text-sm text-muted-foreground">Math Quiz - 85%</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="academic" className="space-y-4 mt-4">
                      {academicLoading ? (
                        <div className="flex justify-center items-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : academicError ? (
                        <Card>
                          <CardContent className="p-4 text-center text-red-500">
                            {academicError}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="ml-2"
                              onClick={fetchAcademicData}
                            >
                              Retry
                            </Button>
                          </CardContent>
                        </Card>
                      ) : academicData ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Academic Performance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-3 bg-muted rounded-md">
                                  <p className="text-xl font-bold">{academicData.student.studentAverage}%</p>
                                  <p className="text-xs text-muted-foreground">Average</p>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-md">
                                  <p className="text-xl font-bold">{academicData.grades.length > 0 && academicData.grades.some(term => term.subjects.length > 0) ? 
                                    Math.max(...academicData.grades
                                      .filter(term => term.subjects.length > 0)
                                      .flatMap(term => term.subjects.map(subject => subject.score))) : 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">Highest</p>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-md">
                                  <p className="text-xl font-bold">{academicData.grades.length > 0 && academicData.grades.some(term => term.subjects.length > 0) ? 
                                    Math.min(...academicData.grades
                                      .filter(term => term.subjects.length > 0)
                                      .flatMap(term => term.subjects.map(subject => subject.score))) : 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">Lowest</p>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <h4 className="text-sm font-medium mb-2">Current Subjects</h4>
                                <div className="space-y-2">
                                  {academicData.grades.length > 0 && academicData.grades[0].subjects.length > 0 ? (
                                    // Take subjects from the most recent term
                                    academicData.grades[0].subjects.map((subject, idx) => (
                                      <div key={idx} className="flex justify-between">
                                        <span className="text-sm">{subject.name}</span>
                                        <div className="flex gap-2 items-center">
                                          <span className="text-sm font-medium">{subject.score}%</span>
                                          <Badge variant="outline" className="text-xs">
                                            {subject.grade}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No subject records available yet</p>
                                  )}
                                </div>
                              </div>

                              {academicData.grades.length > 1 && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Previous Terms</h4>
                                    <div className="space-y-3">
                                      {academicData.grades.slice(1).map((term, idx) => (
                                        <div key={idx}>
                                          <p className="text-sm font-medium mb-1">{term.term}</p>
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            {term.subjects.map((subject, sidx) => (
                                              <div key={sidx} className="flex justify-between">
                                                <span>{subject.name}</span>
                                                <span className="font-medium">{subject.score}%</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}

                              {academicData.attendance && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Attendance</h4>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div className="bg-muted p-2 rounded-md text-center">
                                        <p className="font-medium">{academicData.attendance.presentDays}</p>
                                        <p className="text-muted-foreground">Present</p>
                                      </div>
                                      <div className="bg-muted p-2 rounded-md text-center">
                                        <p className="font-medium">{academicData.attendance.absentDays}</p>
                                        <p className="text-muted-foreground">Absent</p>
                                      </div>
                                      <div className="bg-muted p-2 rounded-md text-center">
                                        <p className="font-medium">{academicData.attendance.percentage}%</p>
                                        <p className="text-muted-foreground">Rate</p>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Academic Performance</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">No academic data available for this student yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">Academic records will appear here once assessments are recorded.</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={fetchAcademicData}
                            >
                              Refresh Data
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="contact" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">{student.email || 'No email provided'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Phone</p>
                              <p className="text-sm text-muted-foreground">{student.phone || 'No phone provided'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Address</p>
                              <p className="text-sm text-muted-foreground">{student.address || 'No address provided'}</p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Guardian Information</h4>
                            <div className="space-y-4">
                              {/* Primary Guardian */}
                              {(student.primaryGuardian || student.guardian?.parentName || student.parentName) && (
                                <div className="bg-muted/30 p-3 rounded-md">
                                  <p className="text-sm font-medium flex items-center gap-1">
                                    <User className="h-4 w-4 text-primary/70" />
                                    Primary Guardian
                                  </p>
                                  
                                  {student.primaryGuardian ? (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-sm font-medium">{student.primaryGuardian.firstName} {student.primaryGuardian.lastName}</p>
                                      <p className="text-sm">{student.primaryGuardian.relationship || 'Guardian'}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <p className="text-sm">{student.primaryGuardian.phone}</p>
                                      </div>
                                      {student.primaryGuardian.email && (
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-3 w-3 text-muted-foreground" />
                                          <p className="text-sm">{student.primaryGuardian.email}</p>
                                        </div>
                                      )}
                                      {student.primaryGuardian.alternativePhone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-3 w-3 text-muted-foreground" />
                                          <p className="text-sm">{student.primaryGuardian.alternativePhone} (Alternative)</p>
                                        </div>
                                      )}
                                      {student.primaryGuardian.occupation && (
                                        <p className="text-xs text-muted-foreground mt-1">Occupation: {student.primaryGuardian.occupation}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-sm font-medium">
                                        {student.guardian?.parentName || student.parentName || 'Not provided'}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <p className="text-sm">
                                          {student.guardian?.parentPhone || student.parentPhone || 'Not provided'}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        <p className="text-sm">
                                          {student.guardian?.parentEmail || student.parentEmail || 'Not provided'}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <p className="text-sm">
                                          {student.guardian?.emergencyContact || student.emergencyContact || 'Not provided'} (Emergency)
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Additional Guardians */}
                              {student.guardians && student.guardians.length > 1 && (
                                <div className="space-y-3 mt-4">
                                  <p className="text-sm font-medium">Additional Guardians</p>
                                  
                                  {student.guardians
                                    .filter(g => !student.primaryGuardian || g.id !== student.primaryGuardian.id)
                                    .map((guardian, index) => (
                                      <div key={guardian.id || index} className="bg-muted/20 p-2 rounded-md">
                                        <p className="text-sm font-medium">{guardian.firstName} {guardian.lastName}</p>
                                        <p className="text-xs text-muted-foreground">{guardian.relationship || 'Guardian'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Phone className="h-3 w-3 text-muted-foreground" />
                                          <p className="text-xs">{guardian.phone}</p>
                                        </div>
                                        {guardian.email && (
                                          <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            <p className="text-xs">{guardian.email}</p>
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => window.print()}>Print Details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 