import { notFound } from "next/navigation";
import db from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { schools, websitePages, websiteConfigs, websiteBlocks } from "@/lib/schema";
import { SchoolWebsiteRenderer } from "@/components/school-website/renderer";

interface SchoolPageProps {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface SEOSettings {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  googleAnalytics?: string;
  facebookPixel?: string;
}

async function getSchoolByDomain(domain: string) {
  // First try to find by subdomain
  let school = await db.query.schools.findFirst({
    where: eq(schools.subdomain, domain),
    with: {
      websiteConfig: {
        with: {
          theme: true,
        },
      },
    },
  });

  // If not found by subdomain, try custom domain
  if (!school) {
    school = await db.query.schools.findFirst({
      where: eq(schools.customDomain, domain),
      with: {
        websiteConfig: {
          with: {
            theme: true,
          },
        },
      },
    });
  }

  return school;
}

// async function getSchoolPages(schoolId: string) {
//   return await db.query.websitePages.findMany({
//     where: and(
//       eq(websitePages.schoolId, schoolId),
//       eq(websitePages.isPublished, true)
//     ),
//     with: {
//       blocks: {
//         where: eq(websiteBlocks.isVisible, true),
//         orderBy: (blocks, { asc }) => [asc(blocks.sortOrder)],
//       },
//     },
//     orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
//   });
// }

async function getSchoolPages(schoolId: string) {
  const pages = await db.query.websitePages.findMany({
    where: and(
      eq(websitePages.schoolId, schoolId),
      eq(websitePages.isPublished, true)
    ),
    with: {
      blocks: {
        where: eq(websiteBlocks.isVisible, true),
        orderBy: (blocks, { asc }) => [asc(blocks.sortOrder)],
      },
    },
    orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
  });

  // Transform blockType to type in blocks
  return pages.map(page => ({
    ...page,
    blocks: page.blocks.map(({ blockType, ...block }) => ({
      ...block,
      type: blockType,
    })),
  }));
}

export default async function SchoolPage({ params, searchParams }: SchoolPageProps) {
  const { domain } = await params;
  
  // Get school information
  const school = await getSchoolByDomain(domain);
  
  if (!school) {
    notFound();
  }

  // Check if website is published
  if (!school.websiteConfig?.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Website Coming Soon
          </h1>
          <p className="text-gray-600">
            {school.name}&apos;s website is currently under construction.
          </p>
        </div>
      </div>
    );
  }

  // Check for maintenance mode
  if (school.websiteConfig?.isMaintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Website Under Maintenance
          </h1>
          <p className="text-gray-600">
            {school.websiteConfig.maintenanceMessage || 
             "We&apos;re currently performing maintenance on our website. Please check back later."}
          </p>
        </div>
      </div>
    );
  }

  // Get the page to display
  const { page } = await searchParams
  const slug = page as string || "/";
  console.log({slug})
  const pages = await getSchoolPages(school.id);
  console.log({pages})
  
  let currentPage = pages.find(page => page.slug === slug);
  
  // If no specific page found, try to get home page
  if (!currentPage) {
    currentPage = pages.find(page => page.isHomePage) || pages[0];
  }
  console.log({currentPage})

  if (!currentPage && pages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to {school.name}
          </h1>
          <p className="text-gray-600">
            Website content is being prepared.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SchoolWebsiteRenderer 
      school={school}
      pages={pages}
      currentPage={currentPage}
      config={school.websiteConfig}
    />
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SchoolPageProps) {
  const { domain } = await params;
  const school = await getSchoolByDomain(domain);

  if (!school) {
    return {
      title: "School Not Found",
    };
  }

  const config = school.websiteConfig;
  const siteName = config?.siteName || school.name;
  const tagline = config?.tagline;

  return {
    title: (config?.seoSettings as SEOSettings)?.metaTitle || `${siteName}${tagline ? ` - ${tagline}` : ""}`,
    description: (config?.seoSettings as SEOSettings)?.metaDescription || school.description,
    keywords: (config?.seoSettings as SEOSettings)?.keywords,
    openGraph: {
      title: siteName,
      description: school.description,
      images: school.logo ? [school.logo] : [],
    },
    icons: {
      icon: config?.favicon || "/favicon.ico",
    },
  };
}
