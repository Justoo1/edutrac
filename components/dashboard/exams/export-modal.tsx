// components/dashboard/exams/export-modal.tsx

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { 
  generateExcelWorkbook,
  downloadExcel,
  processExcelFile
} from "@/lib/excel-utils"; // Import from our new file

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  onExamsUpdated: () => void;
}

export default function ExportModal({
  open,
  onOpenChange,
  schoolId,
  onExamsUpdated
}: ExportModalProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [classOptions, setClassOptions] = useState<any[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [academicYearOptions, setAcademicYearOptions] = useState<any[]>([]);
  const [termOptions, setTermOptions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset selections and set loading state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedClassId("");
      setSelectedSubjectId("");
      setSelectedStaffId("");
      setSelectedAcademicYear("");
      setSelectedTermId("");
      setAvailableExams([]);
      setSelectedExamIds(new Set());
      setOptionsLoading(true);
    }
  }, [open]);

  // Fetch options when modal opens
  useEffect(() => {
    const fetchOptions = async () => {
      if (!schoolId || !open) return;
      
      setOptionsLoading(true);
      try {
        const [classResponse, subjectResponse, staffResponse, academicYearResponse, termResponse] = await Promise.all([
          fetch(`/api/classes?schoolId=${schoolId}`),
          fetch(`/api/subjects?schoolId=${schoolId}`),
          fetch(`/api/teachers?schoolId=${schoolId}`),
          fetch(`/api/schools/${schoolId}/academic/years`),
          fetch(`/api/schools/${schoolId}/academic/terms`)
        ]);
        
        if (!classResponse.ok) {
          throw new Error("Failed to fetch classes");
        }
        if (!subjectResponse.ok) {
          throw new Error("Failed to fetch subjects");
        }
        if (!staffResponse.ok) {
          throw new Error("Failed to fetch staff");
        }
        if (!academicYearResponse.ok) {
          throw new Error("Failed to fetch academic years");
        }
        if (!termResponse.ok) {
          throw new Error("Failed to fetch academic terms");
        }
        
        const classData = await classResponse.json();
        const subjectData = await subjectResponse.json();
        const staffData = await staffResponse.json();
        const academicYearData = await academicYearResponse.json();
        const termData = await termResponse.json();
        
        // Handle the subjects response properly - subjects API returns {subjects: [...]}
        const subjects = Array.isArray(subjectData.subjects) ? subjectData.subjects : [];
        
        setClassOptions(Array.isArray(classData) ? classData : []);
        setSubjectOptions(subjects);
        setStaffOptions(Array.isArray(staffData) ? staffData : []);
        setAcademicYearOptions(Array.isArray(academicYearData) ? academicYearData : []);
        setTermOptions(Array.isArray(termData) ? termData : []);
      } catch (error) {
        console.error("Error fetching options:", error);
        toast.error(error instanceof Error ? error.message : "Failed to fetch options");
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, [schoolId, open]);

  // Individual handlers for each dropdown change
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassId(e.target.value);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubjectId(e.target.value);
  };

  const handleAcademicYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAcademicYear(e.target.value);
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTermId(e.target.value);
  };

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStaffId(e.target.value);
  };

  // Use effect to fetch exams when all required fields are filled
  useEffect(() => {
    if (selectedClassId && selectedSubjectId && selectedAcademicYear && selectedTermId && selectedStaffId) {
      fetchAvailableExams();
    }
  }, [selectedClassId, selectedSubjectId, selectedAcademicYear, selectedTermId, selectedStaffId]);

  // Fetch available exams
  const fetchAvailableExams = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedAcademicYear || !selectedTermId || !selectedStaffId) {
      setAvailableExams([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/exams/search?classId=${selectedClassId}&subjectId=${selectedSubjectId}&academicYearId=${selectedAcademicYear}&termId=${selectedTermId}&responsibleStaffId=${selectedStaffId}&schoolId=${schoolId}`
      );

      if (!response.ok) {
        const body = await response.json();
        console.log(body);
        toast.error(body.error || "Failed to fetch exams");
        setAvailableExams([]);
        return;
      }

      const exams = await response.json();
      setAvailableExams(exams);

      // Select all exams by default
      const newSelectedExams = new Set<string>();
      exams.forEach((exam: any) => {
        newSelectedExams.add(exam.id);
      });
      setSelectedExamIds(newSelectedExams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error("Failed to fetch available exams");
      setAvailableExams([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle exam selection change
  const handleExamCheckboxChange = (examId: string, checked: boolean) => {
    const newSelectedExams = new Set(selectedExamIds);
    
    if (checked) {
      newSelectedExams.add(examId);
    } else {
      newSelectedExams.delete(examId);
    }

    setSelectedExamIds(newSelectedExams);
  };

  // Export data to Excel
  const handleExportTemplate = async () => {
    if (selectedExamIds.size === 0) {
      toast.error("Please select at least one exam to export");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Preparing export...");

      // Filter only selected exams
      const examsToExport = availableExams.filter(exam => 
        selectedExamIds.has(exam.id)
      );

      // Get students for each exam
      const examsWithStudents = await Promise.all(
        examsToExport.map(async (exam) => {
          // Get or extract exam type name
          const examTypeName = exam.examType.name || getExamTypeNameById(exam.examType);
          console.log({examTypeName})
          
          // If exam already has students, use them
          if (exam.examStudents && exam.examStudents.length > 0) {
            return {
              id: exam.id,
              name: exam.name,
              subject: exam.subject,
              class: exam.class,
              examDate: format(new Date(exam.examDate), "yyyy-MM-dd"),
              totalMarks: exam.totalMarks,
              examTypeName,
              students: exam.examStudents.map(es => ({
                id: es.student?.id || es.studentId,
                name: es.student ? `${es.student.firstName} ${es.student.lastName}` : "Unknown",
                indexNumber: es.student?.studentId || ""
              }))
            };
          }

          // Otherwise fetch students
          const studentsResponse = await fetch(`/api/exams/${exam.id}/students`);
          if (!studentsResponse.ok) {
            throw new Error(`Failed to fetch students for exam ${exam.name}`);
          }

          const students = await studentsResponse.json();
          return {
            id: exam.id,
            name: exam.name,
            subject: exam.subject,
            class: exam.class,
            examDate: format(new Date(exam.examDate), "yyyy-MM-dd"),
            totalMarks: exam.totalMarks,
            examTypeName,
            students: students.map((s: any) => ({
              id: s.id,
              name: s.name,
              indexNumber: s.indexNumber
            }))
          };
        })
      );

      // Get period name
      const academicYearName = academicYearOptions.find(p => p.id === selectedAcademicYear)?.name || "Current Academic Year";
      const termName = termOptions.find(t => t.id === selectedTermId)?.name || "";
      const periodName = `${academicYearName} - ${termName}`;

      // Generate Excel workbook
      const workbook = generateExcelWorkbook(examsWithStudents, periodName);

      // Create a descriptive filename
      const subjectCode = examsWithStudents[0]?.subject.code || "SUBJ";
      const className = examsWithStudents[0]?.class.name.replace(/\s+/g, "") || "Class";
      const filename = `${subjectCode}_${className}_${academicYearName.replace(/\s+/g, "")}`;

      // Trigger Excel download
      downloadExcel(filename, workbook);

      toast.dismiss();
      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Error exporting template:", error);
      toast.dismiss();
      toast.error("Failed to export template");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get exam type name by ID
  const getExamTypeNameById = (examTypeId: string): string => {
    // This should be replaced with actual exam type fetching logic
    // For now, return a default value based on exam type ID
    console.log({examTypeId})
    const typeMap: Record<string, string> = {
      "class_test_1": "Class Test 1",
      "class_test_2": "Class Test 2",
      "mid_term": "Mid-Term Exam",
      "end_of_term": "End of Term"
    };
    return typeMap[examTypeId] || "Exam";
  };

  // Handle file upload for scores
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the uploaded Excel file
  const processUploadedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedExamIds.size === 0) {
      return;
    }

    try {
      setUploading(true);
      toast.loading("Processing scores...");

      // Get detailed exam data for parsing
      const examsToProcess = availableExams.filter(exam => 
        selectedExamIds.has(exam.id)
      );

      // Prepare formatted exam data for the parser
      const formattedExams = await Promise.all(
        examsToProcess.map(async (exam) => {
          // Get or extract exam type name
          const examTypeName = exam.examType.name || getExamTypeNameById(exam.examType);
          
          // Ensure we have students for each exam
          let students = [];
          
          if (exam.examStudents && exam.examStudents.length > 0) {
            students = exam.examStudents.map(es => ({
              id: es.student?.id || es.studentId,
              name: es.student ? `${es.student.firstName} ${es.student.lastName}` : "Unknown",
              indexNumber: es.student?.studentId || ""
            }));
          } else {
            const studentsResponse = await fetch(`/api/exams/${exam.id}/students`);
            if (!studentsResponse.ok) {
              throw new Error(`Failed to fetch students for exam ${exam.name}`);
            }
            students = await studentsResponse.json();
          }

          return {
            id: exam.id,
            name: exam.name,
            subject: exam.subject,
            class: exam.class,
            examDate: exam.examDate,
            totalMarks: exam.totalMarks,
            examTypeName,
            students
          };
        })
      );

      // Process the Excel file
      const parsedScores = await processExcelFile(file, formattedExams);

      if (parsedScores.length === 0) {
        toast.dismiss();
        toast.error("No valid scores found in the uploaded file");
        return;
      }

      // Group scores by exam ID
      const scoresByExam: Record<string, any[]> = {};
      
      parsedScores.forEach(score => {
        if (!scoresByExam[score.examId]) {
          scoresByExam[score.examId] = [];
        }
        
        scoresByExam[score.examId].push({
          studentId: score.studentId,
          rawScore: score.score,
          remarks: score.remarks || ""
        });
      });

      // Update scores for each exam
      const updatePromises = Object.entries(scoresByExam).map(async ([examId, scores]) => {
        if (scores.length === 0) return 0;
        
        const response = await fetch(`/api/exams/${examId}/scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update scores for exam ${examId}`);
        }
        
        return scores.length;
      });

      const results = await Promise.all(updatePromises);
      const totalUpdated = results.reduce((sum, count) => sum + (count || 0), 0);

      toast.dismiss();
      toast.success(`Updated scores for ${totalUpdated} students across ${Object.keys(scoresByExam).length} exams`);
      
      // Notify parent that exams have been updated
      onExamsUpdated();
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing uploaded file:", error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Failed to process scores");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Exam Scores Template</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <label htmlFor="class-select" className="text-sm font-medium">Class</label>
            <select
              id="class-select"
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
              value={selectedClassId}
              onChange={handleClassChange}
              disabled={loading || uploading || optionsLoading}
              aria-label="Select class"
            >
              <option value="">
                {optionsLoading ? "Loading classes..." : "Select a class"}
              </option>
              {!optionsLoading && classOptions.length === 0 && (
                <option value="" disabled>No classes available</option>
              )}
              {classOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject-select" className="text-sm font-medium">Subject</label>
            <select
              id="subject-select"
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
              value={selectedSubjectId}
              onChange={handleSubjectChange}
              disabled={loading || uploading || optionsLoading}
              aria-label="Select subject"
            >
              <option value="">
                {optionsLoading ? "Loading subjects..." : "Select a subject"}
              </option>
              {!optionsLoading && subjectOptions.length === 0 && (
                <option value="" disabled>No subjects available</option>
              )}
              {subjectOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="academicYear-select" className="text-sm font-medium">Academic Year</label>
            <select
              id="academicYear-select"
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
              value={selectedAcademicYear}
              onChange={handleAcademicYearChange}
              disabled={loading || uploading || optionsLoading}
              aria-label="Select academic year"
            >
              <option value="">
                {optionsLoading ? "Loading academic years..." : "Select an academic year"}
              </option>
              {!optionsLoading && academicYearOptions.length === 0 && (
                <option value="" disabled>No academic years available</option>
              )}
              {academicYearOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="term-select" className="text-sm font-medium">Term</label>
            <select
              id="term-select"
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
              value={selectedTermId}
              onChange={handleTermChange}
              disabled={loading || uploading || optionsLoading}
              aria-label="Select term"
            >
              <option value="">
                {optionsLoading ? "Loading terms..." : "Select a term"}
              </option>
              {!optionsLoading && termOptions.length === 0 && (
                <option value="" disabled>No terms available</option>
              )}
              {termOptions.map(option => (  
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="staff-select" className="text-sm font-medium">Staff</label>
            <select
              id="staff-select"
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
              value={selectedStaffId}
              onChange={handleStaffChange}
              disabled={loading || uploading || optionsLoading}
              aria-label="Select staff"
            >
              <option value="">
                {optionsLoading ? "Loading staff..." : "Select a staff"}
              </option>
              {!optionsLoading && staffOptions.length === 0 && (
                <option value="" disabled>No staff available</option>
              )}
              {staffOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}   
            </select>
          </div>
          
          {optionsLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading options...</span>
            </div>
          )}
          
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          
          {!loading && availableExams.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Available Exams</h3>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                {availableExams.map(exam => (
                  <div key={exam.id} className="flex items-center py-1">
                    <Checkbox 
                      id={`exam-${exam.id}`}
                      checked={selectedExamIds.has(exam.id)}
                      onCheckedChange={(checked) => 
                        handleExamCheckboxChange(exam.id, !!checked)
                      }
                    />
                    <label htmlFor={`exam-${exam.id}`} className="ml-2 text-sm">
                      {exam.name} ({formatDateTime(exam.examDate)})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!loading && availableExams.length === 0 && 
           selectedClassId && selectedSubjectId && selectedAcademicYear && selectedTermId && selectedStaffId && (
            <div className="text-center py-2 text-sm text-muted-foreground">
              No exams found for the selected criteria
            </div>
          )}
          
          <div className="flex justify-between pt-2">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={processUploadedFile}
                aria-label="Upload exam scores Excel file"
              />
              <Button 
                variant="outline" 
                onClick={handleFileUpload}
                disabled={loading || availableExams.length === 0 || uploading || selectedExamIds.size === 0}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import Scores
              </Button>
            </div>
            <Button 
              onClick={handleExportTemplate}
              disabled={loading || availableExams.length === 0 || uploading || selectedExamIds.size === 0}
            >
              <Download className="mr-2 h-4 w-4" /> 
              Export Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}