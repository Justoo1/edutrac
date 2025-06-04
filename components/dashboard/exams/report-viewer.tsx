// components/dashboard/exams/report-viewer.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { 
  BasicSchoolReportCard, 
  SHSReportCard,
  CompleteReportData,
  ReportContext
} from './report-templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Printer, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface ReportViewerProps {
  studentId: string;
  academicYearId: string;
  academicTermId: string;
  onClose?: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  studentId,
  academicYearId,
  academicTermId,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<CompleteReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportContext, setReportContext] = useState<ReportContext>({
    schoolType: 'basic',
    reportView: 'preview',
    showComments: true,
    showAttendance: true,
    showBehavior: true
  });

  useEffect(() => {
    // Fetch the report data
    const fetchReportData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/reports/student?studentId=${studentId}&academicYearId=${academicYearId}&academicTermId=${academicTermId}`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch report data');
        }
        
        const data = await response.json();
        setReportData(data);
        
        // Determine school type from class name
        const schoolType = determineSchoolType(data.studentInfo.className || '');
        setReportContext(prev => ({
          ...prev,
          schoolType
        }));
        
      } catch (error) {
        console.error('Error fetching report data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        toast.error('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReportData();
  }, [studentId, academicYearId, academicTermId]);

  // Determine the school type from the class name
  const determineSchoolType = (className: string): 'basic' | 'high' => {
    const lowerClassName = className.toLowerCase();
    
    // SHS or Senior High School patterns
    if (
      lowerClassName.includes('shs') || 
      lowerClassName.includes('senior high') ||
      lowerClassName.includes('form') ||
      /\b(shs|senior)\s*[1-3]\b/.test(lowerClassName)
    ) {
      return 'high';
    }
    
    // Default to basic school
    return 'basic';
  };

  // Handle printing the report
  const handlePrint = () => {
    setReportContext(prev => ({
      ...prev,
      reportView: 'print'
    }));
    
    // Use browser's print functionality
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Handle downloading the report
  const handleDownload = async () => {
    try {
      const response = await fetch(
        `/api/reports/student/download?studentId=${studentId}&academicYearId=${academicYearId}&academicTermId=${academicTermId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      // Create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportData?.studentInfo.firstName}_${reportData?.studentInfo.lastName}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full h-full min-h-[600px] flex items-center justify-center">
        <CardContent className="flex flex-col items-center p-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg">Loading report data...</p>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error || !reportData) {
    return (
      <Card className="w-full h-full min-h-[600px] flex items-center justify-center">
        <CardContent className="flex flex-col items-center p-6">
          <div className="text-destructive text-xl mb-4">
            {error || 'Failed to load report data'}
          </div>
          <Button onClick={onClose}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 bg-white p-4 sticky top-0 z-10 shadow-sm">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="text-lg font-medium">
          Student Report: {reportData.studentInfo.firstName} {reportData.studentInfo.lastName}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-100 p-4">
        <div className="bg-white shadow-md mx-auto max-w-5xl h-[calc(100vh-160px)]">
          <PDFViewer width="100%" height="100%" className="border">
            {reportContext.schoolType === 'high' ? (
              <SHSReportCard 
                schoolInfo={reportData.schoolInfo}
                studentInfo={reportData.studentInfo}
                academicInfo={reportData.academicInfo}
                subjects={reportData.subjects}
                attendance={reportData.attendance}
                totalAverage={reportData.totalAverage}
                showLogo={true}
              />
            ) : (
              <BasicSchoolReportCard 
                schoolInfo={reportData.schoolInfo}
                studentInfo={reportData.studentInfo}
                academicInfo={reportData.academicInfo}
                subjects={reportData.subjects}
                attendance={reportData.attendance}
                totalAverage={reportData.totalAverage}
                showLogo={true}
              />
            )}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};
