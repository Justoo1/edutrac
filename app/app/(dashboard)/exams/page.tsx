import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExamClientPage from "@/components/dashboard/exams/exam-client-page";

export default async function ExamsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!session?.user.schoolId) {
    redirect("/login");
  }

  return <ExamClientPage schoolId={session.user.schoolId} />;
}