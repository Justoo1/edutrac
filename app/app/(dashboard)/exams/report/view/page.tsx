// app/app/(dashboard)/exams/report/view/page.tsx

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportViewerPage from "@/components/dashboard/exams/report-view-page"; 

export default async function ViewReportsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  return <ReportViewerPage schoolId={session.user.schoolId} />;
}
