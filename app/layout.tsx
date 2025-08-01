import "@/styles/globals.css";
import { cal, inter } from "@/styles/fonts";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "./providers";
import type Metadata from "next";
import { cn } from "@/lib/utils";
import { OfflineNotification, OfflineStatusIndicator } from "@/components/offline";
import '@/lib/offline/init';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn([cal.variable, inter.variable, "bg-gradient-to-tr from-blue-950 to-blue-900"])}>
        <Providers>
          {children}

          <OfflineStatusIndicator className="fixed top-4 right-4 z-50" showDetails />
          <OfflineNotification />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
