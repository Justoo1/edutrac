// app/app/(dashboard)/exams/report/comments/page.tsx

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportCommentsPage from "@/components/dashboard/exams/report-comments-page";

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: { 
    classId?: string;
    academicYearId?: string;
    academicTermId?: string;
  };
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ReportCommentsPage 
      schoolId={session.user.schoolId}
      classId={searchParams.classId}
      academicYearId={searchParams.academicYearId}
      academicTermId={searchParams.academicTermId}
    />
  );
}
