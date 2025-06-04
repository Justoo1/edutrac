// components/dashboard/exams/report-comments-page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ReportCommentsManager } from './report-comments-manager';

interface ReportCommentsPageProps {
  schoolId: string;
  classId?: string;
  academicYearId?: string;
  academicTermId?: string;
}

export default function ReportCommentsPage({ 
  schoolId,
  classId: initialClassId,
  academicYearId: initialYearId,
  academicTermId: initialTermId
}: ReportCommentsPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicTerms, setAcademicTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedYear, setSelectedYear] = useState(initialYearId || '');
  const [selectedTerm, setSelectedTerm] = useState(initialTermId || '');
  const [selectedClass, setSelectedClass] = useState(initialClassId || '');
  
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    // Set the display from URL parameters if provided
    if (initialClassId && initialYearId && initialTermId) {
      setShowManager(true);
    }
    
    // Fetch academic years
    const fetchAcademicYears = async () => {
      try {
        const response = await fetch(`/api/schools/${schoolId}/academic/years`);
        if (!response.ok) throw new Error('Failed to fetch academic years');
        const data = await response.json();
        setAcademicYears(data);
        
        // Set default to current year if available, or use initial year if provided
        if (initialYearId) {
          setSelectedYear(initialYearId);
        } else {
          const currentYear = data.find((year: any) => year.isCurrent);
          if (currentYear) {
            setSelectedYear(currentYear.id);
          } else if (data.length > 0) {
            setSelectedYear(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching academic years:', error);
        toast.error('Failed to load academic years');
      }
    };

    // Fetch classes
    const fetchClasses = async () => {
      try {
        const response = await fetch(`/api/classes?schoolId=${schoolId}`);
        if (!response.ok) throw new Error('Failed to fetch classes');
        const data = await response.json();
        setClasses(data);
        
        // Set default class if initial class is provided
        if (initialClassId) {
          setSelectedClass(initialClassId);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
      }
    };

    Promise.all([fetchAcademicYears(), fetchClasses()])
      .then(() => setIsLoading(false))
      .catch((error) => {
        console.error('Error initializing data:', error);
        setIsLoading(false);
      });
  }, [schoolId, initialClassId, initialYearId, initialTermId]);

  // Fetch terms when academic year changes
  useEffect(() => {
    if (!selectedYear) return;
    
    const fetchAcademicTerms = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/schools/${schoolId}/academic/years/${selectedYear}/terms`);
        if (!response.ok) throw new Error('Failed to fetch academic terms');
        const data = await response.json();
        setAcademicTerms(data);
        
        // Set default to initial term if provided, or current term, or first term
        if (initialTermId) {
          setSelectedTerm(initialTermId);
        } else {
          const currentTerm = data.find((term: any) => term.isCurrent);
          if (currentTerm) {
            setSelectedTerm(currentTerm.id);
          } else if (data.length > 0) {
            setSelectedTerm(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching academic terms:', error);
        toast.error('Failed to load academic terms');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcademicTerms();
  }, [selectedYear, schoolId, initialTermId]);

  const handleGoBack = () => {
    router.push('/exams');
  };

  const handleManageComments = () => {
    if (!selectedClass || !selectedYear || !selectedTerm) {
      toast.error('Please select a class, academic year, and term');
      return;
    }

    // Update URL with query parameters
    router.push(
      `/exams/report/comments?classId=${selectedClass}&academicYearId=${selectedYear}&academicTermId=${selectedTerm}`
    );
    
    // Show the comments manager
    setShowManager(true);
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
        </Button>
        <h1 className="text-3xl font-bold">Manage Report Comments</h1>
        <p className="text-gray-600">Add and edit comments for student terminal reports</p>
      </div>

      {!showManager ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Class and Term</CardTitle>
            <CardDescription>Choose the class and academic period to manage report comments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Academic Year</label>
                <Select
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                  disabled={isLoading || academicYears.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name} {year.isCurrent && "(Current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Term</label>
                <Select
                  value={selectedTerm}
                  onValueChange={setSelectedTerm}
                  disabled={isLoading || !selectedYear || academicTerms.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicTerms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name} {term.isCurrent && "(Current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <Select
                  value={selectedClass}
                  onValueChange={setSelectedClass}
                  disabled={isLoading || classes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleManageComments}
                disabled={isLoading || !selectedClass || !selectedYear || !selectedTerm}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="mr-2 h-4 w-4" />
                )}
                Manage Comments
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => {
                router.push('/exams/report/comments');
                setShowManager(false);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Selection
            </Button>
          </div>
          
          <ReportCommentsManager
            schoolId={schoolId}
            classId={selectedClass}
            academicYearId={selectedYear}
            academicTermId={selectedTerm}
          />
        </>
      )}
    </div>
  );
}
