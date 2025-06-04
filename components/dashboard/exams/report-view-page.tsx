// components/dashboard/exams/report-view-page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Eye, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ReportViewerPageProps {
  schoolId: string;
}

export default function ReportViewerPage({ schoolId }: ReportViewerPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicTerms, setAcademicTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    // Fetch academic years
    const fetchAcademicYears = async () => {
      try {
        const response = await fetch(`/api/schools/${schoolId}/academic/years`);
        if (!response.ok) throw new Error('Failed to fetch academic years');
        const data = await response.json();
        setAcademicYears(data);
        
        // Set default to current year if available
        const currentYear = data.find((year: any) => year.isCurrent);
        if (currentYear) {
          setSelectedYear(currentYear.id);
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
  }, [schoolId]);

  // Fetch terms when academic year changes
  useEffect(() => {
    if (!selectedYear) return;
    
    const fetchAcademicTerms = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/schools/${schoolId}/academic/terms`);
        if (!response.ok) throw new Error('Failed to fetch academic terms');
        const data = await response.json();
        setAcademicTerms(data);
        
        // Set default to current term if available
        const currentTerm = data.find((term: any) => term.isCurrent);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        } else if (data.length > 0) {
          setSelectedTerm(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching academic terms:', error);
        toast.error('Failed to load academic terms');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcademicTerms();
  }, [selectedYear, schoolId]);

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/classes/${selectedClass}/students`);
        if (!response.ok) throw new Error('Failed to fetch students');
        const data = await response.json();
        setStudents(data);
        setSelectedStudent(''); // Reset selected student
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  const handleGoBack = () => {
    router.push('/exams');
  };

  const handleViewReport = () => {
    if (!selectedStudent || !selectedYear || !selectedTerm) {
      toast.error('Please select a student, academic year, and term');
      return;
    }

    router.push(
      `/exams/report/student?studentId=${selectedStudent}&academicYearId=${selectedYear}&academicTermId=${selectedTerm}`
    );
  };

  const handleGenerateClassReports = () => {
    if (!selectedClass || !selectedYear || !selectedTerm) {
      toast.error('Please select a class, academic year, and term');
      return;
    }

    router.push(
      `/exams/report/generate?classId=${selectedClass}&academicYearId=${selectedYear}&academicTermId=${selectedTerm}`
    );
  };

  return (
    <div className="container max-w-5xl mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
        </Button>
        <h1 className="text-3xl font-bold">View Reports</h1>
        <p className="text-gray-600">Access and manage student terminal reports</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Individual Student Report</CardTitle>
          <CardDescription>View a single student&apos;s terminal report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <div>
              <label className="block text-sm font-medium mb-1">Student</label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
                disabled={isLoading || !selectedClass || students.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleViewReport} 
            disabled={!selectedStudent || !selectedYear || !selectedTerm || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            View Report
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class Reports</CardTitle>
          <CardDescription>Generate and download reports for an entire class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateClassReports}
            disabled={!selectedClass || !selectedYear || !selectedTerm || isLoading}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Reports
          </Button>
          <Button
            disabled={!selectedClass || !selectedYear || !selectedTerm || isLoading}
            onClick={() => toast.info("Download functionality coming soon")}
          >
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
