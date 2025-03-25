import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { CreateSchoolModal } from "@/components/modal/create-school-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School } from "lucide-react";

export default async function SchoolsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const schools = await db.query.schools.findMany({
    where: (schools, { eq }) => eq(schools.adminId, session.user.id),
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Schools</h1>
          <p className="text-muted-foreground">
            Manage your schools and their settings
          </p>
        </div>
        <CreateSchoolModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <Card key={school.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-md">
                <School className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{school.name}</CardTitle>
                <CardDescription>
                  {school.subdomain}.edutrac.com
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Type: {school.schoolType}</p>
                <p>Plan: {school.plan}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {schools.length === 0 && (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium mb-2">No schools yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first school
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 