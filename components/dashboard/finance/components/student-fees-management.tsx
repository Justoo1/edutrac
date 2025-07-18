"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Filter, Download, Plus, Edit, Eye, Send, Calendar, AlertCircle, CheckCircle2, Clock, Phone, User, AlertTriangle, DollarSign, Loader2 } from "lucide-react"
import { useStudentFees, useFinanceActions, useFeeTypes } from "@/hooks/finance/useFinanceData"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import useSWR from 'swr'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Hook to fetch classes
function useClasses(schoolId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/classes?schoolId=${schoolId}` : null,
    fetcher
  )

  return {
    classes: (data as any[]) || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Hook to fetch fee structures
function useFeeStructures(schoolId: string, filters?: {
  academicYear?: string;
  level?: string;
}) {
  const searchParams = new URLSearchParams()
  searchParams.append('schoolId', schoolId)
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) searchParams.append(key, value)
    })
  }

  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/finance/fee-structures?${searchParams.toString()}` : null,
    fetcher
  )

  return {
    feeStructures: (data as any[]) || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Hook to fetch academic years
function useAcademicYears(schoolId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/schools/${schoolId}/academic/years` : null,
    fetcher
  )

  return {
    academicYears: (data as any[]) || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Hook to fetch academic terms
function useAcademicTerms(schoolId: string, academicYearId?: string) {
  const url = academicYearId 
    ? `/api/schools/${schoolId}/academic/terms?academicYearId=${academicYearId}`
    : `/api/schools/${schoolId}/academic/terms`

  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? url : null,
    fetcher
  )

  return {
    terms: (data as any[]) || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function StudentFeesManagement() {
  const { data: session } = useSession()
  const schoolId = session?.user?.schoolId || "" // Get from session or context
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("all")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showAddFeeDialog, setShowAddFeeDialog] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    studentId: "",
    feeTypeId: "",
    amount: 0,
    paymentMethod: "",
    transactionId: "",
    notes: ""
  })
  const [feeForm, setFeeForm] = useState({
    name: "",
    description: "",
    amount: 0,
    frequency: "Term",
    gradeLevel: "",
    academicYear: "",
    academicYearId: "",
    term: "",
    termId: "",
    optional: false,
    dueDate: "",
    selectedFeeStructure: ""
  })
  const [isCreatingFromStructure, setIsCreatingFromStructure] = useState(false)
  const [applicableFeeTypes, setApplicableFeeTypes] = useState<any[]>([])
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null)

  // Function to get applicable fee types for selected student
  const getApplicableFeeTypes = async (studentId: string) => {
    if (!studentId) {
      setApplicableFeeTypes([])
      setSelectedStudentInfo(null)
      return
    }

    try {
      // Find the selected student's information
      const studentData = students.find((s: any) => s.student.id === studentId)
      if (!studentData) return

      setSelectedStudentInfo(studentData)
      
      const studentGradeLevel = studentData.student.currentGradeLevel
      const currentYear = academicYears.find(year => year.isCurrent) || academicYears[0]
      const currentTerm = terms.find(term => term.isCurrent) || terms[0]

      // Filter fee types based on student's grade level and current academic period
      const applicableFees = feeTypes.filter((fee: any) => {
        // Check if fee applies to this grade level
        const gradeMatches = !fee.gradeLevel || 
                           fee.gradeLevel === '' || 
                           fee.gradeLevel === 'all' || 
                           fee.gradeLevel === studentGradeLevel
        
        // Check if fee is for current academic year/term
        const yearMatches = !currentYear || fee.academicYear === currentYear.name
        const termMatches = !currentTerm || fee.term === currentTerm.name
        
        return gradeMatches && yearMatches && termMatches
      })

      setApplicableFeeTypes(applicableFees)
    } catch (error) {
      console.error('Error filtering fee types:', error)
      setApplicableFeeTypes([])
    }
  }

  // Handle student selection change
  const handleStudentChange = (studentId: string) => {
    setPaymentForm({
      ...paymentForm, 
      studentId,
      feeTypeId: "", // Reset fee type when student changes
      amount: 0
    })
    getApplicableFeeTypes(studentId)
  }

  // Fetch data
  const { students, isLoading: studentsLoading, mutate } = useStudentFees(schoolId)
  const { classes, isLoading: classesLoading } = useClasses(schoolId)
  const { academicYears, isLoading: academicYearsLoading } = useAcademicYears(schoolId)
  const { terms, isLoading: termsLoading } = useAcademicTerms(schoolId, feeForm.academicYearId)
  const { feeTypes, mutate: mutateFeeTypes } = useFeeTypes(schoolId, {
    academicYear: feeForm.academicYear,
    term: feeForm.term
  })
  const { feeStructures, isLoading: feeStructuresLoading } = useFeeStructures(schoolId, {
    academicYear: feeForm.academicYear
  })
  const { recordPayment, createFeeType, isLoading: isRecording } = useFinanceActions()

  // Extract unique grade levels from classes
  const gradeLevels = Array.from(
    new Set(
      classes
        .map((cls: any) => cls.gradeLevel)
        .filter((level): level is string => typeof level === 'string' && level.length > 0)
    )
  ).sort()

  // Set default academic year and term when data loads
  useEffect(() => {
    if (academicYears.length > 0 && !feeForm.academicYear) {
      const currentYear = academicYears.find(year => year.isCurrent) || academicYears[0]
      setFeeForm(prev => ({ 
        ...prev, 
        academicYear: currentYear.name,
        academicYearId: currentYear.id
      }))
    }
  }, [academicYears, feeForm.academicYear])

  // Set default term when terms load
  useEffect(() => {
    if (terms.length > 0 && !feeForm.term && feeForm.academicYearId) {
      const currentTerm = terms.find(term => term.isCurrent) || terms[0]
      setFeeForm(prev => ({ 
        ...prev, 
        term: currentTerm.name,
        termId: currentTerm.id
      }))
    }
  }, [terms, feeForm.term, feeForm.academicYearId])

  // Filter students based on search and selected filters
  const filteredStudents = students.filter((student: any) => {
    const matchesSearch = student.student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Get the student's current class info from the enhanced data
    const studentClass = student.student.currentClass
    const studentGradeLevel = student.student.currentGradeLevel
    
    const matchesClass = selectedClass === "all" || 
      (studentClass && studentClass.includes(selectedClass))
    
    const matchesGradeLevel = selectedGradeLevel === "all" || 
      (studentGradeLevel && studentGradeLevel.includes(selectedGradeLevel))
    
    const matchesStatus = selectedStatus === "all" || student.paymentStatus === selectedStatus
    
    return matchesSearch && matchesClass && matchesGradeLevel && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 border-green-200"
      case "partial": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "overdue": return "bg-red-100 text-red-800 border-red-200"
      case "unpaid": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="h-4 w-4" />
      case "partial": return <Clock className="h-4 w-4" />
      case "overdue": return <AlertTriangle className="h-4 w-4" />
      case "unpaid": return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((s: any) => s.student.id))
    }
  }

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  const handleRecordPayment = async () => {
    try {
      // Get current academic year and term from form state
      const currentYear = academicYears.find(year => year.isCurrent) || academicYears[0]
      const currentTerm = terms.find(term => term.isCurrent) || terms[0]
      
      await recordPayment({
        ...paymentForm,
        academicYear: currentYear?.name || "2023-2024",
        term: currentTerm?.name || "First Term"
      })
      
      toast.success("Payment recorded successfully")
      setShowPaymentDialog(false)
      setPaymentForm({
        studentId: "",
        feeTypeId: "",
        amount: 0,
        paymentMethod: "",
        transactionId: "",
        notes: ""
      })
      setApplicableFeeTypes([])
      setSelectedStudentInfo(null)
      mutate() // Refresh data
    } catch (error) {
      console.error("Payment recording error:", error)
      toast.error("Failed to record payment")
    }
  }

  const handleCreateFee = async () => {
    try {
      await createFeeType({
        ...feeForm,
        schoolId,
        dueDate: feeForm.dueDate ? new Date(feeForm.dueDate) : undefined
      })
      
      toast.success("Fee created successfully")
      setShowAddFeeDialog(false)
      resetFeeForm()
      setIsCreatingFromStructure(false)
      mutateFeeTypes() // Refresh fee types
    } catch (error) {
      toast.error("Failed to create fee")
    }
  }

  const handleCreateFeesFromStructure = async () => {
    const selectedStructure = feeStructures.find(s => s.id === feeForm.selectedFeeStructure)
    if (!selectedStructure) {
      toast.error("Please select a fee structure")
      return
    }

    setIsCreatingFromStructure(true)
    try {
      // Create a single fee type linked to the fee structure
      await createFeeType({
        name: `${selectedStructure.className} Fees`,
        description: `Complete fee structure for ${selectedStructure.className} - ${selectedStructure.academicYear}`,
        amount: selectedStructure.totalFee,
        frequency: feeForm.frequency,
        gradeLevel: selectedStructure.level,
        academicYear: feeForm.academicYear,
        term: feeForm.term,
        optional: false,
        schoolId,
        feeStructureId: selectedStructure.id, // Link to fee structure
        dueDate: feeForm.dueDate ? new Date(feeForm.dueDate) : undefined
      })
      
      toast.success(`Fee created successfully for ${selectedStructure.className} (GH₵${selectedStructure.totalFee?.toLocaleString()})`)
      setShowAddFeeDialog(false)
      resetFeeForm()
      setIsCreatingFromStructure(false)
      mutateFeeTypes() // Refresh fee types
    } catch (error) {
      toast.error("Failed to create fee from structure")
      setIsCreatingFromStructure(false)
    }
  }

  const resetFeeForm = () => {
    const currentYear = academicYears.find(year => year.isCurrent) || academicYears[0]
    const currentTerm = terms.find(term => term.isCurrent) || terms[0]
    
    setFeeForm({
      name: "",
      description: "",
      amount: 0,
      frequency: "Term",
      gradeLevel: "",
      academicYear: currentYear?.name || "",
      academicYearId: currentYear?.id || "",
      term: currentTerm?.name || "",
      termId: currentTerm?.id || "",
      optional: false,
      dueDate: "",
      selectedFeeStructure: ""
    })
  }

  const handleAcademicYearChange = (yearId: string) => {
    const selectedYear = academicYears.find(y => y.id === yearId)
    if (selectedYear) {
      setFeeForm({
        ...feeForm,
        academicYear: selectedYear.name,
        academicYearId: yearId,
        term: "", // Reset term when year changes
        termId: ""
      })
    }
  }

  const handleTermChange = (termId: string) => {
    const selectedTerm = terms.find(t => t.id === termId)
    if (selectedTerm) {
      setFeeForm({
        ...feeForm,
        term: selectedTerm.name,
        termId: termId
      })
    }
  }

  const handleFeeStructureChange = (structureId: string) => {
    const selectedStructure = feeStructures.find(s => s.id === structureId)
    if (selectedStructure) {
      setFeeForm({
        ...feeForm,
        selectedFeeStructure: structureId,
        gradeLevel: selectedStructure.level
      })
    }
  }

  const totalStudents = students.length
  const totalCollected = students.reduce((sum: number, student: any) => sum + (student.paidAmount || 0), 0)
  const totalOutstanding = students.reduce((sum: number, student: any) => sum + (student.pendingAmount || 0), 0)
  const overdueCount = students.filter((s: any) => s.paymentStatus === 'overdue').length

  if (studentsLoading || classesLoading || academicYearsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Fees Management</h2>
          <p className="text-muted-foreground">Track and manage student fee payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          {/* Add Fee Dialog */}
          <Dialog open={showAddFeeDialog} onOpenChange={setShowAddFeeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <DollarSign className="mr-2 h-4 w-4" />
                Add Fee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Fee</DialogTitle>
                <DialogDescription>Create a new fee type for students to pay</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Fee Structure Selection */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-blue-700 font-medium">Quick Setup from Fee Structure</Label>
                    <div className="text-xs text-blue-600">Optional - Auto-creates multiple fees</div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Select Fee Structure</Label>
                      <Select 
                        value={feeForm.selectedFeeStructure} 
                        onValueChange={handleFeeStructureChange}
                        disabled={feeStructuresLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={feeStructuresLoading ? "Loading..." : "Choose a fee structure"} />
                        </SelectTrigger>
                        <SelectContent>
                          {feeStructures.map((structure: any) => (
                            <SelectItem key={structure.id} value={structure.id}>
                              {structure.className} - {structure.level} (GH₵{structure.totalFee?.toLocaleString() || 0})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {feeForm.selectedFeeStructure && (
                      <div>
                        <Label>Preview</Label>
                        <div className="text-sm space-y-2">
                          {(() => {
                            const selectedStructure = feeStructures.find(s => s.id === feeForm.selectedFeeStructure)
                            if (!selectedStructure) return null
                            return (
                              <div className="p-3 bg-gray-50 rounded border">
                                <div className="font-medium text-gray-800 mb-2">
                                  {selectedStructure.className} Complete Fee Structure
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Total Amount:</span>
                                  <span className="font-bold text-blue-600 text-lg">
                                    GH₵{(selectedStructure.totalFee || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                                  <div className="grid grid-cols-2 gap-1">
                                    {[
                                      { name: "Tuition", amount: selectedStructure.tuitionFee },
                                      { name: "Activities", amount: selectedStructure.activitiesFee },
                                      { name: "Examination", amount: selectedStructure.examinationFee },
                                      { name: "Library", amount: selectedStructure.libraryFee },
                                      { name: "Laboratory", amount: selectedStructure.laboratoryFee },
                                      { name: "Transport", amount: selectedStructure.transportFee }
                                    ].filter(fee => (fee.amount || 0) > 0).map(fee => (
                                      <div key={fee.name} className="flex justify-between">
                                        <span>{fee.name}:</span>
                                        <span>₵{(fee.amount || 0).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          })()
                          }
                        </div>
                      </div>
                    )}
                  </div>
                  {feeForm.selectedFeeStructure && (
                    <div className="mt-3 text-xs text-blue-600">
                      💡 This will create a single fee type for {feeStructures.find(s => s.id === feeForm.selectedFeeStructure)?.className} 
                      with the total amount, linked to the fee structure for easy tracking.
                    </div>
                  )}
                </div>

                {/* Manual Fee Creation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <span className="text-sm text-gray-500">OR create a single fee manually</span>
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Fee Name *</Label>
                      <Input 
                        placeholder="e.g., Tuition Fee, Library Fee"
                        value={feeForm.name}
                        onChange={(e) => setFeeForm({...feeForm, name: e.target.value})}
                        disabled={!!feeForm.selectedFeeStructure}
                      />
                    </div>
                    <div>
                      <Label>Amount (GH₵) *</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00"
                        value={feeForm.amount || ""}
                        onChange={(e) => setFeeForm({...feeForm, amount: parseFloat(e.target.value) || 0})}
                        disabled={!!feeForm.selectedFeeStructure}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Brief description of the fee..."
                      value={feeForm.description}
                      onChange={(e) => setFeeForm({...feeForm, description: e.target.value})}
                      disabled={!!feeForm.selectedFeeStructure}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Frequency *</Label>
                    <Select value={feeForm.frequency} onValueChange={(value) => 
                      setFeeForm({...feeForm, frequency: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="One-time">One-time</SelectItem>
                        <SelectItem value="Term">Per Term</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Academic Year *</Label>
                    <Select 
                      value={feeForm.academicYearId} 
                      onValueChange={handleAcademicYearChange}
                      disabled={academicYearsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={academicYearsLoading ? "Loading..." : "Select academic year"} />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year: any) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name} {year.isCurrent && '(Current)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Term *</Label>
                    <Select 
                      value={feeForm.termId} 
                      onValueChange={handleTermChange}
                      disabled={termsLoading || !feeForm.academicYearId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !feeForm.academicYearId 
                            ? "Select academic year first" 
                            : termsLoading 
                            ? "Loading..." 
                            : "Select term"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map((term: any) => (
                          <SelectItem key={term.id} value={term.id}>
                            {term.name} {term.isCurrent && '(Current)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Grade Level (Optional)</Label>
                    <Select 
                      value={feeForm.gradeLevel} 
                      onValueChange={(value) => setFeeForm({...feeForm, gradeLevel: value})}
                      disabled={!!feeForm.selectedFeeStructure}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {gradeLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date (Optional)</Label>
                    <Input 
                      type="date"
                      value={feeForm.dueDate}
                      onChange={(e) => setFeeForm({...feeForm, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="optional"
                    checked={feeForm.optional}
                    onCheckedChange={(checked) => setFeeForm({...feeForm, optional: !!checked})}
                    disabled={!!feeForm.selectedFeeStructure}
                  />
                  <Label htmlFor="optional">This is an optional fee</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowAddFeeDialog(false)
                  resetFeeForm()
                  setIsCreatingFromStructure(false)
                }}>
                  Cancel
                </Button>
                {feeForm.selectedFeeStructure ? (
                  <Button 
                    onClick={handleCreateFeesFromStructure} 
                    disabled={isCreatingFromStructure || !feeForm.selectedFeeStructure}
                  >
                    {isCreatingFromStructure ? "Creating Fee..." : "Create Fee from Structure"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCreateFee} 
                    disabled={isRecording || !feeForm.name || !feeForm.amount}
                  >
                    {isRecording ? "Creating..." : "Create Fee"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Payment Dialog */}
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>Add a new fee payment for a student</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Student *</Label>
                  <Select value={paymentForm.studentId} onValueChange={handleStudentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student: any) => (
                        <SelectItem key={student.student.id} value={student.student.id}>
                          {student.student.firstName} {student.student.lastName} - {student.student.studentId} ({student.student.currentGradeLevel || 'No Class'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStudentInfo && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <span className="font-medium">Selected:</span> {selectedStudentInfo.student.firstName} {selectedStudentInfo.student.lastName} 
                      <span className="text-blue-600">({selectedStudentInfo.student.currentGradeLevel || 'No Grade Level'})</span>
                      <br />
                      <span className="text-xs text-gray-600">
                        Outstanding: GH₵{(selectedStudentInfo.pendingAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Fee Type *</Label>
                  <Select 
                    value={paymentForm.feeTypeId} 
                    onValueChange={(value) => {
                      const selectedFee = applicableFeeTypes.find((f: any) => f.id === value)
                      setPaymentForm({
                        ...paymentForm, 
                        feeTypeId: value,
                        amount: selectedFee?.amount || 0
                      })
                    }}
                    disabled={!paymentForm.studentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !paymentForm.studentId 
                          ? "Select student first" 
                          : applicableFeeTypes.length === 0 
                          ? "No applicable fees found" 
                          : "Select fee type"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {applicableFeeTypes.map((fee: any) => (
                        <SelectItem key={fee.id} value={fee.id}>
                          {fee.name} - GH₵{fee.amount?.toLocaleString()}
                          {fee.gradeLevel && fee.gradeLevel !== 'all' && (
                            <span className="text-xs text-gray-500 ml-2">({fee.gradeLevel})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {paymentForm.studentId && applicableFeeTypes.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ No applicable fees found for this student&apos;s grade level in the current academic period.
                    </p>
                  )}
                  {applicableFeeTypes.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ {applicableFeeTypes.length} applicable fee{applicableFeeTypes.length !== 1 ? 's' : ''} found
                    </p>
                  )}
                </div>
                <div>
                  <Label>Amount (GH₵)</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={paymentForm.amount || ""}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})}
                  />
                  {paymentForm.feeTypeId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected: GH₵{applicableFeeTypes.find((f: any) => f.id === paymentForm.feeTypeId)?.amount?.toLocaleString() || 0}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentForm.paymentMethod} onValueChange={(value) => 
                    setPaymentForm({...paymentForm, paymentMethod: value})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile-money">Mobile Money</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input 
                    placeholder="Payment reference"
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Additional notes..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowPaymentDialog(false)
                  setPaymentForm({
                    studentId: "",
                    feeTypeId: "",
                    amount: 0,
                    paymentMethod: "",
                    transactionId: "",
                    notes: ""
                  })
                  setApplicableFeeTypes([])
                  setSelectedStudentInfo(null)
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRecordPayment} 
                  disabled={isRecording || !paymentForm.studentId || !paymentForm.feeTypeId || !paymentForm.amount}
                >
                  {isRecording ? "Recording..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fees Collected</p>
                <p className="text-2xl font-bold text-green-600">GH₵{totalCollected.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">GH₵{totalOutstanding.toLocaleString()}</p>
              </div>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-amber-600">{overdueCount}</p>
              </div>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedGradeLevel} onValueChange={setSelectedGradeLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Grade Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grade Levels</SelectItem>
                {gradeLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.name || ''}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Students Fee Status</CardTitle>
            {selectedStudents.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Send Reminder ({selectedStudents.length})
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total Fees</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((studentData: any) => {
                  const student = studentData.student;
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => handleSelectStudent(student.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                            <div className="text-xs text-muted-foreground">{student.studentId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.currentClass || student.currentGradeLevel || 'Not Enrolled'}</TableCell>
                      <TableCell>GH₵{(studentData.totalFees || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">GH₵{(studentData.paidAmount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">GH₵{(studentData.pendingAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(studentData.paymentStatus || 'unpaid')}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(studentData.paymentStatus || 'unpaid')}
                            {(studentData.paymentStatus || 'unpaid').charAt(0).toUpperCase() + (studentData.paymentStatus || 'unpaid').slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {studentData.lastPayment ? new Date(studentData.lastPayment).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedStudent(studentData)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Student Fee Details</DialogTitle>
                                <DialogDescription>
                                  Complete fee information for {student.firstName} {student.lastName}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedStudent && (
                                <div className="space-y-6">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                      <Label className="text-sm font-medium">Student Information</Label>
                                      <div className="mt-2 space-y-2">
                                        <p><span className="font-medium">Name:</span> {selectedStudent.student.firstName} {selectedStudent.student.lastName}</p>
                                        <p><span className="font-medium">ID:</span> {selectedStudent.student.studentId}</p>
                                        <p><span className="font-medium">Class:</span> {selectedStudent.student.currentGradeLevel || 'N/A'}</p>
                                        <p><span className="font-medium">Status:</span> {selectedStudent.student.status}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Payment Summary</Label>
                                      <div className="mt-2 space-y-2">
                                        <p><span className="font-medium">Total Fees:</span> GH₵{(selectedStudent.totalFees || 0).toLocaleString()}</p>
                                        <p><span className="font-medium text-green-600">Paid:</span> GH₵{(selectedStudent.paidAmount || 0).toLocaleString()}</p>
                                        <p><span className="font-medium text-red-600">Outstanding:</span> GH₵{(selectedStudent.pendingAmount || 0).toLocaleString()}</p>
                                        <p><span className="font-medium">Last Payment:</span> {selectedStudent.lastPayment ? new Date(selectedStudent.lastPayment).toLocaleDateString() : "Never"}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
