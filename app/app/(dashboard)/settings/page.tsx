import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { schools } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AcademicYearSetup } from "./components/academic-year-setup";
import { TermSetup } from "./components/term-setup";
import { BatchSetup } from "./components/batch-setup";
import { SchoolInfoSetup } from "./components/school-info-setup";

const SettingsPage = async () => {
  // Check if user is authenticated
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Check if user is an admin
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Check if user has a school
  const school = await db.query.schools.findFirst({
    where: eq(schools.adminId, session.user.id),
  });

  // If no school exists, redirect to create one
  if (!school) {
    redirect("/onboarding");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">School Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure your school&apos;s information and academic settings
        </p>
      </div>

      <Tabs defaultValue="school-info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="school-info">School Info</TabsTrigger>
          <TabsTrigger value="academic-year">Academic Year</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="school-info">
          <SchoolInfoSetup schoolId={school.id} />
        </TabsContent>
        
        <TabsContent value="academic-year">
          <AcademicYearSetup schoolId={school.id} />
        </TabsContent>
        
        <TabsContent value="terms">
          <TermSetup schoolId={school.id} />
        </TabsContent>
        
        <TabsContent value="batches">
          <BatchSetup schoolId={school.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;