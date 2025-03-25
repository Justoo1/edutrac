import { notFound } from "next/navigation";
import { getContentBySlug, getSchoolData } from "@/lib/fetchers";
import BlurImage from "@/components/blur-image";
import { placeholderBlurhash, toDateString } from "@/lib/utils";
import MDX from "@/components/mdx";
import Link from "next/link";
import { CalendarDays, User, ArrowLeft } from "lucide-react";
import db from "@/lib/db";
import { schoolContent } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { SanitizedContent } from "@/components/sanitized-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}) {
  const {domain, slug } = await params
  const decodedDomain = decodeURIComponent(domain);
  const decodedSlug = decodeURIComponent(slug);

  const data = await getContentBySlug(decodedDomain, decodedSlug);
  if (!data) {
    return null;
  }
  const { title, description } = data;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@edutrac",
    },
  };
}

export default async function SchoolContentPage({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}) {
  const {domain, slug } = await params
  const school = await getSchoolData(domain);
  
  if (!school) {
    notFound();
  }

  const content = await db.query.schoolContent.findFirst({
    where: and(
      eq(schoolContent.schoolId, school.id),
      eq(schoolContent.slug, slug),
      eq(schoolContent.contentType, "page")
    ),
  });

  if (!content) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
      <SanitizedContent content={content.content} />
    </div>
  );
}