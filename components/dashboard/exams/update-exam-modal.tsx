// components/dashboard/exams/batch-update-scores-modal.tsx

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { processExcelFile } from "@/lib/excel-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BatchUpdateScoresModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  schoolId: string;
}

export default function BatchUpdateScoresModal({
  open,
  onOpenChange,
  onSuccess,
  schoolId
}: BatchUpdateScoresModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processedScores, setProcessedScores] = useState<any[]>([]);
  const [examSummary, setExamSummary] = useState<{
    totalExams: number;
    totalScores: number;
    exams: { examId: string; examName: string; studentCount: number }[];
  }>({ totalExams: 0, totalScores: 0, exams: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  
  // Reset state when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFile(null);
      setProgress(0);
      setError(null);
      setIsProcessing(false);
      setProcessedScores([]);
      setExamSummary({ totalExams: 0, totalScores: 0, exams: [] });
      setActiveTab("upload");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    onOpenChange(newOpen);
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      setError("Please select an Excel file (.xlsx or .xls)");
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };
  
  // Trigger file input click
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Clear selected file
  const handleClearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Process the file to validate and extract exam scores
  const handleProcessFile = async () => {
    if (!file || !schoolId) return;
    
    try {
      setIsProcessing(true);
      setProgress(10);
      toast.loading("Processing exam scores file...");
      
      // Fetch active exams for this school
      const examsResponse = await fetch(`/api/exams?schoolId=${schoolId}&includeStudents=true`);
      
      if (!examsResponse.ok) {
        throw new Error("Failed to fetch exams data");
      }
      
      const examData = await examsResponse.json();
      
      if (!examData || examData.length === 0) {
        throw new Error("No active exams found for this school");
      }
      
      setProgress(30);
      
      // Format exams for processing
      const formattedExams = examData.map((exam: any) => ({
        id: exam.id,
        name: exam.name,
        subject: exam.subject || { name: 'Unknown', code: '' },
        class: exam.class || { name: 'Unknown' },
        examDate: exam.examDate || new Date().toISOString(),
        totalMarks: exam.totalMarks || 100,
        examTypeName: exam.examType || 'Unknown',
        students: exam.students || exam.examStudents?.map((es: any) => ({
          id: es.student?.id || es.studentId,
          name: es.student ? `${es.student.firstName} ${es.student.lastName}` : "Unknown",
          indexNumber: es.student?.studentId || ""
        })) || []
      }));
      console.log({formattedExams})
      
      setProgress(50);
      
      // Process the Excel file using your existing utility
      const scores = await processExcelFile(file, formattedExams);
      console.log({scores})
      
      if (!scores || scores.length === 0) {
        throw new Error("No valid scores found in the uploaded file");
      }
      
      setProgress(70);
      
      // Group scores by exam
      const scoresByExam = scores.reduce((grouped, score) => {
        if (!grouped[score.examId]) {
          const exam = formattedExams.find(e => e.id === score.examId);
          grouped[score.examId] = {
            examId: score.examId,
            examName: exam?.name || 'Unknown Exam',
            scores: []
          };
        }
        
        grouped[score.examId].scores.push({
          studentId: score.studentId,
          rawScore: score.score,
          remarks: score.remarks || ""
        });
        
        return grouped;
      }, {} as Record<string, { examId: string; examName: string; scores: any[] }>);
      
      // Convert to array
      const processedData = Object.values(scoresByExam);
      
      // Create summary for display
      const summary = {
        totalExams: processedData.length,
        totalScores: processedData.reduce((total, exam) => total + exam.scores.length, 0),
        exams: processedData.map(exam => ({
          examId: exam.examId,
          examName: exam.examName,
          studentCount: exam.scores.length
        }))
      };
      
      setProcessedScores(processedData);
      setExamSummary(summary);
      setProgress(100);
      
      toast.dismiss();
      toast.success(`Processed scores for ${summary.totalScores} students across ${summary.totalExams} exams`);
      
      // Switch to review tab
      setActiveTab("review");
      
    } catch (error) {
      console.error("Error processing file:", error);
      setError(error instanceof Error ? error.message : "Failed to process exam scores");
      toast.dismiss();
      toast.error("Failed to process exam scores");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Save processed scores to the database
  const handleSaveScores = async () => {
    if (processedScores.length === 0) return;
    
    try {
      setIsProcessing(true);
      setProgress(10);
      toast.loading("Saving exam scores...");
      
      // Send all processed scores to API
      setProgress(40);
      const updateResponse = await fetch("/api/exams/update-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examScores: processedScores })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || "Failed to save exam scores");
      }
      
      const result = await updateResponse.json();
      setProgress(100);
      
      toast.dismiss();
      toast.success(`Updated scores for ${result.updatedCount} students across ${result.examCount} exams`);
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after delay
      setTimeout(() => {
        handleOpenChange(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error saving scores:", error);
      setError(error instanceof Error ? error.message : "Failed to save exam scores");
      toast.dismiss();
      toast.error("Failed to save exam scores");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Download template for exam scores
  const handleDownloadTemplate = async () => {
    try {
      toast.loading("Preparing template...");
      
      // Fetch active exams for template
      const response = await fetch(`/api/exams/template-data?schoolId=${schoolId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch template data");
      }
      
      const templateData = await response.json();
      
      if (!templateData.exams || templateData.exams.length === 0) {
        toast.dismiss();
        toast.error("No active exams found for template");
        return;
      }
      
      // Use your existing utility to generate the template
      // This assumes you've exported the function from excel-utils.ts
      const { generateExcelWorkbook, downloadExcel } = await import('@/lib/excel-utils');
      
      // Generate and download the template
      const workbook = generateExcelWorkbook(
        templateData.exams,
        templateData.periodName || 'Current Period'
      );
      
      downloadExcel('exam_scores_template', workbook);
      
      toast.dismiss();
      toast.success("Template downloaded successfully");
      
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.dismiss();
      toast.error("Failed to download template");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Batch Update Exam Scores</DialogTitle>
          <DialogDescription>
            Upload an Excel file with student scores for multiple exams
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="review" disabled={processedScores.length === 0}>
              Review & Save
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Upload Excel file with scores"
            />
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadTemplate}
                className="mb-2"
              >
                Download Template
              </Button>
            </div>
            
            {!file ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors"
                onClick={handleSelectFile}
              >
                <div className="mx-auto flex flex-col items-center justify-center gap-1">
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
                  <div className="text-sm font-medium">
                    Click to select an Excel file
                  </div>
                  <div className="text-xs text-muted-foreground">
                    or drag and drop here
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClearFile}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
            
            <div className="text-xs text-muted-foreground mt-4">
              <p>Please ensure your file follows the correct format:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Use the template to ensure correct data structure</li>
                <li>Do not modify hidden exam ID columns</li>
                <li>Enter scores in the designated cells only</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="review" className="space-y-4 py-4">
            {examSummary.totalExams > 0 ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Processed Exam Scores</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Exams:</span>
                      <span className="font-medium">{examSummary.totalExams}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Student Records:</span>
                      <span className="font-medium">{examSummary.totalScores}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Exam</th>
                          <th className="text-right py-2">Student Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examSummary.exams.map((exam, index) => (
                          <tr key={index} className="border-b border-dashed">
                            <td className="py-2">{exam.examName}</td>
                            <td className="text-right py-2">{exam.studentCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Saving...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available. Please upload and process a file first.
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-end">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            
            {activeTab === "upload" ? (
              <Button 
                onClick={handleProcessFile}
                disabled={!file || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process File
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleSaveScores}
                disabled={processedScores.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Save Scores
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}