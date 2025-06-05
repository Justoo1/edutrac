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
import { Search, Filter, Download, Plus, Edit, Eye, Send, Calendar, Users, DollarSign, CheckCircle2, Clock, AlertTriangle, Calculator } from "lucide-react"

// Mock data for staff and salaries
const staffData = [
  {
    id: "STF001",
    name: "Mrs. Akosua Mensah",
    position: "Mathematics Teacher",
    department: "Mathematics",
    avatar: "/placeholder.svg",
    phone: "+233 24 111 2222",
    email: "akosua.mensah@school.com",
    baseSalary: 3500,
    allowances: 800,
    deductions: 420,
    netSalary: 3880,
    paymentStatus: "paid",
    lastPayment: "2024-01-31",
    paymentMethod: "Bank Transfer",
    accountNumber: "****1234",
    joinDate: "2020-09-01",
    employeeType: "full-time"
  },
  {
    id: "STF002",
    name: "Mr. Kwame Adjei",
    position: "English Teacher",
    department: "English",
    avatar: "/placeholder.svg",
    phone: "+233 20 333 4444",
    email: "kwame.adjei@school.com",
    baseSalary: 3200,
    allowances: 650,
    deductions: 385,
    netSalary: 3465,
    paymentStatus: "pending",
    lastPayment: "2023-12-31",
    paymentMethod: "Mobile Money",
    accountNumber: "+233203334444",
    joinDate: "2019-01-15",
    employeeType: "full-time"
  },
  {
    id: "STF003",
    name: "Mrs. Ama Osei",
    position: "Science Teacher",
    department: "Science",
    avatar: "/placeholder.svg",
    phone: "+233 26 555 6666",
    email: "ama.osei@school.com",
    baseSalary: 3800,
    allowances: 900,
    deductions: 470,
    netSalary: 4230,
    paymentStatus: "paid",
    lastPayment: "2024-01-31",
    paymentMethod: "Bank Transfer",
    accountNumber: "****5678",
    joinDate: "2018-03-10",
    employeeType: "full-time"
  },
  {
    id: "STF004",
    name: "Mr. Kofi Boateng",
    position: "ICT Coordinator",
    department: "ICT",
    avatar: "/placeholder.svg",
    phone: "+233 24 777 8888",
    email: "kofi.boateng@school.com",
    baseSalary: 4200,
    allowances: 1000,
    deductions: 520,
    netSalary: 4680,
    paymentStatus: "processing",
    lastPayment: "2024-01-31",
    paymentMethod: "Bank Transfer",
    accountNumber: "****9012",
    joinDate: "2021-06-01",
    employeeType: "full-time"
  },
  {
    id: "STF005",
    name: "Mrs. Abena Asante",
    position: "Librarian",
    department: "Library",
    avatar: "/placeholder.svg",
    phone: "+233 20 999 0000",
    email: "abena.asante@school.com",
    baseSalary: 2800,
    allowances: 400,
    deductions: 280,
    netSalary: 2920,
    paymentStatus: "paid",
    lastPayment: "2024-01-31",
    paymentMethod: "Cash",
    accountNumber: "N/A",
    joinDate: "2017-11-20",
    employeeType: "part-time"
  }
]

const payrollHistory = [
  { month: "January 2024", totalPaid: 18175, staffCount: 5, status: "completed" },
  { month: "December 2023", totalPaid: 17890, staffCount: 5, status: "completed" },
  { month: "November 2023", totalPaid: 18175, staffCount: 5, status: "completed" },
  { month: "October 2023", totalPaid: 17650, staffCount: 4, status: "completed" },
]

export function StaffSalaryManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [showPayrollDialog, setShowPayrollDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  const filteredStaff = staffData.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || staff.department === selectedDepartment
    const matchesStatus = selectedStatus === "all" || staff.paymentStatus === selectedStatus
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 border-green-200"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "processing": return "bg-blue-100 text-blue-800 border-blue-200"
      case "overdue": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="h-4 w-4" />
      case "pending": return <Clock className="h-4 w-4" />
      case "processing": return <Calculator className="h-4 w-4" />
      case "overdue": return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleSelectAll = () => {
    if (selectedStaff.length === filteredStaff.length) {
      setSelectedStaff([])
    } else {
      setSelectedStaff(filteredStaff.map(s => s.id))
    }
  }

  const handleSelectStaff = (staffId: string) => {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId))
    } else {
      setSelectedStaff([...selectedStaff, staffId])
    }
  }

  const totalSalaryBudget = staffData.reduce((sum, staff) => sum + staff.netSalary, 0)
  const paidSalaries = staffData.filter(s => s.paymentStatus === 'paid').reduce((sum, staff) => sum + staff.netSalary, 0)
  const pendingSalaries = staffData.filter(s => s.paymentStatus === 'pending').reduce((sum, staff) => sum + staff.netSalary, 0)

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Salary Management</h2>
          <p className="text-muted-foreground">Manage staff salaries and payroll processing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Payroll
          </Button>
          <Dialog open={showPayrollDialog} onOpenChange={setShowPayrollDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Calculator className="mr-2 h-4 w-4" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Process Monthly Payroll</DialogTitle>
                <DialogDescription>
                  Process salaries for all staff members for the current month
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Pay Period</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pay period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feb-2024">February 2024</SelectItem>
                      <SelectItem value="jan-2024">January 2024</SelectItem>
                      <SelectItem value="dec-2023">December 2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <Input value={`GH₵${totalSalaryBudget.toLocaleString()}`} disabled />
                </div>
                <div>
                  <Label>Staff Count</Label>
                  <Input value={`${staffData.length} employees`} disabled />
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input type="date" defaultValue="2024-02-28" />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Payroll processing notes..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPayrollDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowPayrollDialog(false)}>
                  Process Payroll
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
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{staffData.length}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Budget</p>
                <p className="text-2xl font-bold">GH₵{totalSalaryBudget.toLocaleString()}</p>
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
                <p className="text-2xl font-bold text-green-600">GH₵{paidSalaries.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-amber-600">GH₵{pendingSalaries.toLocaleString()}</p>
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
                placeholder="Search staff by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="ICT">ICT</SelectItem>
                <SelectItem value="Library">Library</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Salary Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Staff Salary Overview</CardTitle>
            {selectedStaff.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Pay Selected ({selectedStaff.length})
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
                      checked={selectedStaff.length === filteredStaff.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStaff.includes(staff.id)}
                        onCheckedChange={() => handleSelectStaff(staff.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={staff.avatar} />
                          <AvatarFallback>
                            {staff.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-xs text-muted-foreground">{staff.position}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{staff.department}</TableCell>
                    <TableCell>GH₵{staff.baseSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">+GH₵{staff.allowances.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">-GH₵{staff.deductions.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">GH₵{staff.netSalary.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(staff.paymentStatus)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(staff.paymentStatus)}
                          {staff.paymentStatus.charAt(0).toUpperCase() + staff.paymentStatus.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {staff.lastPayment ? new Date(staff.lastPayment).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedEmployee(staff)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Staff Salary Details</DialogTitle>
                              <DialogDescription>
                                Complete salary information for {staff.name}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedEmployee && (
                              <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">Personal Information</Label>
                                    <div className="mt-2 space-y-2">
                                      <p><span className="font-medium">Name:</span> {selectedEmployee.name}</p>
                                      <p><span className="font-medium">ID:</span> {selectedEmployee.id}</p>
                                      <p><span className="font-medium">Position:</span> {selectedEmployee.position}</p>
                                      <p><span className="font-medium">Department:</span> {selectedEmployee.department}</p>
                                      <p><span className="font-medium">Email:</span> {selectedEmployee.email}</p>
                                      <p><span className="font-medium">Phone:</span> {selectedEmployee.phone}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Employment Details</Label>
                                    <div className="mt-2 space-y-2">
                                      <p><span className="font-medium">Join Date:</span> {new Date(selectedEmployee.joinDate).toLocaleDateString()}</p>
                                      <p><span className="font-medium">Employee Type:</span> {selectedEmployee.employeeType}</p>
                                      <p><span className="font-medium">Payment Method:</span> {selectedEmployee.paymentMethod}</p>
                                      <p><span className="font-medium">Account:</span> {selectedEmployee.accountNumber}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">Salary Breakdown</Label>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                      <span className="font-medium">Base Salary:</span>
                                      <span>GH₵{selectedEmployee.baseSalary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-green-50 rounded">
                                      <span className="font-medium text-green-700">Allowances:</span>
                                      <span className="text-green-700">+GH₵{selectedEmployee.allowances.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-red-50 rounded">
                                      <span className="font-medium text-red-700">Deductions:</span>
                                      <span className="text-red-700">-GH₵{selectedEmployee.deductions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-blue-50 rounded border-2 border-blue-200">
                                      <span className="font-bold text-blue-700">Net Salary:</span>
                                      <span className="font-bold text-blue-700">GH₵{selectedEmployee.netSalary.toLocaleString()}</span>
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
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payroll History</CardTitle>
          <CardDescription>Previous payroll processing records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payrollHistory.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{record.month}</p>
                    <p className="text-sm text-muted-foreground">{record.staffCount} staff members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">GH₵{record.totalPaid.toLocaleString()}</p>
                  <Badge variant="secondary" className="text-xs">
                    {record.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
