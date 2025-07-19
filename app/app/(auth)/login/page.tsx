import { Suspense } from 'react';
import LoginClient from './login-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Loading Skeleton Component
function LoginPageSkeleton() {
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
            {/* Email field */}
            <div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            
            {/* Password field */}
            <div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            
            {/* Submit button */}
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 dark:bg-black">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </span>
              </div>
            </div>
            
            {/* Register button */}
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}