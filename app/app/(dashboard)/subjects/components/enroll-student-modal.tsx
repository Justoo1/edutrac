"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  guardian?: {
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    emergencyContact: string;
  };
  batchEnrollments: {
    batchId: string;
    batch: {
      id: string;
      name: string;
    };
  }[];
  enrollments: {
    classId: string;
    class: {
      id: string;
      name: string;
    };
  }[];
  subjectEnrollments: {
    subjectId: string;
    subject: {
      id: string;
      name: string;
    };
  }[];
}

interface Batch {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface EnrollStudentModalProps {
  schoolId: string;
  subjectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EnrollStudentModal({
  schoolId,
  subjectId,
  open,
  onOpenChange,
  onSuccess
}: EnrollStudentModalProps) {
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectId)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [selectedClass, setSelectedClass] = useState('all')

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const response = await fetch(`/api/subjects?schoolId=${schoolId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch subjects')
      }
      const data = await response.json()
      setSubjects(data.subjects || [])
    } catch (err) {
      console.error('Error fetching subjects:', err)
      toast.error('Failed to load subjects')
    }
  }

  // Fetch students
  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      console.log('Fetching students for school:', schoolId)
      const response = await fetch(`/api/students?schoolId=${schoolId}&includeEnrollments=true`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(errorData?.error || 'Failed to fetch students')
      }
      
      const data = await response.json()
      console.log('Fetched students data:', data)
      
      if (!Array.isArray(data)) {
        console.error('Invalid data format:', data)
        throw new Error('Invalid response format from server')
      }
      
      setAllStudents(data)
      filterEnrolledStudents(data, subjectId || selectedSubject)
    } catch (err) {
      console.error('Error in fetchStudents:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to load students')
      setAllStudents([])
      setStudents([])
      setFilteredStudents([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch classes
  const fetchClasses = async () => {
    try {
      const response = await fetch(`/api/classes?schoolId=${schoolId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }
      const data = await response.json()
      setClasses(data)
    } catch (err) {
      console.error('Error fetching classes:', err)
      toast.error('Failed to load classes')
    }
  }

  // Fetch batches
  const fetchBatches = async () => {
    try {
      const response = await fetch(`/api/batches?schoolId=${schoolId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch batches')
      }
      const data = await response.json()
      setBatches(data)
    } catch (err) {
      console.error('Error fetching batches:', err)
      toast.error('Failed to load batches')
    }
  }

  useEffect(() => {
    if (open) {
      fetchStudents()
      fetchClasses()
      fetchBatches()
      if (!subjectId) {
        fetchSubjects()
      } else {
        setSelectedSubject(subjectId)
      }
    }
  }, [open, schoolId, subjectId])

  // Filter students based on selected batch and class
  useEffect(() => {
    let filtered = [...students]
    console.log('Filtering students:', {
      totalStudents: students.length,
      selectedBatch,
      selectedClass,
      searchTerm,
      students: students.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        batchEnrollments: s.batchEnrollments,
        enrollments: s.enrollments
      }))
    })
    
    if (selectedBatch !== 'all') {
      filtered = filtered.filter(student => {
        const hasBatch = student.batchEnrollments?.some(
          enrollment => enrollment.batchId === selectedBatch
        )
        console.log('Batch filter:', { 
          studentId: student.id, 
          studentName: `${student.firstName} ${student.lastName}`,
          batchEnrollments: student.batchEnrollments,
          selectedBatch, 
          hasBatch 
        })
        return hasBatch
      })
    }
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(student => {
        const hasClass = student.enrollments?.some(
          (enrollment) => enrollment.classId === selectedClass
        )
        console.log('Class filter:', { 
          studentId: student.id, 
          studentName: `${student.firstName} ${student.lastName}`,
          enrollments: student.enrollments,
          selectedClass, 
          hasClass 
        })
        return hasClass
      })
    }
    
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    console.log('Filtered students:', {
      count: filtered.length,
      students: filtered.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        batchEnrollments: s.batchEnrollments,
        enrollments: s.enrollments
      }))
    })
    setFilteredStudents(filtered)
  }, [students, selectedBatch, selectedClass, searchTerm])

  // Add new function to filter enrolled students
  const filterEnrolledStudents = (studentList: Student[], currentSubjectId: string) => {
    if (!currentSubjectId) {
      setStudents(studentList)
      return
    }
    
    const filtered = studentList.filter((student: Student) => {
      return !student.subjectEnrollments?.some(
        enrollment => enrollment.subjectId === currentSubjectId
      )
    })
    
    setStudents(filtered)
    setSelectedStudents([]) // Clear selected students when subject changes
  }

  // Update useEffect for subject change
  useEffect(() => {
    if (selectedSubject) {
      filterEnrolledStudents(allStudents, selectedSubject)
    }
  }, [selectedSubject])

  const handleEnroll = async () => {
    if (!selectedStudents.length) {
      toast.error("Please select at least one student")
      return
    }

    try {
      const response = await fetch(`/api/subjects/${subjectId || selectedSubject}/enrollments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to enroll students")
      }

      toast.success("Students enrolled successfully")
      onSuccess?.()
      onOpenChange?.(false)
    } catch (error) {
      console.error("Error enrolling students:", error)
      toast.error(error instanceof Error ? error.message : "Failed to enroll students")
    }
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id))
    }
  }

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll Students</DialogTitle>
          <DialogDescription>
            Select students to enroll in {subjectId ? 'this subject' : 'a subject'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subject Selector - Only show when not opened from a specific subject */}
          {!subjectId && (
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Students List */}
          <div className="border rounded-md">
            <div className="p-4 border-b">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Select All
                </Label>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No students found
                </div>
              ) : (
                <div className="divide-y">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2 p-4 border-b last:border-b-0">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleSelectStudent(student.id)}
                      />
                      <Label htmlFor={`student-${student.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {student.firstName} {student.lastName}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={isLoading || selectedStudents.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                `Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 