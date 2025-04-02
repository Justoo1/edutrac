"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, Bell, Search } from "lucide-react";

export default function DashboardHeader({ title = "Dashboard" }: { title?: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden -ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-gray-400 dark:hover:text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="ml-3 text-2xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Search */}
          <div className="hidden md:block md:w-64">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search"
                name="search"
                className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-700 dark:placeholder:text-gray-400 dark:focus:ring-blue-500"
                placeholder="Search..."
                type="search"
              />
            </div>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="rounded-full bg-white p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <div className="flex items-center gap-x-3">
              <div>
                <span className="sr-only">Your profile</span>
                <div className="h-8 w-8 rounded-full bg-gray-50 overflow-hidden">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User avatar"}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-300 text-gray-600 font-medium text-sm dark:bg-gray-700 dark:text-gray-300">
                      {session?.user?.name
                        ? session.user.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-700 dark:text-white">
                  {session?.user?.name || "User"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {session?.user?.email || "user@example.com"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on mobile menu state */}
      {isMobileMenuOpen && (
        <div className="relative z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
          <div className="fixed inset-0 z-40 flex">
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-gray-800">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                <div className="flex flex-shrink-0 items-center px-4">
                  <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    EduTrac
                  </Link>
                </div>
                <nav className="mt-5 space-y-1 px-2">
                  {/* Mobile Navigation Links */}
                  <Link
                    href="/dashboard"
                    className={`${
                      pathname === "/dashboard"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    Dashboard
                  </Link>
                  {/* Add more navigation links here */}
                </nav>
              </div>
              <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div>
                    <div className="h-9 w-9 rounded-full overflow-hidden">
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "User avatar"}
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-300 text-gray-600 font-medium text-sm dark:bg-gray-700 dark:text-gray-300">
                          {session?.user?.name
                            ? session.user.name.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-white">
                      {session?.user?.name || "User"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {session?.user?.email || "user@example.com"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-14 flex-shrink-0">
              {/* Force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}