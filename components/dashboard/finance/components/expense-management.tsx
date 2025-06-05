"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Filter, Download, Plus, Edit, Eye, Trash, Receipt, ShoppingCart, Zap, Car, Book, Users, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

// Mock data for expenses
const expensesData = [
  {
    id: "EXP001",
    description: "Monthly Electricity Bill",
    category: "Utilities",
    amount: 2850,
    date: "2024-01-15",
    vendor: "ECG Ghana",
    status: "paid",
    paymentMethod: "Bank Transfer",
    approvedBy: "John Doe",
    receipt: "ECG_JAN_2024.pdf",
    department: "Administration"
  },
  {
    id: "EXP002",
    description: "Office Supplies - Stationery",
    category: "Supplies",
    amount: 450,
    date: "2024-01-20",
    vendor: "Office Mart",
    status: "pending",
    paymentMethod: "Cash",
    approvedBy: "Jane Smith",
    receipt: null,
    department: "Administration"
  },
  {
    id: "EXP003",
    description: "Laboratory Equipment Repair",
    category: "Maintenance",
    amount: 1200,
    date: "2024-01-18",
    vendor: "TechFix Solutions",
    status: "approved",
    paymentMethod: "Cheque",
    approvedBy: "Dr. Mensah",
    receipt: "TechFix_Invoice_001.pdf",
    department: "Science"
  },
  {
    id: "EXP004",
    description: "School Bus Fuel",
    category: "Transport",
    amount: 800,
    date: "2024-01-22",
    vendor: "Shell Ghana",
    status: "paid",
    paymentMethod: "Cash",
    approvedBy: "Transport Manager",
    receipt: "Shell_Receipt_456.jpg",
    department: "Transport"
  },
  {
    id: "EXP005",
    description: "Water Bill - January",
    category: "Utilities",
    amount: 650,
    date: "2024-01-10",
    vendor: "Ghana Water Company",
    status: "overdue",
    paymentMethod: "Bank Transfer",
    approvedBy: "Finance Manager",
    receipt: null,
    department: "Administration"
  },
  {
    id: "EXP006",
    description: "Library Books Purchase",
    category: "Educational Materials",
    amount: 3200,
    date: "2024-01-25",
    vendor: "Academic Publishers",
    status: "pending",
    paymentMethod: "Bank Transfer",
    approvedBy: "Librarian",
    receipt: "Academic_Invoice_789.pdf",
    department: "Library"
  }
]

const expenseCategories = [
  { name: "Utilities", icon: Zap, total: 3500, count: 2 },
  { name: "Supplies", icon: ShoppingCart, total: 450, count: 1 },
  { name: "Maintenance", icon: Receipt, total: 1200, count: 1 },
  { name: "Transport", icon: Car, total: 800, count: 1 },
  { name: "Educational Materials", icon: Book, total: 3200, count: 1 },
]

export function ExpenseManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false)

  const filteredExpenses = expensesData.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || expense.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 border-green-200"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved": return "bg-blue-100 text-blue-800 border-blue-200"
      case "overdue": return "bg-red-100 text-red-800 border-red-200"
      case "rejected": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="h-4 w-4" />
      case "pending": return <Clock className="h-4 w-4" />
      case "approved": return <CheckCircle2 className="h-4 w-4" />
      case "overdue": return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0)
  const paidExpenses = expensesData.filter(e => e.status === 'paid').reduce((sum, expense) => sum + expense.amount, 0)
  const pendingExpenses = expensesData.filter(e => e.status === 'pending').reduce((sum, expense) => sum + expense.amount, 0)
  const overdueExpenses = expensesData.filter(e => e.status === 'overdue').reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expense Management</h2>
          <p className="text-muted-foreground">Track and manage school expenses and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Dialog open={showAddExpenseDialog} onOpenChange={setShowAddExpenseDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense for the school</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Input placeholder="Expense description" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="educational">Educational Materials</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (GH₵)</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Input placeholder="Vendor name" />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administration">Administration</SelectItem>
                      <SelectItem value="academics">Academics</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="library">Library</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional notes..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddExpenseDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowAddExpenseDialog(false)}>
                  Add Expense
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
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">GH₵{totalExpenses.toLocaleString()}</p>
              </div>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">GH₵{paidExpenses.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">GH₵{pendingExpenses.toLocaleString()}</p>
              </div>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">GH₵{overdueExpenses.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
          <CardDescription>Breakdown of expenses by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {expenseCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <div key={category.name} className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">GH₵{category.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{category.count} items</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses by description, vendor, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Supplies">Supplies</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Educational Materials">Educational Materials</SelectItem>
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>All recorded expenses and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expense.description}</div>
                        <div className="text-xs text-muted-foreground">{expense.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.vendor}</TableCell>
                    <TableCell className="font-medium">GH₵{expense.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(expense.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(expense.status)}
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.department}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedExpense(expense)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Expense Details</DialogTitle>
                              <DialogDescription>
                                Complete information for expense {expense.id}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedExpense && (
                              <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">Expense Information</Label>
                                    <div className="mt-2 space-y-2">
                                      <p><span className="font-medium">Description:</span> {selectedExpense.description}</p>
                                      <p><span className="font-medium">ID:</span> {selectedExpense.id}</p>
                                      <p><span className="font-medium">Category:</span> {selectedExpense.category}</p>
                                      <p><span className="font-medium">Vendor:</span> {selectedExpense.vendor}</p>
                                      <p><span className="font-medium">Department:</span> {selectedExpense.department}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Payment Details</Label>
                                    <div className="mt-2 space-y-2">
                                      <p><span className="font-medium">Amount:</span> GH₵{selectedExpense.amount.toLocaleString()}</p>
                                      <p><span className="font-medium">Date:</span> {new Date(selectedExpense.date).toLocaleDateString()}</p>
                                      <p><span className="font-medium">Payment Method:</span> {selectedExpense.paymentMethod}</p>
                                      <p><span className="font-medium">Approved By:</span> {selectedExpense.approvedBy}</p>
                                      <p><span className="font-medium">Status:</span> 
                                        <Badge className={`ml-2 ${getStatusColor(selectedExpense.status)}`}>
                                          {selectedExpense.status}
                                        </Badge>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {selectedExpense.receipt && (
                                  <div>
                                    <Label className="text-sm font-medium">Receipt</Label>
                                    <div className="mt-2 p-3 border rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        <span className="text-sm">{selectedExpense.receipt}</span>
                                        <Button size="sm" variant="outline" className="ml-auto">
                                          Download
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button size="icon" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Trash className="h-4 w-4" />
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
    </div>
  )
}
