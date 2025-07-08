import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WebsiteBuilderEditor } from "@/components/dashboard/website/website-builder-editor";
import db from "@/lib/db";
import { eq } from "drizzle-orm";
import { schools } from "@/lib/schema";

interface BuilderPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BuilderPage({ searchParams }: BuilderPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get school information
  const school = await db.query.schools.findFirst({
    where: eq(schools.adminId, session.user.id),
  });

  if (!school) {
    redirect("/onboarding");
  }

  const {page:pageId} = await searchParams;

  return (
    <div className="h-screen overflow-hidden">
      <WebsiteBuilderEditor 
        schoolId={school.id} 
        pageId={pageId}
        userId={session.user.id}
      />
    </div>
  );
}
