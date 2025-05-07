// components/exams/ExamScoresExportModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";

interface ExamScoresExportModalProps {
  schoolId: string;
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
}

export default function ExamScoresExportModal({
  schoolId,
  isOpen,
  onClose,
}: ExamScoresExportModalProps) {
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [academicYears, setAcademicYears] = useState<Array<{ id: string; name: string }>>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string }>>([]);
  const [staffMembers, setStaffMembers] = useState<Array<{ id: string; name: string }>>([]);
  
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch data when modal is opened
  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);
  
  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  // Fetch classes and academic years when school changes
  const fetchInitialData = async () => {
    if (!schoolId) return;
    
    setIsLoading(true);
    try {
      const [classesResponse, yearsResponse, staffResponse] = await Promise.all([
        fetch(`/api/classes?schoolId=${schoolId}`),
        fetch(`/api/academic-years?schoolId=${schoolId}`),
        fetch(`/api/staff?schoolId=${schoolId}&role=teacher`)
      ]);
      
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData);
      }
      
      if (yearsResponse.ok) {
        const yearsData = await yearsResponse.json();
        setAcademicYears(yearsData);
      }
      
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setStaffMembers(staffData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch subjects when class changes
  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`/api/subjects?classId=${selectedClass}`);
        if (response.ok) {
          const data = await response.json();
          setSubjects(data);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };
    
    fetchSubjects();
  }, [selectedClass]);
  
  // Fetch terms when academic year changes
  useEffect(() => {
    if (!selectedYear) return;
    
    const fetchTerms = async () => {
      try {
        const response = await fetch(`/api/academic-terms?academicYearId=${selectedYear}`);
        if (response.ok) {
          const data = await response.json();
          setTerms(data);
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      }
    };
    
    fetchTerms();
  }, [selectedYear]);
  
  const resetForm = () => {
    setSelectedClass("");
    setSelectedSubject("");
    setSelectedYear("");
    setSelectedTerm("");
    setSelectedStaff("");
  };
  
  const handleExport = async () => {
    if (!selectedClass || !selectedSubject || !selectedYear || !selectedTerm) {
      toast.error("Please select all required fields");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        classId: selectedClass,
        subjectId: selectedSubject,
        academicYearId: selectedYear,
        termId: selectedTerm
      });
      
      if (selectedStaff) {
        params.append('staffId', selectedStaff);
      }
      
      // Fetch exam data
      const response = await fetch(`/api/exams/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch exam data");
      }
      
      // Get exam data and format CSV
      const examData = await response.json();
      
      if (!examData.exams || examData.exams.length === 0) {
        toast.error("No exams found for the selected criteria");
        return;
      }
      
      // Generate and download CSV
      const csvContent = generateExamScoresCSV(examData);
      downloadCSV(getFilename(examData), csvContent);
      
      toast.success("Exam scores template exported successfully");
      onClose(false);
    } catch (error) {
      console.error("Error exporting exam scores:", error);
      toast.error("Failed to export exam scores");
    } finally {
      setIsExporting(false);
    }
  };
  
  // Generate CSV content for exams with exam IDs included
  const generateExamScoresCSV = (data) => {
    // Create header rows with metadata
    const headerRows = [
      `Subject,${data.subjectName}`,
      `Class,${data.className}`,
      `Period,${data.periodName}`,
      ''
    ];

    // Create column headers (without number column)
    const examHeaders = ['Index Number', 'Student Name'];
    const idRow = ['', '']; // This row will contain exam IDs (hidden in Excel but used for imports)
    const marksRow = ['', '']; // This row contains total marks for each exam
    
    // Add each exam as a column with its ID
    data.exams.forEach(exam => {
      examHeaders.push(exam.name);
      idRow.push(exam.id); // Include exam ID for later reference
      marksRow.push(exam.totalMarks.toString());
    });
    
    headerRows.push(examHeaders.join(','));
    headerRows.push(idRow.join(','));
    headerRows.push(marksRow.join(','));
    
    // Get all unique students across all exams
    const allStudentIds = new Set();
    const studentMap = new Map();
    
    data.exams.forEach(exam => {
      exam.students.forEach(student => {
        if (!allStudentIds.has(student.id)) {
          allStudentIds.add(student.id);
          studentMap.set(student.id, {
            name: student.name,
            indexNumber: student.indexNumber
          });
        }
      });
    });
    
    // Create student rows without number column
    const studentRows = Array.from(allStudentIds).map(studentId => {
      const student = studentMap.get(studentId);
      const row = [
        student.indexNumber,
        `"${student.name}"` // Quote the name to handle commas
      ];
      
      // Add an empty cell for each exam
      data.exams.forEach(() => {
        row.push('');
      });
      
      return row.join(',');
    });
    
    // Combine all rows into a CSV string
    return [...headerRows, ...studentRows].join('\n');
  };
  
  // Generate filename based on selected options
  const getFilename = (data) => {
    const className = data.className.replace(/\s+/g, '_');
    const subjectName = data.subjectName.replace(/\s+/g, '_');
    const periodName = data.periodName.replace(/\s+/g, '_');
    
    return `${className}_${subjectName}_${periodName}_Exams.csv`;
  };
  
  // Helper function to download CSV
  const downloadCSV = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Export Exam Scores Template</DialogTitle>
          <DialogDescription>
            Create a template to fill in exam scores for multiple exams at once.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="class">Class</Label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={isLoading}
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={isLoading || !selectedClass}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder={selectedClass ? "Select a subject" : "Select a class first"} />
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
            
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
                disabled={isLoading}
              >
                <SelectTrigger id="academicYear">
                  <SelectValue placeholder="Select an academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="term">Term</Label>
              <Select
                value={selectedTerm}
                onValueChange={setSelectedTerm}
                disabled={isLoading || !selectedYear}
              >
                <SelectTrigger id="term">
                  <SelectValue placeholder={selectedYear ? "Select a term" : "Select an academic year first"} />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="staff">Staff (Optional)</Label>
              <Select
                value={selectedStaff}
                onValueChange={setSelectedStaff}
                disabled={isLoading}
              >
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select a staff member (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Staff</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={()=>onClose(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || !selectedClass || !selectedSubject || !selectedYear || !selectedTerm}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Export Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}