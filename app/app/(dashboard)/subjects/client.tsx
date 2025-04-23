"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SubjectDashboard from './components/subject-dashboard'
import SubjectList from './components/subject-list'
import { Loader2 } from "lucide-react"

export interface SubjectsPageClientProps {
  schoolId: string;
  schoolType: 'SHS' | 'Basic';
  initialStats: {
    totalSubjects: number;
    courseLinkedSubjects: number;
    studentEnrollments: number;
  };
}

const SubjectsPageClient = ({ schoolId, schoolType, initialStats }: SubjectsPageClientProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState(initialStats)
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now())

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/subjects/stats?schoolId=${schoolId}`)
        if (!response.ok) throw new Error('Failed to fetch stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [schoolId, refreshTrigger])

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading subjects...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SubjectDashboard 
        stats={stats} 
        schoolType={schoolType} 
        schoolId={schoolId} 
        onSubjectCreated={() => setRefreshTrigger(Date.now())}
      />
      
      <div className="grid gap-4 grid-cols-1">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>
              Manage all subjects and their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectList 
              schoolType={schoolType} 
              schoolId={schoolId} 
              refreshTrigger={refreshTrigger}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SubjectsPageClient 