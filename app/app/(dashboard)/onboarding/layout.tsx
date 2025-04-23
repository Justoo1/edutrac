import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { UserNav } from "@/components/dashboard/layout/user-nav";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b bg-background px-6">
        <UserNav user={session.user} />
      </header> */}
      <main className="flex-1 p-6 mx-auto max-w-6xl">{children}</main>
    </div>
  );
} 