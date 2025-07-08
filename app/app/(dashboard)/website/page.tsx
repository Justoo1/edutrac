import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebsiteBuilder } from "@/components/dashboard/website/website-builder";
import { WebsitePages } from "@/components/dashboard/website/website-pages";
import { WebsiteThemes } from "@/components/dashboard/website/website-themes";
import { WebsiteSettings } from "@/components/dashboard/website/website-settings";
import { WebsiteMedia } from "@/components/dashboard/website/website-media";
import { WebsiteForms } from "@/components/dashboard/website/website-forms";
import { WebsiteAnalytics } from "@/components/dashboard/website/website-analytics";
import { WebsiteConfigSetup } from "@/components/dashboard/website/website-config-setup";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, Settings, Palette, FileText, Image, BarChart3, FormInput } from "lucide-react";
import Link from "next/link";
import db from "@/lib/db";
import { eq } from "drizzle-orm";
import { schools, websiteConfigs } from "@/lib/schema";

export default async function WebsitePage() {
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

  // Get website configuration
  const websiteConfig = await db.query.websiteConfigs.findFirst({
    where: eq(websiteConfigs.schoolId, school.id),
    with: {
      theme: true,
    },
  });

  console.log({websiteConfig})
  if (!websiteConfig) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Website Setup</h1>
            <p className="text-muted-foreground">
              Set up your school website configuration to get started
            </p>
          </div>
        </div>
        
        <WebsiteConfigSetup 
          schoolId={school.id} 
          school={school}
        />
      </div>
    );
  }

  // Website URL for preview
  const websiteUrl = school.customDomain 
    ? `https://${school.customDomain}` 
    : `https://${school.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website Builder</h1>
          <p className="text-muted-foreground">
            Design and manage your school&apos;s website with our intuitive builder
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={websiteUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Preview Site
            </Link>
          </Button>
          <Button asChild>
            <Link href="/website/builder">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Builder
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Site Status</p>
              <p className="text-2xl font-bold">
                {websiteConfig?.isPublished ? "Live" : "Draft"}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              websiteConfig?.isPublished ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
            }`}>
              <Eye className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pages</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-blue-100 text-blue-600 h-12 w-12 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Theme</p>
              <p className="text-2xl font-bold">{websiteConfig?.theme?.name || "Default"}</p>
            </div>
            <div className="bg-purple-100 text-purple-600 h-12 w-12 rounded-full flex items-center justify-center">
              <Palette className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-2xl font-bold">
                {websiteConfig?.updatedAt 
                  ? new Date(websiteConfig.updatedAt).toLocaleDateString()
                  : "Never"
                }
              </p>
            </div>
            <div className="bg-orange-100 text-orange-600 h-12 w-12 rounded-full flex items-center justify-center">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-2">
            <FormInput className="h-4 w-4" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
          <WebsitePages schoolId={school.id} />
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          <WebsiteThemes schoolId={school.id} currentConfig={websiteConfig as any} />
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <WebsiteMedia schoolId={school.id} />
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <WebsiteForms schoolId={school.id} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <WebsiteSettings schoolId={school.id} school={school} config={websiteConfig} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <WebsiteAnalytics schoolId={school.id} websiteUrl={websiteUrl} />
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <WebsiteBuilder schoolId={school.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
