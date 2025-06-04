// components/dashboard/exams/student-report-page.tsx
"use client";

import React from 'react';
import { ReportViewer } from './report-viewer';
import { useRouter } from 'next/navigation';

interface StudentReportViewPageProps {
  studentId: string;
  academicYearId: string;
  academicTermId: string;
}

export default function StudentReportViewPage({
  studentId,
  academicYearId,
  academicTermId
}: StudentReportViewPageProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-4 h-[calc(100vh-80px)]">
      <ReportViewer
        studentId={studentId}
        academicYearId={academicYearId}
        academicTermId={academicTermId}
        onClose={handleClose}
      />
    </div>
  );
}
