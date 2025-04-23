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
  Loader2
} from "lucide-react"
import { useReactToPrint } from "react-to-print"
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
  email?: string;
  phone?: string;
  address?: string;
}

interface PrintStudentProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  schoolId: string;
}

export function PrintStudent({ isOpen, onClose, studentId, schoolId }: PrintStudentProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [printType, setPrintType] = useState<"profile" | "record">("profile")
  
  useEffect(() => {
    if (isOpen && studentId) {
      const fetchStudentData = async () => {
        setLoading(true)
        setError(null)
        
        try {
          // In a real application, we would fetch from the API
          // const response = await fetch(`/api/students/${studentId}?schoolId=${schoolId}`)
          // if (!response.ok) throw new Error("Failed to fetch student data")
          // const data = await response.json()
          // setStudent(data)
          
          // For demo purposes, we'll simulate a successful API call
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
            })
            setLoading(false)
          }, 1000)
          
        } catch (err) {
          console.error("Error fetching student:", err)
          setError("Failed to load student details")
          setLoading(false)
        }
      }
      
      fetchStudentData()
    }
  }, [isOpen, studentId, schoolId])
  
  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Student_${student?.studentId || studentId}`,
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
    // In a real world scenario, we'd generate a PDF file
    // For the demo, we'll just alert
    alert(`Downloading ${printType === 'profile' ? 'profile' : 'records'} as PDF for ${student?.firstName} ${student?.lastName}`)
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
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        ) : student ? (
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
                                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                </span>
                              </div>
                              <h2 className="text-lg font-bold">{getFullName(student)}</h2>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Student ID:</span>
                                <span className="text-sm">{student.studentId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Grade Level:</span>
                                <span className="text-sm">{student.currentGradeLevel}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                <span className="text-sm capitalize">{student.status}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Gender:</span>
                                <span className="text-sm">{student.gender}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Date of Birth:</span>
                                <span className="text-sm">
                                  {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}
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
                                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Email</p>
                                  <p className="text-sm">{student.email || 'No email provided'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Phone</p>
                                  <p className="text-sm">{student.phone || 'No phone provided'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Address</p>
                                  <p className="text-sm">{student.address || 'No address provided'}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
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
                                  <p className="text-sm">John Miller (Father)</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Phone</p>
                                  <p className="text-sm">(555) 101-0202</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Email</p>
                                  <p className="text-sm">johnmiller@example.com</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
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
                        {getFullName(student)} - {student.studentId}
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
                              <p className="text-sm">{getFullName(student)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Grade Level</p>
                              <p className="text-sm">{student.currentGradeLevel}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Academic Year</p>
                              <p className="text-sm">2023-2024</p>
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
                    
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">First Term Grades</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium text-sm">Subject</th>
                              <th className="text-center py-2 font-medium text-sm">Score</th>
                              <th className="text-center py-2 font-medium text-sm">Grade</th>
                              <th className="text-left py-2 font-medium text-sm">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 text-sm">Mathematics</td>
                              <td className="py-2 text-sm text-center">85%</td>
                              <td className="py-2 text-sm text-center">A</td>
                              <td className="py-2 text-sm">Good performance</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 text-sm">English Language</td>
                              <td className="py-2 text-sm text-center">78%</td>
                              <td className="py-2 text-sm text-center">B</td>
                              <td className="py-2 text-sm">Satisfactory</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 text-sm">Science</td>
                              <td className="py-2 text-sm text-center">92%</td>
                              <td className="py-2 text-sm text-center">A+</td>
                              <td className="py-2 text-sm">Excellent</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 text-sm">Social Studies</td>
                              <td className="py-2 text-sm text-center">75%</td>
                              <td className="py-2 text-sm text-center">B</td>
                              <td className="py-2 text-sm">Satisfactory</td>
                            </tr>
                            <tr>
                              <td className="py-2 text-sm">ICT</td>
                              <td className="py-2 text-sm text-center">88%</td>
                              <td className="py-2 text-sm text-center">A</td>
                              <td className="py-2 text-sm">Good performance</td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr className="border-t">
                              <td className="py-2 text-sm font-medium">Average</td>
                              <td className="py-2 text-sm text-center font-medium">83.6%</td>
                              <td className="py-2 text-sm text-center font-medium">A</td>
                              <td className="py-2 text-sm font-medium">Excellent</td>
                            </tr>
                          </tfoot>
                        </table>
                      </CardContent>
                    </Card>
                    
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Attendance Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-muted/30 rounded-md">
                            <p className="text-lg font-medium">45</p>
                            <p className="text-xs text-muted-foreground">Present Days</p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-md">
                            <p className="text-lg font-medium">3</p>
                            <p className="text-xs text-muted-foreground">Absent Days</p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-md">
                            <p className="text-lg font-medium">2</p>
                            <p className="text-xs text-muted-foreground">Late Arrivals</p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-md">
                            <p className="text-lg font-medium">90%</p>
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
                              <span className="text-sm font-medium">3rd out of 25</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Class Average:</span>
                              <span className="text-sm">78%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Student Average:</span>
                              <span className="text-sm font-medium">83.6%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Teacher's Remarks</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Sarah is a dedicated student who consistently demonstrates excellent academic performance.
                            She participates actively in class and completes all assignments on time.
                            Sarah should continue to maintain her diligence and focus.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-6 flex justify-between border-t pt-4">
                      <div>
                        <p className="text-sm font-medium">Class Teacher:</p>
                        <p className="text-sm">Mr. Johnson</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">School Principal:</p>
                        <p className="text-sm">Mrs. Williams</p>
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
        ) : null}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint}>Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 