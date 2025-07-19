import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import db from "@/lib/db";
import { CreateSchoolContentButton } from "@/components/create-school-content-button";
import { SchoolContent } from "@/components/school-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { Suspense } from "react";
import Sites from "@/components/sites";
import PlaceholderCard from "@/components/placeholder-card";
import CreateSiteButton from "@/components/create-site-button";
import CreateSiteModal from "@/components/modal/create-site";
import { getSchoolPlanAndSiteCount } from "@/lib/actions";

interface PlanLimits {
  free: number;
  basic: number;
  premium: number;
  custom: number;
}

export default async function SchoolContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params
  const schoolId = decodeURIComponent(id);
  const data = await db.query.schools.findFirst({
    where: (schools, { eq }) => eq(schools.id, schoolId)
  });

  if (!data || data.adminId !== session.user.id) {
    notFound();
  }

  const publicUrl = `${data.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;

  const planInfo = await getSchoolPlanAndSiteCount(schoolId);
  
  if (!planInfo) {
    notFound();
  }

  const planLimits: PlanLimits = {
    free: 0,
    basic: 1,
    premium: 3,
    custom: Infinity
  };

  const canCreateSite = planInfo.siteCount < planLimits[planInfo.plan as keyof PlanLimits];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
        <div className="flex flex-col items-center space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-yellow-500 hover:bg-yellow-500 hover:text-blue-900">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="w-60 truncate font-cal text-xl font-bold sm:w-auto sm:text-3xl text-yellow-500 dark:text-white">
              {data.name}
            </h1>
          </div>
          <a
            href={
              process.env.NEXT_PUBLIC_VERCEL_ENV
                ? `https://${publicUrl}`
                : `http://${data.subdomain}.localhost:3000`
            }
            target="_blank"
            rel="noreferrer"
            className="truncate rounded-md bg-stone-100 px-2 py-1 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
          >
            {publicUrl} ↗
          </a>
        </div>
        <div className="flex items-center space-x-4">
          <Link href={`/school/${schoolId}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          {/* <CreateSchoolContentButton schoolId={schoolId} /> */}
          <Link href={`/school/${schoolId}/create`} type="button" className="hover:text-yellow-600 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded">Create Content</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{0}</p>
            <p className="text-sm text-muted-foreground">Total enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{0}</p>
            <p className="text-sm text-muted-foreground">Total staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{0}</p>
            <p className="text-sm text-muted-foreground">Active classes</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-yellow-500">School Content</h2>
          <Badge variant="outline" className="text-yellow-500">Announcements & Pages</Badge>
        </div>
        <SchoolContent schoolId={schoolId} />
      </div>

      {/* <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cal text-3xl font-bold dark:text-white">
            School Content
          </h1>
          {canCreateSite ? (
            <CreateSiteButton>
              <CreateSiteModal />
            </CreateSiteButton>
          ) : (
            <div className="text-sm text-red-500">
              {planInfo.plan === 'free' ? (
                <p>Please upgrade your plan to create content</p>
              ) : (
                <p>You have reached the maximum number of content items for your {planInfo.plan} plan</p>
              )}
            </div>
          )}
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PlaceholderCard key={i} />
              ))}
            </div>
          }
        >
          <Sites siteId={schoolId} />
        </Suspense>
      </div> */}
    </div>
  );
} 