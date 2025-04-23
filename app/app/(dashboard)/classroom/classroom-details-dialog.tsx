"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, Users, Calendar, School, GraduationCap, BookOpen, X, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { ViewStudentProfile } from "@/components/dashboard/students/view-student-profile"
import { EnrollStudentDialog } from "./enroll-student-dialog"
import { SelectSchool } from "@/lib/schema"

// Define interface for classroom data
interface ClassStudent {
  id: string
  firstName: string
  lastName: string
  studentId?: string
  status: string
}

interface ClassEnrollment {
  id: string
  status: string
  enrollmentDate: string
  student: ClassStudent
}

interface School {
  id: string
  name: string
  adminId: string | null
  address?: string | null
  image?: string | null
  description?: string | null
  logo?: string | null
  font?: string
  imageBlurhash?: string | null
  subdomain?: string | null
  customDomain?: string | null
  schoolCode?: string | null
}

interface Teacher {
  id: string
  name: string
}

interface AcademicYear {
  id: string
  name: string
}

interface ClassData {
  id: string
  name: string
  gradeLevel: string
  capacity: number
  schoolId: string
  room: string
  academicYear: string
  classTeacherId?: string
  schedule?: string
  createdAt: string
  updatedAt: string
  school: School
  classTeacher?: Teacher
  enrollments: ClassEnrollment[]
  studentCount: number
}

export function ClassroomDetailsDialog({ 
  children, 
  classId 
}: { 
  children: React.ReactNode
  classId: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [showStudentProfile, setShowStudentProfile] = useState(false)
  const [showEnrollStudent, setShowEnrollStudent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchClassData() {
      if (!open || !classId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/classes/${classId}/details`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch classroom details")
        }
        
        const data = await response.json()
        console.log({data})
        setClassData(data)
        console.log({classData})
      } catch (error) {
        console.error("Error fetching classroom details:", error)
        setError("Could not load classroom details. Please try again.")
        toast.error("Failed to load classroom details")
      } finally {
        setLoading(false)
      }
    }
    
    fetchClassData()
  }, [classId, open])

  const handleEnrollStudent = () => {
    setShowEnrollStudent(true)
  }

  const handleEdit = () => {
    setOpen(false)
    router.push(`/app/classroom?edit=${classId}`)
  }

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId)
    setShowStudentProfile(true)
  }

  const handleCloseStudentProfile = () => {
    setShowStudentProfile(false)
    setSelectedStudentId(null)
  }

  const handleClassUpdated = () => {
    // Refresh class data after students are enrolled
    if (!classId) return
    
    setLoading(true)
    setError(null)
    
    fetch(`/api/classes/${classId}/details`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to fetch classroom details")
        }
        return response.json()
      })
      .then(data => {
        setClassData(data)
        setLoading(false)
      })
      .catch(error => {
        console.error("Error refreshing classroom details:", error)
        setError("Could not refresh classroom details.")
        setLoading(false)
      })
  }

  const renderClassContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading classroom details...</p>
          </div>
        </div>
      )
    }

    if (error || !classData) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{error || "Could not load classroom details"}</p>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{classData.name}</h1>
            <p className="text-muted-foreground">
              Classroom details and enrolled students
            </p>
          </div>
          <div className="flex space-x-2">
            {classData && (
              <EnrollStudentDialog school={classData.school as SelectSchool}>
                <Button variant="outline" onClick={handleEnrollStudent}>
                  <Users className="mr-2 h-4 w-4" />
                  Enroll Student
                </Button>
              </EnrollStudentDialog>
            )}
            <Button onClick={handleEdit}>
              <BookOpen className="mr-2 h-4 w-4" />
              Edit Classroom
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Classroom Information</CardTitle>
              <CardDescription>Key details about this classroom</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <School className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{classData.school.name}</p>
                  <p className="text-xs text-muted-foreground">School</p>
                </div>
              </div>
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{classData.gradeLevel}</p>
                  <p className="text-xs text-muted-foreground">Grade Level</p>
                </div>
              </div>
              <div className="flex items-center">
                <Home className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{classData.room || 'Not assigned'}</p>
                  <p className="text-xs text-muted-foreground">Room</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{classData.studentCount} / {classData.capacity || 'Unlimited'}</p>
                  <p className="text-xs text-muted-foreground">Students / Capacity</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{classData.academicYear}</p>
                  <p className="text-xs text-muted-foreground">Academic Year</p>
                </div>
              </div>
              {classData.schedule && (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{classData.schedule}</p>
                    <p className="text-xs text-muted-foreground">Schedule</p>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{format(new Date(classData.createdAt), 'PPP')}</p>
                  <p className="text-xs text-muted-foreground">Created Date</p>
                </div>
              </div>
              {classData.classTeacher && (
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{classData.classTeacher.name}</p>
                    <p className="text-xs text-muted-foreground">Class Teacher</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Statistics</CardTitle>
              <CardDescription>Student enrollment data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold">{classData.studentCount}</h3>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold">
                    {classData.capacity ? Math.round((classData.studentCount / classData.capacity) * 100) : 'N/A'}%
                  </h3>
                  <p className="text-sm text-muted-foreground">Capacity Used</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold">
                    {classData.enrollments.filter(e => e.status === 'active').length}
                  </h3>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold">
                    {classData.enrollments.filter(e => e.status !== 'active').length}
                  </h3>
                  <p className="text-sm text-muted-foreground">Inactive Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Tab */}
        <Tabs defaultValue="students" className="w-full">
          <TabsList>
            <TabsTrigger value="students">Enrolled Students</TabsTrigger>
          </TabsList>
          <TabsContent value="students">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classData.enrollments.length > 0 ? (
                      classData.enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            {enrollment.student.firstName} {enrollment.student.lastName}
                          </TableCell>
                          <TableCell>{enrollment.student.studentId || 'N/A'}</TableCell>
                          <TableCell>{format(new Date(enrollment.enrollmentDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                              {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewStudent(enrollment.student.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No students are currently enrolled in this classroom.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showStudentProfile && selectedStudentId && classData && (
          <ViewStudentProfile
            isOpen={showStudentProfile}
            onClose={handleCloseStudentProfile}
            studentId={selectedStudentId}
            schoolId={classData.schoolId}
          />
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex flex-row justify-between items-start">
          <DialogTitle className="text-xl">Classroom Details</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="px-6 pb-6">
          {renderClassContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}