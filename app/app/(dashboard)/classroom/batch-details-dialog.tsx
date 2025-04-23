"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, Users, Calendar, School, GraduationCap, BookOpen, X } from "lucide-react"
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
import { AddStudentsToBatchDialog } from "./add-students-to-batch-dialog"
import { SelectSchool } from "@/lib/schema"

// Define interface for batch data
interface BatchStudent {
  id: string
  firstName: string
  lastName: string
  studentId?: string
  status: string
}

interface BatchEnrollment {
  id: string
  status: string
  enrollmentDate: string
  student: BatchStudent
}

// Updated to match SelectSchool type
interface School {
  id: string
  name: string
  adminId: string | null
  // Add any other required fields
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

interface AcademicYear {
  id: string
  name: string
}

interface BatchData {
  id: string
  name: string
  gradeLevel: string
  capacity: number
  schoolId: string
  academicYearId: string
  createdAt: string
  updatedAt: string
  school: School
  academicYear?: AcademicYear
  enrollments: BatchEnrollment[]
  studentCount: number
}

export function BatchDetailsDialog({ 
  children, 
  batchId 
}: { 
  children: React.ReactNode
  batchId: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [batchData, setBatchData] = useState<BatchData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [showStudentProfile, setShowStudentProfile] = useState(false)
  const [showEnrollStudents, setShowEnrollStudents] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchBatchData() {
      if (!open || !batchId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/batches/${batchId}/details`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch batch details")
        }
        
        const data = await response.json()
        setBatchData(data)
      } catch (error) {
        console.error("Error fetching batch details:", error)
        setError("Could not load batch details. Please try again.")
        toast.error("Failed to load batch details")
      } finally {
        setLoading(false)
      }
    }
    
    fetchBatchData()
  }, [batchId, open])

  const handleEnrollStudents = () => {
    setShowEnrollStudents(true)
  }

  const handleEdit = () => {
    setOpen(false)
    router.push(`/app/classroom?edit=${batchId}`)
  }

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId)
    setShowStudentProfile(true)
  }

  const handleCloseStudentProfile = () => {
    setShowStudentProfile(false)
    setSelectedStudentId(null)
  }

  const handleBatchUpdated = () => {
    // Refresh batch data after students are enrolled
    if (!batchId) return
    
    setLoading(true)
    setError(null)
    
    fetch(`/api/batches/${batchId}/details`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to fetch batch details")
        }
        return response.json()
      })
      .then(data => {
        setBatchData(data)
        setLoading(false)
      })
      .catch(error => {
        console.error("Error refreshing batch details:", error)
        setError("Could not refresh batch details.")
        setLoading(false)
      })
  }

  const renderBatchContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading batch details...</p>
          </div>
        </div>
      )
    }

    if (error || !batchData) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{error || "Could not load batch details"}</p>
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
            <h1 className="text-2xl font-bold tracking-tight">{batchData.name}</h1>
            <p className="text-muted-foreground">
              Batch details and enrolled students
            </p>
          </div>
          <div className="flex space-x-2">
            {batchData && (
              <AddStudentsToBatchDialog 
                school={batchData.school as SelectSchool} 
                batch={batchData} 
                onSuccess={handleBatchUpdated}
                open={showEnrollStudents}
                onOpenChange={setShowEnrollStudents}
              >
                <Button variant="outline" onClick={handleEnrollStudents}>
                  <Users className="mr-2 h-4 w-4" />
                  Enroll Students
                </Button>
              </AddStudentsToBatchDialog>
            )}
            <Button onClick={handleEdit}>
              <BookOpen className="mr-2 h-4 w-4" />
              Edit Batch
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Information</CardTitle>
              <CardDescription>Key details about this batch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <School className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{batchData.school.name}</p>
                  <p className="text-xs text-muted-foreground">School</p>
                </div>
              </div>
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{batchData.gradeLevel}</p>
                  <p className="text-xs text-muted-foreground">Grade Level</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{batchData.studentCount} / {batchData.capacity || 'Unlimited'}</p>
                  <p className="text-xs text-muted-foreground">Students / Capacity</p>
                </div>
              </div>
              {batchData.academicYear && (
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{batchData.academicYear.name}</p>
                    <p className="text-xs text-muted-foreground">Academic Year</p>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{format(new Date(batchData.createdAt), 'PPP')}</p>
                  <p className="text-xs text-muted-foreground">Created Date</p>
                </div>
              </div>
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
                  <h3 className="text-lg font-semibold">{batchData.studentCount}</h3>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold">
                    {batchData.capacity ? Math.round((batchData.studentCount / batchData.capacity) * 100) : 'N/A'}%
                  </h3>
                  <p className="text-sm text-muted-foreground">Capacity Used</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold">
                    {batchData.enrollments.filter(e => e.status === 'active').length}
                  </h3>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold">
                    {batchData.enrollments.filter(e => e.status !== 'active').length}
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
                    {batchData.enrollments.length > 0 ? (
                      batchData.enrollments.map((enrollment) => (
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
                          No students are currently enrolled in this batch.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showStudentProfile && selectedStudentId && batchData && (
          <ViewStudentProfile
            isOpen={showStudentProfile}
            onClose={handleCloseStudentProfile}
            studentId={selectedStudentId}
            schoolId={batchData.schoolId}
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
          <DialogTitle className="text-xl">Batch Details</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="px-6 pb-6">
          {renderBatchContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
} 