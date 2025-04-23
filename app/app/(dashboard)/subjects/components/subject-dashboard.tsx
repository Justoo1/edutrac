"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, UserPlus } from "lucide-react"
import CreateSubjectModal from './create-subject-modal'
import EnrollStudentModal from './enroll-student-modal'
import { Button } from "@/components/ui/button"

interface SubjectDashboardProps {
  stats: {
    totalSubjects: number;
    courseLinkedSubjects: number;
    studentEnrollments: number;
  };
  schoolType: 'SHS' | 'Basic';
  schoolId: string;
  onSubjectCreated?: () => void;
}

const SubjectDashboard = ({ stats, schoolType, schoolId, onSubjectCreated }: SubjectDashboardProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Subjects</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-white hover:bg-gray-100 text-black">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Subject
          </Button>
          <CreateSubjectModal 
            schoolType={schoolType} 
            schoolId={schoolId}
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
            onSuccess={() => {
              setIsCreateModalOpen(false)
              onSubjectCreated?.()
            }}
          />
          <Button onClick={() => setIsEnrollModalOpen(true)} className="bg-white hover:bg-gray-100 text-black">
            <UserPlus className="mr-2 h-4 w-4" />
            Enroll Students
          </Button>
          <EnrollStudentModal 
            schoolId={schoolId}
            subjectId="" // This will be set when enrolling from a specific subject
            open={isEnrollModalOpen}
            onOpenChange={setIsEnrollModalOpen}
            onSuccess={() => {
              setIsEnrollModalOpen(false)
              onSubjectCreated?.()
            }}
          />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Subjects
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">
              All registered subjects
            </p>
          </CardContent>
        </Card>
        
        {/* Only show course-linked card for SHS schools */}
        {schoolType === 'SHS' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Course-Linked
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.courseLinkedSubjects}</div>
              <p className="text-xs text-muted-foreground">
                Subjects linked to courses
              </p>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Student Enrollments
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Total student-subject enrollments
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default SubjectDashboard 