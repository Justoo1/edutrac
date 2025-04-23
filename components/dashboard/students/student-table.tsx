import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { 
  Edit, 
  Trash, 
  View, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  User,
  AlertCircle,
  Loader2,
  FileText,
  Printer
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { ViewStudentProfile } from "./view-student-profile"
import { ViewStudentRecords } from "./view-student-records"
import { PrintStudent } from "./print-student"
import { EditStudent } from "./edit-student"

// Define student type based on database schema
type Student = {
  id: string;
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: Date | string;
  gender?: string;
  status?: string;
  batchEnrollments?: {
    batch: {
      id: string;
      name: string;
      gradeLevel: string;
    };
  }[];
  contactInfo?: any;
  guardian?: any;
  primaryGuardian?: any;
  guardians?: any[];
  email?: string;
  phone?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  emergencyContact?: string;
  enrollmentDate?: string;
}

interface StudentTableProps {
  schoolId: string;
  refreshTrigger?: number;
  searchQuery?: string;
  filterValue?: string;
  statusFilter?: string;
}

export function StudentTable({ 
  schoolId, 
  refreshTrigger = 0,
  searchQuery = "",
  filterValue = "",
  statusFilter = ""
}: StudentTableProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [viewRecordsOpen, setViewRecordsOpen] = useState(false);
  const [printDetailsOpen, setPrintDetailsOpen] = useState(false);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  
  const studentsPerPage = 5;
  
  // Fetch students data from API
  useEffect(() => {
    fetchStudents();
  }, [schoolId, refreshTrigger]);
  
  // Helper function to safely parse dates with fallback
  const parseDateSafely = (dateString: string | Date | undefined): Date | null => {
    if (!dateString) return null;
    
    // If it's already a Date object, return it
    if (dateString instanceof Date) return dateString;
    
    // Try parsing the date string
    const parsed = new Date(dateString);
    
    // Check if valid date
    if (isNaN(parsed.getTime())) return null;
    
    return parsed;
  };
  
  // Filter students based on search query and filter value
  useEffect(() => {
    if (!students.length) {
      setFilteredStudents([]);
      return;
    }

    let result = [...students];

    // Apply status filter
    if (statusFilter) {
      // Special handling for "new" status filter
      if (statusFilter === "new") {
        // Filter for students enrolled in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        result = result.filter(student => {
          const enrollmentDate = parseDateSafely(student.enrollmentDate);
          if (!enrollmentDate) return false;
          
          // Compare dates by setting time to midnight for accurate day comparison
          const studentDate = new Date(enrollmentDate);
          studentDate.setHours(0, 0, 0, 0);
          const comparisonDate = new Date(thirtyDaysAgo);
          comparisonDate.setHours(0, 0, 0, 0);
          
          return studentDate >= comparisonDate;
        });
      } else {
        // Standard status filtering for other statuses
        result = result.filter(student => 
          (student.status || 'active').toLowerCase() === statusFilter.toLowerCase()
        );
      }
    }

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(student => 
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        (student.middleName && student.middleName.toLowerCase().includes(searchLower)) ||
        student.studentId.toLowerCase().includes(searchLower) ||
        (student.email && student.email.toLowerCase().includes(searchLower))
      );
    }

    // Apply class/grade filter
    if (filterValue && filterValue !== "all") {
      result = result.filter(student => {
        // Check if grade level exists and contains the filter value
        if (!student.batchEnrollments?.[0]?.batch) return false;
        
        const gradeLower = student.batchEnrollments[0].batch.gradeLevel.toLowerCase();
        
        switch(filterValue) {
          case "primary":
            return gradeLower.includes("primary") || 
                   gradeLower.includes("grade") || 
                   /\b[1-6]\b/.test(gradeLower);
          case "jhs":
            return gradeLower.includes("jhs") || 
                   gradeLower.includes("junior high") || 
                   gradeLower.includes("middle") || 
                   /\b[7-9]\b/.test(gradeLower);
          case "shs":
            return gradeLower.includes("shs") || 
                   gradeLower.includes("senior high") || 
                   gradeLower.includes("high school") || 
                   /\b1[0-2]\b/.test(gradeLower);
          case "all":
            return true; // Include all students when "all" is selected
          default:
            return false;
        }
      });
    }

    setFilteredStudents(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [students, searchQuery, filterValue, statusFilter]);
  
  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Real API call to fetch students data
      const response = await fetch(`/api/students?schoolId=${schoolId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStudents(data);
      setFilteredStudents(data); // Initialize filtered students with all students
    } catch (err) {
      console.error("Failed to fetch students:", err);
      
      // Provide more specific error message
      if (err instanceof Error) {
        setError(`Failed to load students: ${err.message}`);
      } else {
        setError("Failed to load students. Please try again later.");
      }
      
      // Fallback to demo data if API fails in development or if no students were returned
      if (process.env.NODE_ENV === 'development' || !students.length) {
        console.log("Using fallback student data");
        const fallbackData = [
          {
            id: "demo-001",
            studentId: "2023-01-001",
            firstName: "Sarah",
            lastName: "Miller",
            email: "smiller@eduprohigh.edu",
            currentGradeLevel: "10A",
            dateOfBirth: "04/18/2008",
            phone: "(555) 101-0101",
            address: "101 High St, Springfield, IL",
            status: "active",
            guardian: {
              parentName: "John Miller",
              parentPhone: "(555) 101-0202",
              parentEmail: "johnmiller@example.com",
              emergencyContact: "(555) 101-0303"
            }
          },
          {
            id: "demo-002",
            studentId: "2023-02-002",
            firstName: "Ethan",
            lastName: "Brown",
            email: "ebrown@eduprohigh.edu",
            currentGradeLevel: "12",
            dateOfBirth: "07/22/2006",
            phone: "(555) 101-0101",
            address: "202 Lake Ave, Springfield, IL",
            status: "graduated",
            guardian: {
              parentName: "Robert Brown",
              parentPhone: "(555) 202-0202",
              parentEmail: "rbrown@example.com"
            }
          },
          {
            id: "demo-003",
            studentId: "2023-03-003",
            firstName: "Olivia",
            lastName: "Smith",
            email: "osmith@eduprohigh.edu",
            currentGradeLevel: "9B",
            dateOfBirth: "09/29/2010",
            phone: "(555) 101-0101",
            address: "303 River Rd, Springfield, IL",
            status: "active",
            guardian: {
              parentName: "Emily Smith",
              parentPhone: "(555) 303-0303"
            }
          }
        ];
        setStudents(fallbackData);
        setFilteredStudents(fallbackData); // Initialize filtered students with fallback data
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate pagination based on filtered students
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  
  // Handle checkbox selection
  const handleSelectAll = () => {
    if (selectedStudents.length === currentStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(currentStudents.map(student => student.id))
    }
  }
  
  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }
  
  // Toggle expanded row
  const toggleExpandedStudent = (studentId: string) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null)
    } else {
      setExpandedStudent(studentId)
    }
  }
  
  // Handle student actions
  const handleViewStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    setViewProfileOpen(true);
  }
  
  const handleViewRecords = (student: Student) => {
    setSelectedStudentId(student.id);
    setSelectedStudentName(getFullName(student));
    setViewRecordsOpen(true);
  }
  
  const handlePrintDetails = (student: Student) => {
    setSelectedStudentId(student.id);
    setPrintDetailsOpen(true);
  }
  
  const handleEditStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    setEditStudentOpen(true);
  }
  
  const handleStudentUpdated = () => {
    toast.success("Student updated successfully");
    fetchStudents(); // Refresh the student list
  }
  
  const handleDeactivateStudent = async (studentId: string) => {
    try {
      // API call to deactivate student
      const response = await fetch(`/api/students/${studentId}/deactivate`, {
        method: 'PATCH',
      });
      
      if (!response.ok) throw new Error('Failed to deactivate student');
      
      // Update state after successful deactivation
      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status: 'inactive' }
          : student
      ));
      toast.success('Student deactivated successfully');
    } catch (error) {
      toast.error('Failed to deactivate student');
      console.error(error);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      // API call to delete student and related records
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete student');
      
      // Update state after successful deletion
      setStudents(students.filter(student => student.id !== studentId));
      toast.success('Student and all related records deleted successfully');
    } catch (error) {
      toast.error('Failed to delete student');
      console.error(error);
    }
  };
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'graduated':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'new':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  // Format name for display and avatar
  const getFullName = (student: Student) => {
    return `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`;
  }
  
  // Get initials for avatar
  const getInitials = (student: Student) => {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`;
  }
  
  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 rounded-md border">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center p-8 rounded-md border bg-red-50">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="rounded-md border overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {filteredStudents.length === 0 ? (
          <div className="flex justify-center items-center p-12 text-center">
            <div className="max-w-sm space-y-2">
              <h3 className="text-lg font-medium">
                {students.length === 0 
                  ? "No students found" 
                  : "No matching students found"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {students.length === 0 
                  ? "There are no students registered in this school yet. Click the \"Add Student\" button to create your first student record." 
                  : "Try adjusting your search or filter criteria to find what you're looking for."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedStudents.length === currentStudents.length && currentStudents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="hidden md:table-cell">Student ID</TableHead>
                  <TableHead className="hidden md:table-cell">Class</TableHead>
                  <TableHead className="hidden lg:table-cell">DOB</TableHead>
                  <TableHead className="hidden lg:table-cell">Gender</TableHead>
                  <TableHead className="hidden xl:table-cell">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {currentStudents.map((student) => (
                    <React.Fragment key={student.id}>
                      <motion.tr
                        initial={{ opacity: 0, backgroundColor: "rgba(var(--primary-50), 0.2)" }}
                        animate={{ opacity: 1, backgroundColor: "transparent" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ backgroundColor: "rgba(var(--muted), 0.2)" }}
                        className="group"
                      >
                        <TableCell>
                          <Checkbox 
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => handleSelectStudent(student.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => toggleExpandedStudent(student.id)}
                          >
                            <Avatar className="h-9 w-9 transition-transform group-hover:scale-110">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(student)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {getFullName(student)}
                                <Badge className={`text-xs ${getStatusColor(student.status)}`}>
                                  {student.status || 'active'}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">{student.email || `${student.studentId}@school.edu`}</div>
                            </div>
                            <ChevronDown 
                              className={`h-4 w-4 transition-transform ml-1 hidden sm:block
                                ${expandedStudent === student.id ? 'rotate-180' : 'rotate-0'}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm">
                          {student.studentId}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">
                            {student.batchEnrollments?.[0]?.batch?.gradeLevel || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDate(student.dateOfBirth)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{student.gender || 'N/A'}</TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge className={getStatusColor(student.status)}>
                            {student.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => handleViewStudent(student)}
                                    className="opacity-70 hover:opacity-100"
                                  >
                                    <View className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Profile</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => handleEditStudent(student)}
                                    className="opacity-70 hover:opacity-100"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Student</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="opacity-70 hover:opacity-100"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => handleViewStudent(student)}
                                  >
                                    <User className="h-4 w-4" />
                                    <span>View Profile</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => handleEditStudent(student)}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Edit Student</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => window.location.href = `mailto:${student.email || ''}`}
                                  >
                                    <Mail className="h-4 w-4" />
                                    <span>Send Email</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => toast.info(`Calling ${student.phone || 'N/A'}`)}
                                  >
                                    <Phone className="h-4 w-4" />
                                    <span>Call</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => handleViewRecords(student)}
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span>View Records</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => handlePrintDetails(student)}
                                  >
                                    <Printer className="h-4 w-4" />
                                    <span>Print Details</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {student.status !== 'inactive' && (
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-yellow-600 focus:text-yellow-600"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to deactivate this student? This will mark them as inactive but preserve their records.')) {
                                          handleDeactivateStudent(student.id);
                                        }
                                      }}
                                    >
                                      <AlertCircle className="h-4 w-4" />
                                      <span>Deactivate Student</span>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                                    onClick={() => {
                                      if (window.confirm('WARNING: This action will permanently delete the student and all related records (academic records, etc.). This action cannot be undone. Are you sure you want to proceed?')) {
                                        handleDeleteStudent(student.id);
                                      }
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                    <span>Delete Student Permanently</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </motion.tr>
                      
                      {/* Expandable row with additional details */}
                      <AnimatePresence>
                        {expandedStudent === student.id && (
                          <motion.tr
                            key={`expanded-${student.id}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-muted/30"
                          >
                            <TableCell colSpan={8} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Contact Information</h4>
                                  <div className="text-sm flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>{student.email || 'No email provided'}</span>
                                  </div>
                                  <div className="text-sm flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{student.phone || 'No phone provided'}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Address & Guardian</h4>
                                  <p className="text-sm">{student.address || 'No address provided'}</p>
                                  
                                  {(student.guardian?.parentName || student.parentName || student.primaryGuardian) && (
                                    <div className="text-sm mt-2">
                                      <div className="font-medium">Primary Guardian:</div>
                                      {student.primaryGuardian ? (
                                        <>
                                          <div>{student.primaryGuardian.firstName} {student.primaryGuardian.lastName}</div>
                                          <div>{student.primaryGuardian.phone}</div>
                                          {student.primaryGuardian.email && (
                                            <div className="text-xs text-muted-foreground">{student.primaryGuardian.email}</div>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <div>{student.guardian?.parentName || student.parentName}</div>
                                          <div>{student.guardian?.parentPhone || student.parentPhone || ''}</div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  
                                  {student.guardians && student.guardians.length > 1 && (
                                    <div className="text-sm mt-2">
                                      <div className="font-medium text-xs text-muted-foreground">
                                        + {student.guardians.length - 1} additional guardian(s)
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Actions</h4>
                                  <div className="flex flex-wrap gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-xs"
                                      onClick={() => handleEditStudent(student)}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit Student
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-xs"
                                      onClick={() => handleViewRecords(student)}
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      View Records
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-xs"
                                      onClick={() => handlePrintDetails(student)}
                                    >
                                      <Printer className="h-3 w-3 mr-1" />
                                      Print Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            
            {/* Only show pagination if we have filtered students */}
            {filteredStudents.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {selectedStudents.length > 0 ? (
                    <span>{selectedStudents.length} selected</span>
                  ) : (
                    <span>Showing {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous Page</span>
                    </Button>
                    
                    <div className="flex items-center">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        // For pagination with many pages, show first page, current and neighbors, and last page
                        let pageNum = i + 1;
                        
                        if (totalPages > 5) {
                          if (currentPage <= 3) {
                            // Show first 3 pages, ellipsis, and last page
                            if (i < 3) {
                              pageNum = i + 1;
                            } else if (i === 3) {
                              return (
                                <span key="ellipsis-1" className="mx-1 text-muted-foreground">...</span>
                              );
                            } else {
                              pageNum = totalPages;
                            }
                          } else if (currentPage >= totalPages - 2) {
                            // Show first page, ellipsis, and last 3 pages
                            if (i === 0) {
                              pageNum = 1;
                            } else if (i === 1) {
                              return (
                                <span key="ellipsis-2" className="mx-1 text-muted-foreground">...</span>
                              );
                            } else {
                              pageNum = totalPages - (4 - i);
                            }
                          } else {
                            // Show first page, ellipsis, current and neighbors, ellipsis, last page
                            if (i === 0) {
                              pageNum = 1;
                            } else if (i === 1) {
                              return (
                                <span key="ellipsis-3" className="mx-1 text-muted-foreground">...</span>
                              );
                            } else if (i === 2) {
                              pageNum = currentPage;
                            } else if (i === 3) {
                              return (
                                <span key="ellipsis-4" className="mx-1 text-muted-foreground">...</span>
                              );
                            } else {
                              pageNum = totalPages;
                            }
                          }
                        }
                        
                        return (
                          <Button
                            key={`page-${pageNum}`}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            <span>{pageNum}</span>
                            <span className="sr-only">Page {pageNum}</span>
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next Page</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
      
      {/* Modals for student actions */}
      <ViewStudentProfile
        isOpen={viewProfileOpen}
        onClose={() => setViewProfileOpen(false)}
        studentId={selectedStudentId}
        schoolId={schoolId}
      />
      
      <ViewStudentRecords
        isOpen={viewRecordsOpen}
        onClose={() => setViewRecordsOpen(false)}
        studentId={selectedStudentId}
        schoolId={schoolId}
        studentName={selectedStudentName}
      />
      
      <PrintStudent
        isOpen={printDetailsOpen}
        onClose={() => setPrintDetailsOpen(false)}
        studentId={selectedStudentId}
        schoolId={schoolId}
      />
      
      <EditStudent
        isOpen={editStudentOpen}
        onClose={() => setEditStudentOpen(false)}
        studentId={selectedStudentId}
        schoolId={schoolId}
        onStudentUpdated={handleStudentUpdated}
      />
    </>
  )
}

