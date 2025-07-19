"use client"

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
import { deleteTeacher } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SelectStaff } from "@/lib/schema"

interface TeacherTableProps {
  teachers: SelectStaff[]
  isAdmin: boolean
  searchQuery?: string
  filterValue?: string
}

// Fix the linter error with contactInfo by explicitly checking for null
interface ContactInfo {
  [key: string]: string;
}

// Helper function to safely render contact info
function renderContactInfo(contactInfo: unknown) {
  if (!contactInfo || typeof contactInfo !== 'object') {
    return null;
  }
  
  try {
    const entries = Object.entries(contactInfo as ContactInfo);
    if (entries.length === 0) return null;
    
    return (
      <div className="space-y-1 mt-2">
        {entries.map(([key, value]) => (
          <div key={key} className="text-sm flex items-start gap-2">
            <span className="font-medium capitalize">{key}:</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    );
  } catch (error) {
    return null;
  }
}

export function TeacherTable({ 
  teachers, 
  isAdmin,
  searchQuery = "",
  filterValue = ""
}: TeacherTableProps) {
  const router = useRouter()
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<SelectStaff[]>(teachers)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewTeacherOpen, setViewTeacherOpen] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  const [selectedTeacher, setSelectedTeacher] = useState<SelectStaff | null>(null)
  
  const teachersPerPage = 5

  // Filter teachers based on search query and filter value
  useEffect(() => {
    if (!teachers.length) {
      setFilteredTeachers([]);
      return;
    }

    let result = [...teachers];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(teacher => 
        (teacher.name || '').toLowerCase().includes(searchLower) ||
        (teacher.email || '').toLowerCase().includes(searchLower) ||
        (teacher.staffId || '').toLowerCase().includes(searchLower) ||
        (teacher.department || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply department filter
    if (filterValue && filterValue !== "all") {
      result = result.filter(teacher => 
        (teacher.department || '').toLowerCase() === filterValue.toLowerCase()
      );
    }

    setFilteredTeachers(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [teachers, searchQuery, filterValue]);

  // Calculate pagination based on filtered teachers
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
  const indexOfLastTeacher = currentPage * teachersPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);

  const handleSelectAll = () => {
    if (selectedTeachers.length === currentTeachers.length) {
      setSelectedTeachers([])
    } else {
      setSelectedTeachers(currentTeachers.map(teacher => teacher.id))
    }
  }

  const handleSelectTeacher = (teacherId: string) => {
    if (selectedTeachers.includes(teacherId)) {
      setSelectedTeachers(selectedTeachers.filter(id => id !== teacherId))
    } else {
      setSelectedTeachers([...selectedTeachers, teacherId])
    }
  }

  // Toggle expanded row
  const toggleExpandedTeacher = (teacherId: string) => {
    if (expandedTeacher === teacherId) {
      setExpandedTeacher(null)
    } else {
      setExpandedTeacher(teacherId)
    }
  }

  const handleViewTeacher = (teacher: SelectStaff) => {
    setSelectedTeacherId(teacher.id);
    setSelectedTeacher(teacher);
    setViewTeacherOpen(true);
  }

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteTeacher(id)
      toast.success("Teacher deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete teacher")
    } finally {
      setIsLoading(false);
    }
  }

  // Get initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return "NN";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 rounded-md border">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading teachers...</p>
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
        {filteredTeachers.length === 0 ? (
          <div className="flex justify-center items-center p-12 text-center">
            <div className="max-w-sm space-y-2">
              <h3 className="text-lg font-medium">
                {teachers.length === 0 
                  ? "No teachers found" 
                  : "No matching teachers found"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {teachers.length === 0 
                  ? "There are no teachers registered in this school yet. Click the \"Add Teacher\" button to create your first teacher record." 
                  : "Try adjusting your search or filter criteria to find what you're looking for."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {isAdmin && (
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedTeachers.length === currentTeachers.length && currentTeachers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Staff ID</TableHead>
                  <TableHead className="hidden md:table-cell">Position</TableHead>
                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                  <TableHead className="hidden xl:table-cell">Qualification</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {currentTeachers.map((teacher) => (
                    <React.Fragment key={teacher.id}>
                      <motion.tr
                        initial={{ opacity: 0, backgroundColor: "rgba(var(--primary-50), 0.2)" }}
                        animate={{ opacity: 1, backgroundColor: "transparent" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ backgroundColor: "rgba(var(--muted), 0.2)" }}
                        className="group"
                      >
                        {isAdmin && (
                          <TableCell>
                            <Checkbox 
                              checked={selectedTeachers.includes(teacher.id)}
                              onCheckedChange={() => handleSelectTeacher(teacher.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => toggleExpandedTeacher(teacher.id)}
                          >
                            <Avatar className="h-9 w-9 transition-transform group-hover:scale-110">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(teacher.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {teacher.name}
                              </div>
                              <div className="text-xs text-muted-foreground">{teacher.email}</div>
                            </div>
                            <ChevronDown 
                              className={`h-4 w-4 transition-transform ml-1 hidden sm:block
                                ${expandedTeacher === teacher.id ? 'rotate-180' : 'rotate-0'}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm">
                          {teacher.staffId}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {teacher.position}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline">
                            {teacher.department}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">{teacher.qualification}</TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => handleViewTeacher(teacher)}
                                    className="opacity-70 hover:opacity-100"
                                  >
                                    <View className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Profile</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              {isAdmin && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => router.push(`/teachers/${teacher.id}/edit`)}
                                      className="opacity-70 hover:opacity-100"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Teacher</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              
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
                                    onClick={() => handleViewTeacher(teacher)}
                                  >
                                    <User className="h-4 w-4" />
                                    <span>View Profile</span>
                                  </DropdownMenuItem>
                                  {isAdmin && (
                                    <DropdownMenuItem
                                      className="flex items-center gap-2"
                                      onClick={() => router.push(`/teachers/${teacher.id}/edit`)}
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit Teacher</span>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => window.location.href = `mailto:${teacher.email || ''}`}
                                  >
                                    <Mail className="h-4 w-4" />
                                    <span>Send Email</span>
                                  </DropdownMenuItem>
                                  {isAdmin && (
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
                                          handleDelete(teacher.id);
                                        }
                                      }}
                                    >
                                      <Trash className="h-4 w-4" />
                                      <span>Delete Teacher</span>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </motion.tr>
                      
                      {/* Expandable row with additional details */}
                      <AnimatePresence>
                        {expandedTeacher === teacher.id && (
                          <motion.tr
                            key={`expanded-${teacher.id}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-muted/30"
                          >
                            <TableCell colSpan={isAdmin ? 7 : 6} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Contact Information</h4>
                                  <div className="text-sm flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>{teacher.email || 'No email provided'}</span>
                                  </div>
                                  {renderContactInfo(teacher.contactInfo)}
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Teacher Details</h4>
                                  <div className="text-sm flex flex-col gap-1">
                                    <div><span className="font-medium">Position:</span> {teacher.position}</div>
                                    <div><span className="font-medium">Department:</span> {teacher.department}</div>
                                    <div><span className="font-medium">Qualification:</span> {teacher.qualification}</div>
                                    <div><span className="font-medium">Staff ID:</span> {teacher.staffId}</div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Actions</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {isAdmin && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-xs"
                                        onClick={() => router.push(`/teachers/${teacher.id}/edit`)}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit Teacher
                                      </Button>
                                    )}
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-xs"
                                      onClick={() => window.location.href = `mailto:${teacher.email || ''}`}
                                    >
                                      <Mail className="h-3 w-3 mr-1" />
                                      Send Email
                                    </Button>
                                    {isAdmin && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-xs text-destructive"
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
                                            handleDelete(teacher.id);
                                          }
                                        }}
                                      >
                                        <Trash className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
                                    )}
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
            
            {/* Only show pagination if we have filtered teachers */}
            {filteredTeachers.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {selectedTeachers.length > 0 ? (
                    <span>{selectedTeachers.length} selected</span>
                  ) : (
                    <span>Showing {indexOfFirstTeacher + 1}-{Math.min(indexOfLastTeacher, filteredTeachers.length)} of {filteredTeachers.length}</span>
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
      
      {/* View Teacher Profile Modal */}
      <Dialog open={viewTeacherOpen} onOpenChange={setViewTeacherOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
            <DialogDescription>View complete details of the selected teacher.</DialogDescription>
          </DialogHeader>
          
          {selectedTeacher && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(selectedTeacher.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{selectedTeacher.name}</h2>
                  <p className="text-muted-foreground">{selectedTeacher.position}</p>
                  <p className="text-sm text-muted-foreground">{selectedTeacher.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Professional Details</h3>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                      <div className="font-medium">Staff ID:</div>
                      <div>{selectedTeacher.staffId}</div>
                      <div className="font-medium">Position:</div>
                      <div>{selectedTeacher.position}</div>
                      <div className="font-medium">Department:</div>
                      <div>{selectedTeacher.department}</div>
                      <div className="font-medium">Qualification:</div>
                      <div>{selectedTeacher.qualification}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>{selectedTeacher.email || 'No email provided'}</div>
                      </div>
                      
                      {selectedTeacher.contactInfo && typeof selectedTeacher.contactInfo === 'object' && 
                       Object.keys(selectedTeacher.contactInfo as ContactInfo).length > 0 ? (
                        renderContactInfo(selectedTeacher.contactInfo)
                      ) : (
                        <div className="text-muted-foreground">No additional contact information</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/teachers/${selectedTeacher.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Teacher
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

