// app/app/(dashboard)/exams/report/student/page.tsx

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";
import StudentReportViewPage from "@/components/dashboard/exams/student-report-page";

export default async function StudentReportPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    studentId: string;
    academicYearId: string;
    academicTermId: string;
  }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const { studentId, academicYearId, academicTermId } = await searchParams;

  if (!studentId || !academicYearId || !academicTermId) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <h2 className="text-xl font-semibold mb-2">Missing Required Parameters</h2>
          <p>Please provide studentId, academicYearId, and academicTermId to view a report.</p>
        </div>
      </div>
    );
  }

  return (
    <StudentReportViewPage
      studentId={studentId}
      academicYearId={academicYearId}
      academicTermId={academicTermId}
    />
  );
}
