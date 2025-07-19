// app/app/(dashboard)/exams/report/comments/page.tsx

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportCommentsPage from "@/components/dashboard/exams/report-comments-page";

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    classId?: string;
    academicYearId?: string;
    academicTermId?: string;
  }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  // Await the searchParams Promise
  const { classId, academicYearId, academicTermId } = await searchParams;

  return (
    <ReportCommentsPage 
      schoolId={session.user.schoolId}
      classId={classId}
      academicYearId={academicYearId}
      academicTermId={academicTermId}
    />
  );
}