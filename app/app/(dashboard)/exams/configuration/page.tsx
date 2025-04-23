import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Import configuration section components
import ExamPeriodsSection from "@/components/dashboard/exams/exam-periods-section";
import ExamTypesSection from "@/components/dashboard/exams/exam-types-section";
import AssessmentTypesSection from "@/components/dashboard/exams/assessment-types-section";
import ExamConfigurationSection from "@/components/dashboard/exams/exam-configuration-section";
import GradeSettingsSection from "@/components/dashboard/exams/grade-settings-section";
import GeneralSettingsSection from "@/components/dashboard/exams/general-settings-section";

export default async function ExamsConfigurationPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get the active school for the current user
  const school = await db.query.schools.findFirst({
    where: (schools, { eq }) => eq(schools.adminId, session.user.id),
  });

  if (!school) {
    // Redirect to school setup or a relevant page if no school is found
    redirect("/schools"); 
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/exams">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Exam Configuration</h1>
          <p className="text-muted-foreground">
            Configure exam periods, assessment types, grading, and general settings.
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="periods">Exam Periods</TabsTrigger>
          <TabsTrigger value="types">Exam Types</TabsTrigger>
          {/* <TabsTrigger value="assessments">Assessment Types</TabsTrigger> */}
          <TabsTrigger value="weights">Weight Configuration</TabsTrigger>
          <TabsTrigger value="grading">Grade Settings</TabsTrigger>
          <TabsTrigger value="general">General Settings</TabsTrigger>
        </TabsList>

        {/* Add TabsContent for each section */}
        <TabsContent value="periods">
            <ExamPeriodsSection schoolId={school.id} />
        </TabsContent>
        
        <TabsContent value="types">
           <ExamTypesSection schoolId={school.id} />
        </TabsContent>
        
        <TabsContent value="assessments">
           <AssessmentTypesSection schoolId={school.id} />
        </TabsContent>

        <TabsContent value="weights">
          <ExamConfigurationSection schoolId={school.id} />
        </TabsContent>

        <TabsContent value="grading">
          <GradeSettingsSection schoolId={school.id} />
        </TabsContent>

        <TabsContent value="general">
          <GeneralSettingsSection schoolId={school.id} />
        </TabsContent>

      </Tabs>
    </div>
  );
}