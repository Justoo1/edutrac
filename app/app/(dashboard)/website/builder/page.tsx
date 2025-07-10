import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WebsiteBuilderEditor } from "@/components/dashboard/website/website-builder-editor";
import db from "@/lib/db";
import { eq } from "drizzle-orm";
import { schools } from "@/lib/schema";

interface BuilderPageProps {
  searchParams: Promise<{ page?: string; new?: string }>;
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

  const {page:pageId, new:isNew} = await searchParams;

  // If new=true, set pageId to 'new'
  const finalPageId = isNew === 'true' ? 'new' : pageId;

  return (
    <div className="h-screen overflow-hidden">
      <WebsiteBuilderEditor 
        schoolId={school.id} 
        pageId={finalPageId}
        userId={session.user.id}
      />
    </div>
  );
}
