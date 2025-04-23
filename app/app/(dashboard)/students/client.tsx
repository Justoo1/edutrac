"use client"

import { useState, useEffect } from "react"
import { StudentTable } from "@/components/dashboard/students/student-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { 
  Filter, 
  Plus, 
  Search, 
  RefreshCw,
  Loader2,
  GraduationCap
} from "lucide-react"
import { StudentForm } from "@/components/form/student-form"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface StudentsPageProps {
  schoolId: string;
}

export default function StudentsPageClient({ schoolId }: StudentsPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // Separate state for each tab
  const [allSearchQuery, setAllSearchQuery] = useState("")
  const [allFilterValue, setAllFilterValue] = useState("all")
  const [activeSearchQuery, setActiveSearchQuery] = useState("")
  const [activeFilterValue, setActiveFilterValue] = useState("all")
  const [graduatedSearchQuery, setGraduatedSearchQuery] = useState("")
  const [graduatedFilterValue, setGraduatedFilterValue] = useState("all")
  const [newSearchQuery, setNewSearchQuery] = useState("")
  const [newFilterValue, setNewFilterValue] = useState("all")
  
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Get current search query and filter based on active tab
  const getCurrentSearchQuery = () => {
    switch (activeTab) {
      case "active": return activeSearchQuery
      case "graduated": return graduatedSearchQuery
      case "new": return newSearchQuery
      default: return allSearchQuery
    }
  }

  const getCurrentFilterValue = () => {
    switch (activeTab) {
      case "active": return activeFilterValue
      case "graduated": return graduatedFilterValue
      case "new": return newFilterValue
      default: return allFilterValue
    }
  }
  
  // Set search query based on active tab
  const setCurrentSearchQuery = (value: string) => {
    switch (activeTab) {
      case "active": 
        setActiveSearchQuery(value)
        break
      case "graduated": 
        setGraduatedSearchQuery(value)
        break
      case "new": 
        setNewSearchQuery(value)
        break
      default: 
        setAllSearchQuery(value)
        break
    }
  }

  // Set filter value based on active tab
  const setCurrentFilterValue = (value: string) => {
    switch (activeTab) {
      case "active": 
        setActiveFilterValue(value)
        break
      case "graduated": 
        setGraduatedFilterValue(value)
        break
      case "new": 
        setNewFilterValue(value)
        break
      default: 
        setAllFilterValue(value)
        break
    }
  }
  
  // Simulating a loading state when filters change
  useEffect(() => {
    const currentSearchQuery = getCurrentSearchQuery();
    const currentFilterValue = getCurrentFilterValue();
    
    if (currentSearchQuery || currentFilterValue !== "all") {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 600)
      return () => clearTimeout(timer)
    } else {
      setIsLoading(false)
    }
  }, [activeTab, allSearchQuery, allFilterValue, activeSearchQuery, activeFilterValue, graduatedSearchQuery, graduatedFilterValue, newSearchQuery, newFilterValue])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSearchQuery(e.target.value)
  }

  const handleFilterChange = (value: string) => {
    setCurrentFilterValue(value)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    // Trigger the StudentTable to refresh data
    setRefreshTrigger(prev => prev + 1)
    setTimeout(() => {
      setIsLoading(false)
    }, 800)
  }
  
  // Handle successful student creation
  const handleStudentCreated = () => {
    setIsDialogOpen(false)
    // Trigger the StudentTable to refresh data
    setRefreshTrigger(prev => prev + 1)
    toast.success("Student created successfully!")
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header with animation */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Student Management</h1>
            <p className="text-sm text-muted-foreground">Manage all students in your school</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <motion.button 
                className="inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="h-4 w-4" />
                <span>Add Student</span>
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Fill in the student details to create a new record
                </DialogDescription>
              </DialogHeader>
              <StudentForm schoolId={schoolId} onSuccess={handleStudentCreated} />
            </DialogContent>
          </Dialog>
          
          <motion.button 
            onClick={handleRefresh}
            disabled={isLoading}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </motion.div>
      
      {/* Tabs for different student views */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 sm:w-[400px]">
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="graduated">Graduated</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {/* Search and filter section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search by Name or ID" 
                    className="w-full pl-8" 
                    value={allSearchQuery}
                    onChange={handleSearch}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={allFilterValue} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="jhs">JHS</SelectItem>
                      <SelectItem value="shs">SHS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </motion.div>
          
          {/* Table with loading state */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center p-12"
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {allSearchQuery || allFilterValue !== "all" ? 
                      "Filtering all students..." : "Loading all students..."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StudentTable 
                  schoolId={schoolId} 
                  refreshTrigger={refreshTrigger} 
                  searchQuery={allSearchQuery}
                  filterValue={allFilterValue}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4 mt-4">
          {/* Search and filter section for active students */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search by Name or ID" 
                    className="w-full pl-8" 
                    value={activeSearchQuery}
                    onChange={handleSearch}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={activeFilterValue} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="jhs">JHS</SelectItem>
                      <SelectItem value="shs">SHS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </motion.div>
          
          {/* Table with loading state */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center p-12"
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {activeSearchQuery || activeFilterValue !== "all" ? 
                      "Filtering active students..." : "Loading active students..."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StudentTable 
                  schoolId={schoolId} 
                  refreshTrigger={refreshTrigger} 
                  searchQuery={activeSearchQuery}
                  filterValue={activeFilterValue}
                  statusFilter="active"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
        
        <TabsContent value="graduated" className="space-y-4 mt-4">
          {/* Search and filter section for graduated students */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search by Name or ID" 
                    className="w-full pl-8" 
                    value={graduatedSearchQuery}
                    onChange={handleSearch}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={graduatedFilterValue} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="jhs">JHS</SelectItem>
                      <SelectItem value="shs">SHS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </motion.div>
          
          {/* Table with loading state */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center p-12"
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {graduatedSearchQuery || graduatedFilterValue !== "all" ? 
                      "Filtering graduated students..." : "Loading graduated students..."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StudentTable 
                  schoolId={schoolId} 
                  refreshTrigger={refreshTrigger} 
                  searchQuery={graduatedSearchQuery}
                  filterValue={graduatedFilterValue}
                  statusFilter="graduated"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
        
        <TabsContent value="new" className="space-y-4 mt-4">
          {/* Search and filter section for new students */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-muted-foreground mb-2 text-center">
                  Showing students enrolled in the last 30 days
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search by Name or ID" 
                      className="w-full pl-8" 
                      value={newSearchQuery}
                      onChange={handleSearch}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={newFilterValue} onValueChange={handleFilterChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="jhs">JHS</SelectItem>
                        <SelectItem value="shs">SHS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
          
          {/* Table with loading state */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center p-12"
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {newSearchQuery || newFilterValue !== "all" ? 
                      "Filtering recently enrolled students..." : "Loading recently enrolled students..."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StudentTable 
                  schoolId={schoolId} 
                  refreshTrigger={refreshTrigger} 
                  searchQuery={newSearchQuery}
                  filterValue={newFilterValue}
                  statusFilter="new"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
} 