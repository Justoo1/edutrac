'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Assignment, AssignmentStatus } from "@/types/dashboard"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

// Sample data
const assignments: Assignment[] = [
  {
    id: '1',
    number: '01',
    title: 'Read Chapters 1-3',
    subject: 'English Literature',
    dueDate: new Date(2024, 4, 1), // May 1, 2024
    time: '09:00 AM',
    status: 'In Progress'
  },
  {
    id: '2',
    number: '02',
    title: 'Complete Problem Set #5',
    subject: 'Mathematics',
    dueDate: new Date(2024, 4, 3), // May 3, 2024
    time: '10:30 AM',
    status: 'Not Started'
  },
  {
    id: '3',
    number: '03',
    title: 'Write Lab Report on Acid-Base Titration',
    subject: 'Chemistry',
    dueDate: new Date(2024, 4, 5), // May 5, 2024
    time: '11:12 AM',
    status: 'In Progress'
  },
  {
    id: '4',
    number: '04',
    title: 'Prepare for Oral Presentation',
    subject: 'History',
    dueDate: new Date(2024, 4, 2), // May 2, 2024
    time: '12:00 PM',
    status: 'Not Started'
  },
  {
    id: '5',
    number: '05',
    title: 'Create Art Piece for Final Project',
    subject: 'Art',
    dueDate: new Date(2024, 4, 6), // May 6, 2024
    time: '03:00 PM',
    status: 'In Progress'
  }
]

export function AssignmentsTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Filter assignments by search query
  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage)
  
  // Status badge styling
  const getStatusBadgeStyle = (status: AssignmentStatus) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-50 text-blue-600 border border-blue-200'
      case 'Not Started':
        return 'bg-red-50 text-red-600 border border-red-200'
      case 'Completed':
        return 'bg-green-50 text-green-600 border border-green-200'
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200'
    }
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Assignments</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by Subject" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm rounded-full bg-gray-100 border-none"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs text-gray-500">
                <th className="text-left py-2 px-4 font-medium">No</th>
                <th className="text-left py-2 px-4 font-medium">Task</th>
                <th className="text-left py-2 px-4 font-medium">Subject</th>
                <th className="text-left py-2 px-4 font-medium">Due Date</th>
                <th className="text-left py-2 px-4 font-medium">Time</th>
                <th className="text-left py-2 px-4 font-medium">Status</th>
                <th className="text-left py-2 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssignments.map((assignment) => (
                <tr key={assignment.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-4 px-4">{assignment.number}</td>
                  <td className="py-4 px-4 font-medium">{assignment.title}</td>
                  <td className="py-4 px-4">{assignment.subject}</td>
                  <td className="py-4 px-4">
                    {assignment.dueDate.toLocaleDateString('en-US', { 
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-4 px-4">{assignment.time}</td>
                  <td className="py-4 px-4">
                    <span className={`text-xs px-2 py-1 rounded-md ${getStatusBadgeStyle(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 flex space-x-2">
                    <button className="text-blue-500 hover:text-blue-700">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.06 9.02L14.98 9.94L5.92 19H5V18.08L14.06 9.02ZM17.66 3C17.41 3 17.15 3.1 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C18.17 3.09 17.92 3 17.66 3ZM14.06 6.19L3 17.25V21H6.75L17.81 9.94L14.06 6.19Z" fill="currentColor"/>
                      </svg>
                    </button>
                    <button className="text-red-500 hover:text-red-700">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}