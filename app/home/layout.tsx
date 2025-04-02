import "@/styles/globals.css";
// import { cal, inter } from "@/styles/fonts";
// import { Analytics } from "@vercel/analytics/react";
// import { Providers } from "./providers";
import { Metadata } from "next";
// import { cn } from "@/lib/utils";
import HomeFooter from "@/components/home/HomeFooter";
import HomeHeader from "@/components/home/HomeHeader";

const title =
  "Platforms Starter Kit – The all-in-one starter kit for building multi-tenant applications.";
const description =
  "The Platforms Starter Kit is a full-stack Next.js app with multi-tenancy and custom domain support. Built with Next.js App Router, Vercel Postgres and the Vercel Domains API.";
const image = "https://vercel.pub/thumbnail.png";

export const metadata: Metadata = {
  title,
  description,
  icons: ["https://vercel.pub/favicon.ico"],
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
    creator: "@vercel",
  },
  metadataBase: new URL("https://vercel.pub"),
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col h-full bg-gradient-to-tr from-blue-950 to-blue-900">
          <HomeHeader />
          {children}
          <HomeFooter />
      </div>
  );
}
