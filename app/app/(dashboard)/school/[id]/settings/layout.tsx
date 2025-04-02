import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import db from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function SchoolSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const paramData = await params
  const data = await db.query.schools.findFirst({
    where: (schools, { eq }) => eq(schools.id, decodeURIComponent(paramData.id)),
  });

  if (!data || data.adminId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Link href={`/school/${paramData.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{data.name}</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance" asChild>
            <Link href={`/school/${paramData.id}/settings/appearance`}>Appearance</Link>
          </TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          {children}
        </TabsContent>
        <TabsContent value="appearance" className="space-y-4">
          <p>Appearance settings coming soon...</p>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <p>Analytics coming soon...</p>
        </TabsContent>
      </Tabs>
    </div>
  );
} 