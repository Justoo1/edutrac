"use client"

import React, { useState } from 'react';
import { 
  Calendar, 
  FileText, 
  BarChart2, 
  Plus, 
  Clock, 
  Filter, 
  Search, 
  ChevronDown,
  Edit,
  Trash2,
  Copy,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for demonstration
const mockExams = [
  {
    id: '1',
    title: 'End of Term Examination',
    gradeLevel: 'JHS 3',
    examType: 'End-term',
    subjects: ['English', 'Mathematics', 'Integrated Science', 'Social Studies'],
    startDate: '2023-07-15T08:00:00',
    endDate: '2023-07-20T16:00:00',
    status: 'Published',
    studentCount: 45
  },
  {
    id: '2',
    title: 'Mid-Term Assessment',
    gradeLevel: 'Primary 6',
    examType: 'Mid-term',
    subjects: ['English', 'Mathematics', 'Science', 'Social Studies', 'RME', 'ICT'],
    startDate: '2023-06-10T09:00:00',
    endDate: '2023-06-12T12:00:00',
    status: 'Completed',
    studentCount: 38
  },
  {
    id: '3',
    title: 'BECE Mock Examination',
    gradeLevel: 'JHS 3',
    examType: 'Mock',
    subjects: ['English', 'Mathematics', 'Integrated Science', 'Social Studies', 'ICT', 'Ghanaian Language'],
    startDate: '2023-08-05T08:00:00',
    endDate: '2023-08-10T16:00:00',
    status: 'Draft',
    studentCount: 42
  },
  {
    id: '4',
    title: 'Class Quiz - Mathematics',
    gradeLevel: 'SHS 2',
    examType: 'Quiz',
    subjects: ['Mathematics'],
    startDate: '2023-06-05T10:00:00',
    endDate: '2023-06-05T11:30:00',
    status: 'Completed',
    studentCount: 52
  },
  {
    id: '5',
    title: 'WASSCE Preparation - Core Subjects',
    gradeLevel: 'SHS 3',
    examType: 'Mock',
    subjects: ['English', 'Mathematics', 'Integrated Science', 'Social Studies'],
    startDate: '2023-09-12T08:00:00',
    endDate: '2023-09-16T16:00:00',
    status: 'Draft',
    studentCount: 63
  }
];

// Status badge component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    Published: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Ongoing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Archived: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || ''}`}>
      {status}
    </span>
  );
};

// Main component
export default function ExamsManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter exams based on active tab and search query
  const filteredExams = mockExams.filter(exam => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'upcoming' && ['Draft', 'Published'].includes(exam.status)) ||
                      (activeTab === 'ongoing' && exam.status === 'Ongoing') ||
                      (activeTab === 'completed' && exam.status === 'Completed') ||
                      (activeTab === 'archived' && exam.status === 'Archived');
                      
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exam.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exam.examType.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesTab && matchesSearch;
  });

  const examTypeCounts = {
    total: mockExams.length,
    upcoming: mockExams.filter(e => ['Draft', 'Published'].includes(e.status)).length,
    ongoing: mockExams.filter(e => e.status === 'Ongoing').length,
    completed: mockExams.filter(e => e.status === 'Completed').length
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Examinations</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all your school examinations in one place</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create New Examination
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Exams</p>
              <h3 className="text-2xl font-bold">{examTypeCounts.total}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
              <h3 className="text-2xl font-bold">{examTypeCounts.upcoming}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <h3 className="text-2xl font-bold">{examTypeCounts.ongoing}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <BarChart2 className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <h3 className="text-2xl font-bold">{examTypeCounts.completed}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search exams..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          
          <Button variant="outline" className="flex items-center">
            Academic Term
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          
          <Button variant="outline" className="flex items-center">
            Grade Level
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Exam Tabs and Lists */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Exams</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {filteredExams.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="min-w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Examination Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Grade Level
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Schedule
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Students
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{exam.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {exam.subjects.length > 3 
                              ? `${exam.subjects.slice(0, 3).join(', ')} +${exam.subjects.length - 3} more`
                              : exam.subjects.join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{exam.gradeLevel}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{exam.examType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(exam.startDate)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            to {formatDate(exam.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={exam.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {exam.studentCount} students
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{" "}
                      <span className="font-medium">{filteredExams.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <Button variant="outline" size="sm" className="rounded-l-md">
                        <ChevronDown className="h-4 w-4 rotate-90" />
                      </Button>
                      <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                        1
                      </Button>
                      <Button variant="outline" size="sm">
                        2
                      </Button>
                      <Button variant="outline" size="sm">
                        3
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-r-md">
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No examinations found</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">There are no examinations matching your search criteria.</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New Examination
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Other tab contents would be similar, filtered by their respective status */}
        <TabsContent value="upcoming" className="space-y-4">
          {/* Same structure as "all" tab but filtered for upcoming exams */}
        </TabsContent>
        
        <TabsContent value="ongoing" className="space-y-4">
          {/* Same structure as "all" tab but filtered for ongoing exams */}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {/* Same structure as "all" tab but filtered for completed exams */}
        </TabsContent>
        
        <TabsContent value="archived" className="space-y-4">
          {/* Same structure as "all" tab but filtered for archived exams */}
        </TabsContent>
      </Tabs>
    </div>
  );
}