"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardList,
  DollarSign,
  Bell,
  Calendar,
  BookOpen,
  MessageSquare,
  User,
  Settings,
  LogOut
} from "lucide-react";
import Image from "next/image";

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  submenu?: Array<{
    title: string;
    href: string;
  }>;
}

export function Sidebar() {
  const pathname = usePathname();
  
  const mainMenuItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Teachers",
      href: "/teachers",
      icon: GraduationCap,
    },
    {
      title: "Students",
      href: "/students",
      icon: Users,
    },
    {
      title: "Attendance",
      href: "/attendance",
      icon: ClipboardList,
    },
    {
      title: "Finance",
      href: "/finance",
      icon: DollarSign,
      submenu: [
        {
          title: "Fees Collection",
          href: "/finance/fees-collection",
        },
        {
          title: "School Expenses",
          href: "/finance/school-expenses",
        }
      ]
    },
    {
      title: "Notice",
      href: "/notice",
      icon: Bell,
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
  ];

  const otherMenuItems: SidebarItem[] = [
    {
      title: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      title: "Setting",
      href: "/setting",
      icon: Settings,
    },
    {
      title: "Log out",
      href: "/logout",
      icon: LogOut,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="w-56 bg-white h-screen border-r flex flex-col">
      <div className="p-4 flex items-center">
        <div className="mr-2">
          <Image src="/logo.png" alt="SchoolHub Logo" width={24} height={24} />
        </div>
        <span className="font-bold text-lg">SchoolHub</span>
      </div>

      <div className="flex flex-col overflow-y-auto flex-grow">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            MENU
          </h3>
          <nav className="space-y-1">
            {mainMenuItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive(item.href) ? "text-blue-600" : "text-gray-500"
                    }`}
                  />
                  {item.title}
                  {item.submenu && (
                    <svg
                      className="ml-auto w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          isActive(item.href)
                            ? "M5 15l7-7 7 7"
                            : "M19 9l-7 7-7-7"
                        }
                      />
                    </svg>
                  )}
                </Link>
                {item.submenu && isActive(item.href) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        className={`flex items-center px-2 py-1.5 text-sm rounded-md ${
                          pathname === subitem.href
                            ? "text-blue-600 font-medium"
                            : "text-gray-600 hover:text-blue-600"
                        }`}
                      >
                        {subitem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="px-3 py-2 mt-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            OTHER
          </h3>
          <nav className="space-y-1">
            {otherMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive(item.href) ? "text-blue-600" : "text-gray-500"
                  }`}
                />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 mt-auto bg-cyan-500 text-white">
        <div className="text-sm font-medium">Let&apos;s Manage</div>
        <div className="text-sm font-medium">Your Data Better</div>
        <div className="text-sm font-medium">in Your Hand</div>
        <div className="mt-3">
          <Link
            href="#"
            className="bg-white text-cyan-500 text-xs font-medium px-3 py-1 rounded-full"
          >
            Download the App
          </Link>
        </div>
      </div>
    </aside>
  );
}