import React from "react";
import { BlockType } from "./types";
import { Calendar, Clock, MapPin, Users, Ticket, Trophy, Star } from "lucide-react";

// Event Calendar Block Component
export const EventCalendarBlock: React.FC<{ block: any }> = ({ block }) => {
  const { title = "Upcoming Events", events = [] } = block.content || {};
  
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length > 0 ? events.map((event: any, index: number) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden border hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
                <p className="text-gray-700 text-sm mb-3">{event.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600">{event.date}</span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          )) : (
            // Default events
            <>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Science Fair</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        9:00 AM - 3:00 PM
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    Main Hall
                  </div>
                  <p className="text-gray-700 text-sm mb-3">Annual science exhibition showcasing student projects and innovations.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">March 15, 2024</span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Sports Day</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        8:00 AM - 4:00 PM
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    Sports Ground
                  </div>
                  <p className="text-gray-700 text-sm mb-3">Inter-house athletics competition with various track and field events.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">March 22, 2024</span>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Cultural Night</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        6:00 PM - 9:00 PM
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    School Auditorium
                  </div>
                  <p className="text-gray-700 text-sm mb-3">Cultural performances, music, and dance by students and staff.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-600">April 5, 2024</span>
                    <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

// News & Announcements Block Component
export const NewsAnnouncementsBlock: React.FC<{ block: any }> = ({ block }) => {
  const { title = "Latest News & Announcements", news = [] } = block.content || {};
  
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {news.length > 0 ? news.map((item: any, index: number) => (
            <article key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-2 h-16 bg-blue-600 rounded"></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{item.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{item.date}</span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )) : (
            // Default news items
            <>
              <article className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-16 bg-blue-600 rounded"></div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">New Library Wing Opens</h3>
                    <p className="text-gray-600 text-sm mb-3">We are excited to announce the opening of our new library wing with modern facilities and expanded reading areas.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">March 10, 2024</span>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Read More
                      </button>
                    </div>
                  </div>
                </div>
              </article>
              
              <article className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-16 bg-green-600 rounded"></div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">Exam Results Published</h3>
                    <p className="text-gray-600 text-sm mb-3">The results for the mid-term examinations have been published. Students can check their results on the portal.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">March 8, 2024</span>
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Read More
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

// Event Registration Block Component
export const EventRegistrationBlock: React.FC<{ block: any }> = ({ block }) => {
  const { title = "Event Registration", subtitle = "Register for upcoming school events" } = block.content || {};
  
  return (
    <section className="py-12 bg-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter student name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Select Class</option>
                    <option>Class 1</option>
                    <option>Class 2</option>
                    <option>Class 3</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Select Event</option>
                  <option>Science Fair</option>
                  <option>Sports Day</option>
                  <option>Cultural Night</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent/Guardian Contact
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Register for Event
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// Block Type Definitions
export const EVENTS_BLOCKS: BlockType[] = [
  {
    type: "event-calendar",
    label: "Event Calendar",
    description: "Display upcoming school events in a calendar format",
    category: "Events",
    icon: Calendar,
    defaultContent: {
      title: "Upcoming Events",
      events: []
    }
  },
  {
    type: "news-announcements",
    label: "News & Announcements",
    description: "Show latest school news and announcements",
    category: "Events",
    icon: Ticket,
    defaultContent: {
      title: "Latest News & Announcements",
      news: []
    }
  },
  {
    type: "event-registration",
    label: "Event Registration",
    description: "Allow students to register for school events",
    category: "Events",
    icon: Users,
    defaultContent: {
      title: "Event Registration",
      subtitle: "Register for upcoming school events"
    }
  }
];

// Get default content function
export const getEventsDefaultContent = (type: string) => {
  const block = EVENTS_BLOCKS.find(b => b.type === type);
  return block?.defaultContent || null;
};
