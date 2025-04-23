import { MainLayout } from "@/components/dashboard/layout/main-layout";
// import { Sidebar } from "@/components/dashboard/Sidebar";
// import { TopBar } from "@/components/dashboard/top-bar";
import { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MainLayout>
          {children}
    </MainLayout>
    
  );
}