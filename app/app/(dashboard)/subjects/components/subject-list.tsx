"use client"

import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, Loader2, UserPlus, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import CreateSubjectForm from './create-subject-form'
import { toast } from "react-hot-toast"
import EnrollStudentModal from './enroll-student-modal'

type Subject = {
  id: string;
  name: string;
  code: string;
  batchId: string;
  courseId: string | null;
  description: string;
  studentCount: number;
}

type Batch = {
  id: string;
  name: string;
  gradeLevel: string;
  schoolType: string;
}

type Course = {
  id: string;
  name: string;
  department: string;
}

interface SubjectListProps {
  schoolType: 'SHS' | 'Basic';
  schoolId: string;
  refreshTrigger?: number;
}

const SubjectList = ({ schoolType, schoolId, refreshTrigger = 0 }: SubjectListProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [courses, setCourses] = useState<Record<string, Course>>({})
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  // For filtering
  const [searchTerm, setSearchTerm] = useState('')
  const [batchFilter, setBatchFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([])

  // State for managing modals
  const [viewSubject, setViewSubject] = useState<Subject | null>(null)
  const [editSubject, setEditSubject] = useState<Subject | null>(null)
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null)
  const [enrollSubject, setEnrollSubject] = useState<Subject | null>(null)

  // Fetch subjects
  const fetchSubjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/subjects?schoolId=${schoolId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch subjects')
      }
      const data = await response.json()
      setSubjects(data.subjects || [])
      setCourses(data.courses || {})
    } catch (err) {
      console.error('Error fetching subjects:', err)
      setError('Failed to load subjects. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and refresh when trigger changes
  useEffect(() => {
    fetchSubjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, refreshTrigger])

  // Fetch batches
  useEffect(() => {
    const loadBatches = async () => {
      const response = await fetch(`/api/batches?schoolId=${schoolId}`)
      const data = await response.json()
      setAvailableBatches(data || [])
    }
    loadBatches()
  }, [schoolId])

  // Handlers for modals
  const handleView = (subject: Subject) => {
    setViewSubject(subject)
  }

  const handleEdit = (subject: Subject) => {
    setEditSubject(subject)
  }

  const handleDelete = (subject: Subject) => {
    setDeleteSubject(subject)
  }

  // Filter subjects based on search term and filters
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      searchTerm === '' || 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBatch = 
      batchFilter === 'all' || 
      subject.batchId === batchFilter
    
    const matchesCourse = 
      courseFilter === 'all' || 
      (courseFilter === 'none' && !subject.courseId) || 
      subject.courseId === courseFilter
    
    return matchesSearch && matchesBatch && matchesCourse
  })

  // Get course name for display
  const getCourseName = (courseId: string | null | undefined) => {
    if (!courseId) return null
    return courses[courseId]?.name || null
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input 
            placeholder="Search subjects..." 
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            {searchTerm ? 'Clear' : 'Search'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create Subject
          </Button>
          <Select 
            value={batchFilter} 
            onValueChange={setBatchFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Grade Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {availableBatches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.gradeLevel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Only show course filter for SHS schools */}
          {schoolType === 'SHS' && (
            <Select 
              value={courseFilter} 
              onValueChange={setCourseFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Course Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {Object.entries(courses).map(([id, course]) => (
                  <SelectItem key={id} value={id}>
                    {course.name}
                  </SelectItem>
                ))}
                <SelectItem value="none">Core Subjects</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              {/* <TableHead>Grade Level</TableHead> */}
              {schoolType === 'SHS' && <TableHead>Course</TableHead>}
              <TableHead>Students</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>{subject.code}</TableCell>
                  {schoolType === 'SHS' && (
                    <TableCell>
                      {getCourseName(subject.courseId) ? (
                        <Badge variant="outline">{getCourseName(subject.courseId)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Core</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{subject.studentCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {subject.description}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="hover:bg-gray-200" onClick={() => handleView(subject)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-200" onClick={() => handleEdit(subject)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-200" onClick={() => setEnrollSubject(subject)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-200" onClick={() => handleDelete(subject)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={schoolType === 'SHS' ? 6 : 5} className="text-center py-8 text-muted-foreground">
                  {subjects.length === 0 ? 
                    "No subjects found. Create your first subject to get started." : 
                    "No subjects match your filters."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Create Subject Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>Add a new subject to your school</DialogDescription>
          </DialogHeader>
          <CreateSubjectForm 
            onSuccess={async () => {
              setIsCreateModalOpen(false)
              // Revalidate subjects
              await fetchSubjects()
            }}
            mode="create"
            schoolType={schoolType}
            schoolId={schoolId}
          />
        </DialogContent>
      </Dialog>

      {/* View Subject Modal */}
      <Dialog open={!!viewSubject} onOpenChange={(open) => !open && setViewSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewSubject?.name}</DialogTitle>
            <DialogDescription>Subject details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Code</h4>
              <p>{viewSubject?.code}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Grade Level</h4>
              <p>{viewSubject?.batchId}</p>
            </div>
            {schoolType === 'SHS' && (
              <div>
                <h4 className="text-sm font-medium">Course</h4>
                <p>{getCourseName(viewSubject?.courseId) || 'Core Subject (No Course)'}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium">Description</h4>
              <p>{viewSubject?.description}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Modal */}
      <Dialog open={!!editSubject} onOpenChange={(open) => !open && setEditSubject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update subject information</DialogDescription>
          </DialogHeader>
          {editSubject && (
            <CreateSubjectForm 
              onSuccess={async () => {
                setEditSubject(null)
                // Revalidate subjects
                await fetchSubjects()
              }}
              mode="edit"
              schoolType={schoolType}
              schoolId={schoolId}
              initialValues={{
                id: editSubject.id,
                name: editSubject.name,
                code: editSubject.code,
                description: editSubject.description,
                courseId: editSubject.courseId || '',
                isOptional: false,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteSubject} onOpenChange={(open) => !open && setDeleteSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subject
              &ldquo;{deleteSubject?.name}&rdquo; and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteSubject) {
                setIsLoading(true)
                try {
                  const response = await fetch(`/api/subjects/${deleteSubject.id}`, {
                    method: 'DELETE'
                  })
                  
                  if (!response.ok) {
                    throw new Error('Failed to delete subject')
                  }
                  
                  toast.success("Subject deleted successfully!")
                  // Revalidate subjects
                  await fetchSubjects()
                } catch (err) {
                  console.error('Error deleting subject:', err)
                  toast.error('Failed to delete subject. Please try again later.')
                } finally {
                  setIsLoading(false)
                  setDeleteSubject(null)
                }
              }
            }} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enroll Students Modal */}
      <EnrollStudentModal
        schoolId={schoolId}
        subjectId={enrollSubject?.id || ''}
        open={!!enrollSubject}
        onOpenChange={(open) => !open && setEnrollSubject(null)}
        onSuccess={() => {
          setEnrollSubject(null)
          fetchSubjects()
        }}
      />
    </div>
  )
}

export default SubjectList 