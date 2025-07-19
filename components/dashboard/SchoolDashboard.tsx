import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Award, 
  Calendar, 
  ChevronRight,
  MoreHorizontal,
  ChevronLeft
} from 'lucide-react';
import Image from 'next/image';

const SchoolDashboard = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  
  // Mock data based on the image
  const dashboardStats = {
    students: {
      count: 124684,
      change: 1.5,
      boys: 45414,
      boysPercentage: 47,
      girls: 40270,
      girlsPercentage: 53
    },
    teachers: {
      count: 12379,
      change: 3
    },
    staff: {
      count: 29300,
      change: 3
    },
    awards: {
      count: 95800,
      change: 5
    },
    olympicStudents: {
      count: 24680,
      change: 15
    },
    competitions: {
      count: 3000,
      change: -8
    }
  };

  const attendanceData = [
    { day: 'Mon', present: 65, absent: 35 },
    { day: 'Tue', present: 75, absent: 25 },
    { day: 'Wed', present: 95, absent: 5 },
    { day: 'Thu', present: 70, absent: 30 },
    { day: 'Fri', present: 80, absent: 20 }
  ];

  const agenda = [
    { time: '08:00 am', title: 'Homeroom & Announcement', grade: 'All Grade' },
    { time: '10:00 am', title: 'Math Review & Practice', grade: 'Grade 3-5' },
    { time: '10:30 am', title: 'Science Experiment & Discussion', grade: 'Grade 6-8' }
  ];

  const messages = [
    {
      id: 1,
      sender: 'Dr. Lila Ramirez',
      message: 'Please ensure the monthly attendance report is accurate before the April 30th deadline.',
      time: '9:00 AM'
    },
    {
      id: 2,
      sender: 'Ms. Heather Morris',
      message: 'Don\'t forget the staff training on digital tools scheduled for May 5th at 3 PM in the library.',
      time: '10:15 AM'
    },
    {
      id: 3,
      sender: 'Mr. Carl Jenkins',
      message: 'Budget review meeting for the next fiscal year is on April 28th at 10 AM.',
      time: '2:00 PM'
    },
    {
      id: 4,
      sender: 'Officer Dan Brooks',
      message: 'Review the updated security protocols effective May 1st. Familiarize yourself with emergency procedures.',
      time: '3:10 PM'
    },
    {
      id: 5,
      sender: 'Ms. Tina Goldberg',
      message: 'Reminder: Major IT system upgrade on May 8th from 1 PM to 4 PM.',
      time: '5:00 PM'
    }
  ];

  const notices = [
    {
      id: 1,
      title: 'Math Olympiad Competition',
      date: '04/18/2030',
      by: 'Ms. Jackson (Math Teacher)'
    },
    {
      id: 2,
      title: 'Yearbook Photo Submissions Wanted',
      date: '04/15/2030',
      by: 'Yearbook Committee'
    },
    {
      id: 3,
      title: 'Reminder: School Play Auditions This Week',
      date: '04/12/2030',
      by: 'Mr. Rodriguez (Drama Teacher)'
    },
    {
      id: 4,
      title: 'Lost and Found Overflowing!',
      date: '04/10/2030',
      by: 'School Administration'
    },
    {
      id: 5,
      title: 'Important Update: School Uniform Policy',
      date: '04/09/2030',
      by: 'Principal Smith'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      user: 'Ms. Johnson',
      action: 'assigned new',
      target: 'English Literature',
      extra: 'homework',
      time: '20 minutes ago'
    },
    {
      id: 2,
      user: 'David Lee',
      action: 'already submitted quiz in',
      target: 'History',
      time: '1 hour ago'
    },
    {
      id: 3,
      user: 'Permission Slip Reminder:',
      target: 'Science Museum Field Trip',
      time: '3 hours ago'
    },
    {
      id: 4,
      user: 'Permission Slip Reminder:',
      target: 'Science Museum Field Trip',
      time: '4 hours ago'
    }
  ];

  const studentActivities = [
    {
      id: 1,
      title: 'Regional Robotics Champion',
      description: 'Winning robots triumph in engineering challenge',
      time: '2 days ago',
      icon: '🤖'
    },
    {
      id: 2,
      title: 'Won Regional Debate Competition',
      description: 'Debate team\'s compelling arguments reach national stage',
      time: '10 hours ago',
      icon: '🎭'
    },
    {
      id: 3,
      title: '2nd Place at Science State Fair',
      description: 'Science Club earns prize at state showcase',
      time: '3 weeks ago',
      icon: '🔬'
    }
  ];

  // Get days for the current month
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Calendar days of week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getMonthName = (date: any) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
                    'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main Content and Sidebar Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Dashboard Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Students Card */}
            <div className="bg-purple-100 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-white/30 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                +{dashboardStats.students.change}%
              </div>
              <h2 className="text-3xl font-bold text-purple-900 mt-2">{dashboardStats.students.count.toLocaleString()}</h2>
              <p className="text-purple-700 font-medium">Students</p>
            </div>

            {/* Teachers Card */}
            <div className="bg-yellow-100 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-white/30 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                +{dashboardStats.teachers.change}%
              </div>
              <h2 className="text-3xl font-bold text-yellow-900 mt-2">{dashboardStats.teachers.count.toLocaleString()}</h2>
              <p className="text-yellow-700 font-medium">Teachers</p>
            </div>

            {/* Staff Card */}
            <div className="bg-blue-100 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-white/30 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                +{dashboardStats.staff.change}%
              </div>
              <h2 className="text-3xl font-bold text-blue-900 mt-2">{dashboardStats.staff.count.toLocaleString()}</h2>
              <p className="text-blue-700 font-medium">Staffs</p>
            </div>

            {/* Awards Card */}
            <div className="bg-amber-100 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-white/30 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">
                +{dashboardStats.awards.change}%
              </div>
              <h2 className="text-3xl font-bold text-amber-900 mt-2">{dashboardStats.awards.count.toLocaleString()}</h2>
              <p className="text-amber-700 font-medium">Awards</p>
            </div>
          </div>

          {/* Middle Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Students Gender Distribution */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Students</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                {/* Circular Progress Chart (simplified) */}
                <div className="relative w-48 h-48 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Boys segment (light blue) */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="transparent"
                      stroke="#93c5fd" 
                      strokeWidth="20"
                      className="opacity-50"
                    />
                    {/* Girls segment (yellow) - covering part of the circle */}
                    <path
                      d="M50,50 L50,10 A40,40 0 0,1 90,50 Z"
                      fill="transparent"
                      stroke="#fcd34d"
                      strokeWidth="20"
                      className="opacity-70"
                    />
                    {/* Inner white circle for contrast */}
                    <circle cx="50" cy="50" r="30" fill="white" />
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex justify-center gap-x-8">
                        <div className="flex items-center text-blue-400">
                          <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-1"></span>
                          <span className="text-xs">Boys</span>
                        </div>
                        <div className="flex items-center text-yellow-400">
                          <span className="inline-block w-3 h-3 bg-yellow-300 rounded-full mr-1"></span>
                          <span className="text-xs">Girls</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-16 w-full text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-700">{dashboardStats.students.boys.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Boys ({dashboardStats.students.boysPercentage}%)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-700">{dashboardStats.students.girls.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Girls ({dashboardStats.students.girlsPercentage}%)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Chart */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800">Attendance</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center px-3 py-1 bg-gray-100 rounded-md text-sm">
                    <span className="text-gray-600">Weekly</span>
                    <ChevronRight size={16} className="ml-1 text-gray-400" />
                  </div>
                  <div className="flex items-center px-3 py-1 bg-gray-100 rounded-md text-sm">
                    <span className="text-gray-600">Grade 3</span>
                    <ChevronRight size={16} className="ml-1 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-2 text-sm">
                <div className="flex items-center mr-4">
                  <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-1"></span>
                  <span className="text-gray-600">Total Present</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-blue-300 rounded-full mr-1"></span>
                  <span className="text-gray-600">Total Absent</span>
                </div>
              </div>
              
              {/* Bar Chart */}
              <div className="h-48 flex items-end space-x-6 mt-2">
                {attendanceData.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center space-x-1">
                      {/* Present Bar */}
                      <div 
                        className="w-4 bg-yellow-400 rounded-t" 
                        style={{ height: `${day.present * 2}px` }}
                      >
                        {day.day === 'Wed' && (
                          <div className="relative">
                            <div className="absolute -right-6 -top-6 bg-white text-xs font-medium p-1 rounded shadow-sm">
                              95%
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Absent Bar */}
                      <div 
                        className="w-4 bg-blue-300 rounded-t" 
                        style={{ height: `${day.absent * 2}px` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{day.day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Earnings</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>
            
            <div className="relative h-64">
              {/* SVG for the earnings chart - simplified version */}
              <svg className="w-full h-full" viewBox="0 0 800 200">
                {/* Income line */}
                <path 
                  d="M0,150 C50,120 100,100 150,110 C200,120 250,80 300,70 C350,60 400,90 450,100 C500,110 550,50 600,40 C650,30 700,60 750,50 C800,40 850,30 900,20" 
                  fill="none" 
                  stroke="#a5f3fc" 
                  strokeWidth="4"
                />
                
                {/* Expense line */}
                <path 
                  d="M0,180 C50,170 100,160 150,165 C200,170 250,150 300,160 C350,170 400,150 450,160 C500,170 550,130 600,140 C650,150 700,120 750,130 C800,140 850,130 900,120" 
                  fill="none" 
                  stroke="#c4b5fd" 
                  strokeWidth="4"
                />
                
                {/* Dots for data points */}
                <circle cx="150" cy="110" r="4" fill="#a5f3fc" />
                <circle cx="300" cy="70" r="4" fill="#a5f3fc" />
                <circle cx="450" cy="100" r="4" fill="#a5f3fc" />
                <circle cx="600" cy="40" r="4" fill="#a5f3fc" />
                <circle cx="750" cy="50" r="4" fill="#a5f3fc" />
                
                <circle cx="150" cy="165" r="4" fill="#c4b5fd" />
                <circle cx="300" cy="160" r="4" fill="#c4b5fd" />
                <circle cx="450" cy="160" r="4" fill="#c4b5fd" />
                <circle cx="600" cy="140" r="4" fill="#c4b5fd" />
                <circle cx="750" cy="130" r="4" fill="#c4b5fd" />
              </svg>
              
              {/* Legend */}
              <div className="absolute top-0 right-0 flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-cyan-300 rounded-full mr-2"></span>
                  <span className="text-sm text-gray-600">Income</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-purple-300 rounded-full mr-2"></span>
                  <span className="text-sm text-gray-600">Expense</span>
                </div>
              </div>
              
              {/* Date and values */}
              <div className="absolute top-4 right-24 text-xs text-gray-500">
                Sep 14, 2030
              </div>
              <div className="absolute top-12 right-24">
                <div className="text-xs text-gray-500">$437,000</div>
                <div className="text-xs text-gray-500">$500,000</div>
              </div>
            </div>
            
            {/* X-axis months */}
            <div className="flex justify-between px-4 pt-2 text-xs text-gray-500">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Activity */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Student Activity</h3>
                <a href="#" className="text-sm text-blue-500 hover:text-blue-700">View All</a>
              </div>
              
              <div className="space-y-4">
                {studentActivities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-lg">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{activity.title}</h4>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice Board */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Notice Board</h3>
                <div className="flex space-x-1">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronLeft size={16} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {notices.map(notice => (
                  <div key={notice.id} className="flex items-start">
                    <div className="w-10 h-10 bg-blue-50 rounded-md mr-3 flex items-center justify-center overflow-hidden">
                      {notice.id === 1 && (
                        <span className="text-lg">🧮</span>
                      )}
                      {notice.id === 2 && (
                        <span className="text-lg">📸</span>
                      )}
                      {notice.id === 3 && (
                        <span className="text-lg">🎭</span>
                      )}
                      {notice.id === 4 && (
                        <span className="text-lg">🔍</span>
                      )}
                      {notice.id === 5 && (
                        <span className="text-lg">👔</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm">{notice.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 flex justify-between">
                        <span className="text-blue-400">{notice.date}</span>
                        <span>By {notice.by}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Recent Activity</h3>
                <a href="#" className="text-sm text-blue-500 hover:text-blue-700">View All</a>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Today</h4>
                
                <div className="space-y-4">
                  {recentActivities.map(activity => (
                    <div key={activity.id} className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs font-bold mr-3">
                        {activity.id === 1 && 'J'}
                        {activity.id === 2 && 'DL'}
                        {activity.id > 2 && '🧪'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{activity.user}</span>{' '}
                          {activity.action && <span>{activity.action} </span>}
                          <span className="font-medium text-blue-600">{activity.target}</span>
                          {activity.extra && <span> {activity.extra}</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          {/* Calendar Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">September 2030</h2>
              <div className="flex space-x-1">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <ChevronLeft size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Days of Week */}
            <div className="grid grid-cols-7 mb-2">
              {daysOfWeek.map((day, index) => (
                <div key={index} className="text-center text-xs text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => (
                <button 
                  key={day} 
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm 
                    ${selectedDay === day 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Agenda Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Agenda</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>
            
            <div className="space-y-2">
              {agenda.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    index === 0 ? 'bg-blue-50' : 
                    index === 1 ? 'bg-yellow-50' : 'bg-purple-50'
                  }`}
                >
                  <p className="text-xs text-gray-500">{item.time}</p>
                  <p className="text-xs text-gray-400">{item.grade}</p>
                  <p className="font-medium text-gray-800 text-sm">{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Messages Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Messages</h3>
              <a href="#" className="text-sm text-blue-500 hover:text-blue-700">View All</a>
            </div>
            
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {/* Placeholder for avatar */}
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-500 font-bold">
                      {message.sender.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-800 text-sm">{message.sender}</h4>
                      <span className="text-xs text-gray-400">{message.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{message.message}</p>
                  </div>
                  <button className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;