"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarCheck, Clock, MapPin, Users } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

export default function UpcomingEvents({ schoolId }: { schoolId: string }) {
  // In a real application, this would fetch from an API
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with timeout
    const timer = setTimeout(() => {
      // Sample data
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      
      const sampleEvents = [
        {
          id: "1",
          title: "School Assembly",
          date: new Date(currentYear, currentMonth, today.getDate() + 1),
          startTime: "8:00 AM",
          endTime: "9:00 AM",
          location: "School Hall",
          type: "assembly",
        },
        {
          id: "2",
          title: "Science Fair",
          date: new Date(currentYear, currentMonth, today.getDate() + 3),
          startTime: "10:00 AM",
          endTime: "2:00 PM",
          location: "Science Labs",
          type: "academic",
        },
        {
          id: "3",
          title: "Parent-Teacher Conference",
          date: new Date(currentYear, currentMonth, today.getDate() + 5),
          startTime: "3:00 PM",
          endTime: "6:00 PM",
          location: "Classrooms",
          type: "meeting",
        },
        {
          id: "4",
          title: "Football Match vs. Unity School",
          date: new Date(currentYear, currentMonth, today.getDate() + 7),
          startTime: "2:00 PM",
          endTime: "4:00 PM",
          location: "Sports Field",
          type: "sports",
        },
        {
          id: "5",
          title: "Independence Day Celebration",
          date: new Date(currentYear, currentMonth, today.getDate() + 10),
          startTime: "9:00 AM",
          endTime: "12:00 PM",
          location: "School Compound",
          type: "cultural",
        },
      ];
      
      setEvents(sampleEvents);
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

  if (events.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No upcoming events
        </p>
        <Link
          href="/dashboard/events/new"
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Add an event
        </Link>
      </div>
    );
  }

  // Group events by date for better organization
  const eventsByDate: Record<string, any[]> = {};
  events.forEach(event => {
    const dateKey = format(event.date, 'yyyy-MM-dd');
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  return (
    <div className="space-y-8">
      {Object.keys(eventsByDate).map(dateKey => {
        const dateEvents = eventsByDate[dateKey];
        const eventDate = new Date(dateKey);
        const isPastDate = isPast(eventDate) && !isToday(eventDate);
        
        return (
          <div key={dateKey}>
            <div className="mb-4 flex items-center">
              <CalendarCheck className="mr-2 h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isToday(eventDate) ? (
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Today</span>
                ) : (
                  format(eventDate, 'EEEE, MMMM d, yyyy')
                )}
              </h3>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dateEvents.map(event => (
                <div 
                  key={event.id}
                  className={`rounded-lg border ${
                    isPastDate 
                      ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50' 
                      : 'border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'
                  } p-4`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className={`text-base font-medium ${
                      isPastDate 
                        ? 'text-gray-500 dark:text-gray-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {event.title}
                    </h4>
                    <span 
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${getEventTypeStyles(event.type)}`}
                    >
                      {capitalize(event.type)}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {event.startTime} - {event.endTime}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {event.location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/dashboard/events/${event.id}`}
                      className={`text-sm font-medium ${
                        isPastDate 
                          ? 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300' 
                          : 'text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'
                      }`}
                    >
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      <div className="pt-4 text-center">
        <Link
          href="/dashboard/events"
          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all events
        </Link>
      </div>
    </div>
  );
}

// Helper function to get styles based on event type
function getEventTypeStyles(type: string): string {
  switch (type.toLowerCase()) {
    case 'assembly':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'academic':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'meeting':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'sports':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'cultural':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

// Helper function to capitalize first letter
function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}