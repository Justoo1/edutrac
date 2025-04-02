import { notFound, redirect } from 'next/navigation';
import { getSession } from "@/lib/auth";
import PageEditorContainer from '@/components/editors/PageEditorContainer';
import DashboardHeader from '@/components/dashboard/header';
import db from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { Session } from "next-auth";

// Extend Session user type
// interface ExtendedSession extends Session {
//   user: {
//     id?: string;
//     name?: string | null;
//     email?: string | null;
//     image?: string | null;
//   };
// }

// Define page params interface
interface PageParams {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    type?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function CreateContentPage({ params, searchParams }: PageParams) {
  const { id } = await params;
  const { type } = await searchParams;
  const contentType = type || 'page';
  const isHero = contentType === 'hero';
  
  // Check user session and permissions
  const session = await getSession();
  if (!session) {
    return redirect(`/login?next=/school/${id}/create?type=${contentType}`);
  }
  
  console.log({session});
  // Fetch the school and check if user has permission
  const school = await db.query.schools.findFirst({
      where: eq(schema.schools.id, id),
    });
    
  console.log({school});
  // Get the admin relationship separately if needed
  const schoolAdmin = await db.query.users.findFirst({
    where: eq(schema.users.id, school?.adminId || '')
  });

  console.log({schoolAdmin});
  
  const userHasPermission = 
    session.user.id === school?.adminId;
  
  if (!userHasPermission) {
    return redirect('/dashboard');
  }
  
  // Check if there's already a hero page for this school
  if (isHero) {
    const existingHero = await db.query.schoolContent.findFirst({
      where: eq(schema.schoolContent.schoolId, id),
      with: {
        school: true,
      },
    });
    
    // If a hero page already exists, redirect to edit it
    if (existingHero) {
      return redirect(`/school/${id}/content/${existingHero.id}/edit`);
    }
  }
  
  const title = isHero ? 'Create Hero Section' : 'Create New Page';
  
  return (
    <div>
      {/* <DashboardHeader title={title} /> */}
      <div className="mt-6">
        <PageEditorContainer 
          schoolId={id} 
          initialContent={null} 
          contentId={null}
          contentType={contentType} 
          isHero={isHero} 
        />
      </div>
    </div>
  );
}