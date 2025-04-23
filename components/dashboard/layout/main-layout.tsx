import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { UserNav } from "@/components/dashboard/layout/user-nav"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { schools } from "@/lib/schema"
import db from "@/lib/db"

interface MainLayoutProps {
  children: React.ReactNode
}

export async function MainLayout({ children }: MainLayoutProps) {
  const session = await getSession();
  if(!session) {
    redirect("/login")
  }
  
  // Get school information
  const school = await db.query.schools.findFirst({
    where: eq(schools.adminId, session.user.id),
  });
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        {school && <AppSidebar school={school} />}
        <div className="flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="w-full bg-background pl-8 md:w-[300px] lg:w-[300px]"
                />
              </div>
            </div>
            <UserNav user={session.user} />
          </header>
          <main className="flex-1 p-6 bg-blue-100">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

