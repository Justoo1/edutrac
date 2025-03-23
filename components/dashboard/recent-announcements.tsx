"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function RecentAnnouncements({ schoolId }: { schoolId: string }) {
  // In a real application, this would fetch from an API
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with timeout
    const timer = setTimeout(() => {
      // Sample data
      const sampleAnnouncements = [
        {
          id: "1",
          title: "End of Term Examination Schedule",
          description: "The end of term examinations will begin on July 15th. Please find the detailed schedule attached.",
          date: new Date(2023, 6, 5), // July 5, 2023
        },
        {
          id: "2",
          title: "Parent-Teacher Meeting",
          description: "We will be holding parent-teacher meetings on July 20th and 21st. Please book your slot.",
          date: new Date(2023, 6, 2), // July 2, 2023
        },
        {
          id: "3",
          title: "School Sports Day",
          description: "The annual sports day will be held on July 10th. All students are required to participate.",
          date: new Date(2023, 5, 28), // June 28, 2023
        },
        {
          id: "4",
          title: "New Library Books",
          description: "We have added 200 new books to our library collection. Students can check them out from next week.",
          date: new Date(2023, 5, 25), // June 25, 2023
        },
      ];
      
      setAnnouncements(sampleAnnouncements);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [schoolId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No recent announcements
        </p>
        <Link
          href="/dashboard/announcements/new"
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Create an announcement
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white">
                {announcement.title}
              </h4>
              <div className="mt-1 flex items-center">
                <CalendarDays className="mr-1.5 h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(announcement.date, "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/announcements/${announcement.id}`}
              className="ml-4 flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
            {announcement.description}
          </p>
        </div>
      ))}
      <div className="pt-4 text-center">
        <Link
          href="/dashboard/announcements"
          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all announcements
        </Link>
      </div>
    </div>
  );
}