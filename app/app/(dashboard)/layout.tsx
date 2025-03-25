import { ReactNode, Suspense } from "react";
import Profile from "@/components/profile";
import Nav from "@/components/nav";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/nav";
import DashboardHeader from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-blue-950">
      <div className="w-full flex-none md:w-64">
        <DashboardNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-8">
        <DashboardHeader />
        <div className="py-6">{children}</div>
      </div>
    </div>
  );
}