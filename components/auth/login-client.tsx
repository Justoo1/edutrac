"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingDots from "@/components/icons/loading-dots";

export default function LoginClient() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();

  // Ensure component is mounted before using NextAuth
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const callback = urlParams.get("callbackUrl");
      if (callback) {
        setCallbackUrl(callback);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!mounted) return;
    
    setLoading(true);
    setError("");

    try {
      // Dynamically import signIn to avoid SSR issues
      const { signIn } = await import("next-auth/react");
      
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl,
      });

      if (!result?.ok) {
        setError(result?.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Successfully authenticated
      router.push(callbackUrl);
    } catch (error) {
      setError("An error occurred during login");
      setLoading(false);
    }
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mx-5 border border-stone-200 py-10 sm:mx-auto sm:w-full sm:max-w-md sm:rounded-lg sm:shadow-md dark:border-stone-700">
          <div className="animate-pulse">
            {/* Logo skeleton */}
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            
            {/* Title skeleton */}
            <div className="mt-6 mx-auto h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            
            {/* Subtitle skeleton */}
            <div className="mt-2 mx-auto h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            
            {/* Form skeleton */}
            <div className="mx-auto mt-8 w-11/12 max-w-xs sm:w-full space-y-6">
              <div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mx-5 border border-stone-200 py-10 sm:mx-auto sm:w-full sm:max-w-md sm:rounded-lg sm:shadow-md dark:border-stone-700">
        <Image
          alt="EduTrac Logo"
          width={100}
          height={100}
          className="relative mx-auto h-12 w-auto dark:scale-110 dark:rounded-full dark:border dark:border-stone-400"
          src="/logo.png"
        />
        <h1 className="mt-6 text-center font-cal text-3xl dark:text-white">
          EduTrac
        </h1>
        <p className="mt-2 text-center text-sm text-stone-600 dark:text-stone-400">
          School Management System for Ghana
        </p>

        <div className="mx-auto mt-8 w-11/12 max-w-xs sm:w-full">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="you@school.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`${
                  loading
                    ? "cursor-not-allowed bg-stone-50 dark:bg-stone-800"
                    : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                } flex w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                {loading ? <LoadingDots color="#808080" /> : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500 dark:bg-black dark:text-gray-400">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/register"
                className="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}