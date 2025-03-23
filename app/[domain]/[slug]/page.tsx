import { notFound } from "next/navigation";
import { getContentBySlug, getSchoolData } from "@/lib/fetchers";
import BlurImage from "@/components/blur-image";
import { placeholderBlurhash, toDateString } from "@/lib/utils";
import MDX from "@/components/mdx";
import Link from "next/link";
import { CalendarDays, User, ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}) {
  const paramData = await params
  const domain = decodeURIComponent(paramData.domain);
  const slug = decodeURIComponent(paramData.slug);

  const data = await getContentBySlug(domain, slug);
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
  const paramData = await params
  const domain = decodeURIComponent(paramData.domain);
  const slug = decodeURIComponent(paramData.slug);
  const data = await getContentBySlug(domain, slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/${domain}`}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {data.school?.name || "Home"}
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden dark:bg-gray-800">
        {/* Hero section with image if available */}
        {data.image && (
          <div className="relative h-72 w-full sm:h-96">
            <BlurImage
              alt={data.title || "Content image"}
              blurDataURL={data.imageBlurhash || placeholderBlurhash}
              className="h-full w-full object-cover"
              height={600}
              width={1200}
              placeholder="blur"
              src={data.image}
              priority
            />
          </div>
        )}

        <div className="px-6 py-8 sm:px-10">
          {/* Content type badge */}
          <div className="mb-6 flex justify-between items-center">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              data.contentType === "announcement" 
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
                : data.contentType === "event"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}>
              {data.contentType.charAt(0).toUpperCase() + data.contentType.slice(1)}
            </span>
            
            {/* Publication date */}
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
              <CalendarDays className="mr-2 h-4 w-4" />
              {toDateString(data.publishDate || data.createdAt)}
            </div>
          </div>

          {/* Title and description */}
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {data.title}
          </h1>
          
          {data.description && (
            <p className="mb-8 text-xl text-gray-500 dark:text-gray-400">
              {data.description}
            </p>
          )}

          {/* Author info if available */}
          {data.author && (
            <div className="mb-8 flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                {data.author.image ? (
                  <BlurImage
                    alt={data.author.name || "Author"}
                    height={40}
                    width={40}
                    className="h-full w-full rounded-full object-cover"
                    src={data.author.image}
                  />
                ) : (
                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.author.name || "Staff Member"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Published by school staff
                </p>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="prose max-w-none dark:prose-invert">
            {data.mdxSource ? (
              <MDX source={data.mdxSource} />
            ) : (
              <div 
                dangerouslySetInnerHTML={{ __html: data.content || '<p>No content available.</p>' }} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Related content if available */}
      {data.relatedContent && data.relatedContent.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Related {data.contentType === "announcement" ? "Announcements" : data.contentType === "event" ? "Events" : "Content"}
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.relatedContent.map((item) => (
              <Link key={item.id} href={`/${domain}/${item.slug}`}>
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {toDateString(item.publishDate || item.createdAt)}
                  </p>
                  {item.description && (
                    <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}