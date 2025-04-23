"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  School,
  Settings,
  Users,
  UserCircle2,
  LogOut,
  DollarSign,
  Building2,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { SelectSchool } from "@/lib/schema"

interface AppSidebarProps {
  school: SelectSchool;
}

export function AppSidebar({ school }: AppSidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Teachers",
      href: "/teachers",
      icon: School,
    },
    {
      title: "Students",
      href: "/students",
      icon: Users,
    },
    {
      title: "Guardians",
      href: "/guardian",
      icon: Users,
    },
    {
      title: "Attendance",
      href: "/attendance",
      icon: BarChart3,
    },
    {
      title: "Timetable",
      href: "/timetable",
      icon: Calendar,
    },
    {
      title: "Classroom",
      href: "/classroom",
      icon: Building2,
    },
    {
      title: "Subjects",
      href: "/subjects",
      icon: FileText,
    },
    {
      title: "Exams",
      href: "/exams",
      icon: FileText,
    },
    {
      title: "Results",
      href: "/results",
      icon: FileText,
    },
    {
      title: "Finance",
      href: "/finance",
      icon: DollarSign,
    },
    {
      title: "Notice",
      href: "/notice",
      icon: FileText,
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: Calendar,
    },
    {
      title: "Library",
      href: "/library",
      icon: BookOpen,
    },
    {
      title: "Message",
      href: "/message",
      icon: MessageSquare,
    },
  ]

  const otherItems = [
    {
      title: "Profile",
      href: "/profile",
      icon: UserCircle2,
    },
    {
      title: "School",
      href: "/schools",
      icon: School,
    },
    {
      title: "Setting",
      href: "/settings",
      icon: Settings,
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500 text-white">
            <School className="h-4 w-4" />
          </span>
          <span>EduTrac</span>
          <br />
          <span className="text-xs text-muted-foreground">{school && school.name}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 py-2">
          <p className="px-4 text-xs font-medium text-muted-foreground">MENU</p>
        </div>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarSeparator />
        <div className="px-2 py-2">
          <p className="px-4 text-xs font-medium text-muted-foreground">OTHER</p>
        </div>
        <SidebarMenu>
          {otherItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Log out">
              <Link href="/logout">
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="rounded-lg bg-sky-500 p-4 text-white">
          <h3 className="font-semibold">Let&apos;s Manage</h3>
          <p className="text-sm">Your Data Better in Your Hand</p>
          <button className="mt-4 w-full rounded-md bg-white px-3 py-1 text-xs font-medium text-sky-500">
            Download the App
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

