import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getSchoolData } from "@/lib/fetchers";
import { fontMapper } from "@/styles/fonts";
import { Metadata } from "next";
import SchoolHeader from "@/components/school/header";
import SchoolFooter from "@/components/school/footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata | null> {
  const paramData = await params
  const domain = decodeURIComponent(paramData.domain);
  const data = await getSchoolData(domain);
  if (!data) {
    return null;
  }
  const {
    name: title,
    description,
    image,
    logo,
  } = data as {
    name: string;
    description: string;
    image: string;
    logo: string;
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@edutrac",
    },
    icons: [logo],
    metadataBase: new URL(`https://${domain}`),
  };
}

export default async function SchoolLayout({
  params,
  children,
}: {
  params: Promise<{ domain: string }>;
  children: ReactNode;
}) {
  const paramData = await params
  const domain = decodeURIComponent(paramData.domain);
  const data = await getSchoolData(domain);

  if (!data) {
    notFound();
  }

  // Optional: Redirect to custom domain if it exists
  if (
    domain.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) &&
    data.customDomain &&
    process.env.REDIRECT_TO_CUSTOM_DOMAIN_IF_EXISTS === "true"
  ) {
    return redirect(`https://${data.customDomain}`);
  }

  return (
    <div className={fontMapper[data.font || "font-cal"]}>
      {/* School Header */}
      <SchoolHeader school={data} domain={domain} />
      
      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>
      
      {/* School Footer */}
      <SchoolFooter school={data} domain={domain} />
    </div>
  );
}