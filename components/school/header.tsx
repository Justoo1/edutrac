"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { type SelectSchool } from "@/lib/schema";

export default function SchoolHeader({ 
  school, 
  domain 
}: { 
  school: SelectSchool; 
  domain: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define navigation links
  const navigation = [
    { name: 'Home', href: `/` },
    { name: 'About', href: `/about` },
    { name: 'Academics', href: `/academics` },
    { name: 'Admissions', href: `/admissions` },
    { name: 'Faculty', href: `/faculty` },
    { name: 'Calendar', href: `/calendar` },
    { name: 'Contact', href: `/contact` },
  ];

  return (
    <header className="relative bg-white shadow-sm dark:bg-gray-800">
      {/* Top bar with logo and school name */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href={`/`} className="flex items-center">
              <div className="h-12 w-12 overflow-hidden rounded-full">
                <Image
                  src={school.logo || "/default-school-logo.png"}
                  alt={school.name || "School logo"}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {school.name}
                </h1>
                {/* TODO: Add motto */}
                {/* {school?.motto && (
                  <p className="text-xs italic text-gray-600 dark:text-gray-300">
                    {school.motto}
                  </p>
                )} */}
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Login
                </Link>
              </li>
            </ul>
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/login"
              className="block rounded-md bg-blue-600 px-3 py-2 text-base font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}