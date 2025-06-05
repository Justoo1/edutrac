"use client"

import { useState } from "react"
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
    academicYear: "2023-2024",
    term: "First Term",
    optional: false,
    dueDate: ""
  })

  // Fetch data
  const { students, isLoading: studentsLoading, mutate } = useStudentFees(schoolId)
  const { classes, isLoading: classesLoading } = useClasses(schoolId)
  const { feeTypes, mutate: mutateFeeTypes } = useFeeTypes(schoolId, {
    academicYear: feeForm.academicYear,
    term: feeForm.term
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

  // Filter students based on search and selected filters
  const filteredStudents = students.filter((student: any) => {
    const matchesSearch = student.student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Get the student's current class info
    const studentClass = student.student.currentClass || student.student.currentGradeLevel
    
    const matchesClass = selectedClass === "all" || 
      (studentClass && studentClass.includes(selectedClass))
    
    const matchesGradeLevel = selectedGradeLevel === "all" || 
      (studentClass && studentClass.includes(selectedGradeLevel))
    
    const matchesStatus = selectedStatus === "all" || student.paymentStatus === selectedStatus
    
    return matchesSearch && matchesClass && matchesGradeLevel && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 border-green-200"
      case "partial": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "overdue": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="h-4 w-4" />
      case "partial": return <Clock className="h-4 w-4" />
      case "overdue": return <AlertTriangle className="h-4 w-4" />
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
      await recordPayment({
        ...paymentForm,
        academicYear: "2023-2024", // Get current academic year
        term: "First Term" // Get current term
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
      mutate() // Refresh data
    } catch (error) {
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
      setFeeForm({
        name: "",
        description: "",
        amount: 0,
        frequency: "Term",
        gradeLevel: "",
        academicYear: "2023-2024",
        term: "First Term",
        optional: false,
        dueDate: ""
      })
      mutateFeeTypes() // Refresh fee types
    } catch (error) {
      toast.error("Failed to create fee")
    }
  }

  const totalStudents = students.length
  const totalCollected = students.reduce((sum: number, student: any) => sum + (student.paidAmount || 0), 0)
  const totalOutstanding = students.reduce((sum: number, student: any) => sum + (student.pendingAmount || 0), 0)
  const overdueCount = students.filter((s: any) => s.paymentStatus === 'overdue').length

  if (studentsLoading || classesLoading) {
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Fee</DialogTitle>
                <DialogDescription>Create a new fee type for students to pay</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Fee Name *</Label>
                    <Input 
                      placeholder="e.g., Tuition Fee, Library Fee"
                      value={feeForm.name}
                      onChange={(e) => setFeeForm({...feeForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Amount (GH₵) *</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={feeForm.amount || ""}
                      onChange={(e) => setFeeForm({...feeForm, amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Brief description of the fee..."
                    value={feeForm.description}
                    onChange={(e) => setFeeForm({...feeForm, description: e.target.value})}
                  />
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
                    <Select value={feeForm.academicYear} onValueChange={(value) => 
                      setFeeForm({...feeForm, academicYear: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023-2024">2023-2024</SelectItem>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Term *</Label>
                    <Select value={feeForm.term} onValueChange={(value) => 
                      setFeeForm({...feeForm, term: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Term">First Term</SelectItem>
                        <SelectItem value="Second Term">Second Term</SelectItem>
                        <SelectItem value="Third Term">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Grade Level (Optional)</Label>
                    <Select value={feeForm.gradeLevel} onValueChange={(value) => 
                      setFeeForm({...feeForm, gradeLevel: value})
                    }>
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
                  />
                  <Label htmlFor="optional">This is an optional fee</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddFeeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFee} disabled={isRecording || !feeForm.name || !feeForm.amount}>
                  {isRecording ? "Creating..." : "Create Fee"}
                </Button>
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>Add a new fee payment for a student</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Student</Label>
                  <Select value={paymentForm.studentId} onValueChange={(value) => 
                    setPaymentForm({...paymentForm, studentId: value})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student: any) => (
                        <SelectItem key={student.student.id} value={student.student.id}>
                          {student.student.firstName} {student.student.lastName} - {student.student.studentId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fee Type</Label>
                  <Select value={paymentForm.feeTypeId} onValueChange={(value) => {
                    const selectedFee = feeTypes.find((f:any ) => f.id === value)
                    setPaymentForm({
                      ...paymentForm, 
                      feeTypeId: value,
                      amount: selectedFee?.amount || 0
                    })
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeTypes.map((fee: any) => (
                        <SelectItem key={fee.id} value={fee.id}>
                          {fee.name} - GH₵{fee.amount}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      Expected: GH₵{feeTypes.find((f: { id: string; amount: number }) => f.id === paymentForm.feeTypeId)?.amount || 0}
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
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRecordPayment} disabled={isRecording}>
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
                      <TableCell>{student.currentGradeLevel || student.currentClass || 'N/A'}</TableCell>
                      <TableCell>GH₵{(studentData.totalFees || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">GH₵{(studentData.paidAmount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">GH₵{(studentData.pendingAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(studentData.paymentStatus || 'overdue')}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(studentData.paymentStatus || 'overdue')}
                            {(studentData.paymentStatus || 'overdue').charAt(0).toUpperCase() + (studentData.paymentStatus || 'overdue').slice(1)}
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
