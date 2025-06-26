"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Search, Filter, Download, Plus, Edit, Eye, Trash, Receipt, ShoppingCart, Zap, Car, Book, Users, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react"

// Types for the expense data based on schema
interface Expense {
  expense: {
    id: string
    description: string
    category: string
    vendor: string
    department: string
    amount: number
    expenseDate: string
    paymentMethod?: string
    paymentReference?: string
    receiptUrl?: string
    status: string
    approvedAt?: string
    recordedBy: string
    notes?: string
    createdAt: string
    updatedAt: string
  }
  approver?: {
    id: string
    name: string
  } | null
}

interface ExpenseFormData {
  description: string
  category: string
  vendor: string
  department: string
  amount: number
  expenseDate: string
  paymentMethod?: string
  paymentReference?: string
  notes?: string
}

interface ExpenseManagementProps {
  schoolId?: string // Make it optional for now
}

const expenseCategories = [
  { name: "Utilities", icon: Zap, total: 0, count: 0 },
  { name: "Supplies", icon: ShoppingCart, total: 0, count: 0 },
  { name: "Maintenance", icon: Receipt, total: 0, count: 0 },
  { name: "Transport", icon: Car, total: 0, count: 0 },
  { name: "Educational Materials", icon: Book, total: 0, count: 0 },
]

export function ExpenseManagement({ schoolId = "test-school" }: ExpenseManagementProps) {
  // State management
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  
  // Dialog states
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: "",
    category: "",
    vendor: "",
    department: "",
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: "",
    paymentReference: "",
    notes: ""
  })

  // Edit form state
  const [editFormData, setEditFormData] = useState<ExpenseFormData>({
    description: "",
    category: "",
    vendor: "",
    department: "",
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: "",
    paymentReference: "",
    notes: ""
  })

  // Fetch expenses from API
  const fetchExpenses = useCallback(async () => {
    console.log('fetchExpenses called with schoolId:', schoolId)
    
    if (!schoolId) {
      console.log('No schoolId provided, skipping fetch')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const params = new URLSearchParams({ schoolId })
      
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory)
      }
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus)
      }
      
      console.log('Fetching expenses with params:', params.toString())
      
      const response = await fetch(`/api/finance/expenses?${params}`)
      console.log('Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('Error response:', errorText)
        throw new Error(`Failed to fetch expenses: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Fetched expenses data:', data)
      setExpenses(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [schoolId, selectedCategory, selectedStatus])

  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expense.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Calculate stats from real data
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.expense.amount, 0)
  const paidExpenses = expenses.filter(e => e.expense.status === 'paid').reduce((sum, expense) => sum + expense.expense.amount, 0)
  const pendingExpenses = expenses.filter(e => e.expense.status === 'pending').reduce((sum, expense) => sum + expense.expense.amount, 0)
  const rejectedExpenses = expenses.filter(e => e.expense.status === 'rejected').reduce((sum, expense) => sum + expense.expense.amount, 0)

  // Calculate category data with real expenses
  const getCategoryData = () => {
    return expenseCategories.map(category => {
      const categoryExpenses = expenses.filter(exp => exp.expense.category === category.name)
      const total = categoryExpenses.reduce((sum, exp) => sum + exp.expense.amount, 0)
      return {
        ...category,
        total,
        count: categoryExpenses.length
      }
    })
  }

  // Load expenses on component mount and when filters change
  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId) return
    
    setSubmitting(true)

    try {
      const response = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          schoolId,
          amount: Number(formData.amount),
          expenseDate: new Date(formData.expenseDate).toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create expense')
      }

      toast.success('Expense created successfully')
      setShowAddExpenseDialog(false)
      setFormData({
        description: "",
        category: "",
        vendor: "",
        department: "",
        amount: 0,
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: "",
        paymentReference: "",
        notes: ""
      })
      
      // Refresh expenses
      fetchExpenses()
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error('Failed to create expense')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle expense approval
  const handleApproveExpense = async (expenseId: string) => {
    try {
      toast.loading('Approving expense...')
      const response = await fetch('/api/finance/expenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expenseId,
          action: 'approve'
        }),
      })

      if (!response.ok) {
        toast.dismiss()
        throw new Error('Failed to approve expense')
      }
      toast.dismiss()
      toast.success('Expense approved successfully')
      fetchExpenses()
    } catch (error) {

      console.error('Error approving expense:', error)
      toast.error('Failed to approve expense')
    }
  }

  // Handle expense deletion
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return
    
    try {
      toast.loading('Deleting expense...')
      const response = await fetch('/api/finance/expenses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expenseId: expenseToDelete
        }),
      })

      if (!response.ok) {
        toast.dismiss()
        throw new Error('Failed to delete expense')
      }
      toast.dismiss()
      toast.success('Expense deleted successfully')
      setShowDeleteDialog(false)
      setExpenseToDelete(null)
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    }
  }

  // Handle opening edit dialog
  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense)
    setEditFormData({
      description: expense.expense.description,
      category: expense.expense.category,
      vendor: expense.expense.vendor,
      department: expense.expense.department,
      amount: expense.expense.amount,
      expenseDate: new Date(expense.expense.expenseDate).toISOString().split('T')[0],
      paymentMethod: expense.expense.paymentMethod || "",
      paymentReference: expense.expense.paymentReference || "",
      notes: expense.expense.notes || ""
    })
    setShowEditDialog(true)
  }

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseToEdit) return
    
    setSubmitting(true)

    try {
      const response = await fetch('/api/finance/expenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expenseId: expenseToEdit.expense.id,
          action: 'update',
          ...editFormData,
          amount: Number(editFormData.amount),
          expenseDate: new Date(editFormData.expenseDate).toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update expense')
      }

      toast.success('Expense updated successfully')
      setShowEditDialog(false)
      setExpenseToEdit(null)
      fetchExpenses()
    } catch (error) {
      console.error('Error updating expense:', error)
      toast.error('Failed to update expense')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 border-green-200"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved": return "bg-blue-100 text-blue-800 border-blue-200"
      case "rejected": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="h-4 w-4" />
      case "pending": return <Clock className="h-4 w-4" />
      case "approved": return <CheckCircle2 className="h-4 w-4" />
      case "rejected": return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Show different loading states
  if (!schoolId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No school selected</p>
          <p className="text-sm text-muted-foreground mt-2">Please select a school to view expenses</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground mt-2">Loading expenses...</p>
        </div>
      </div>
    )
  }

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
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense for the school</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Description *</Label>
                  <Input
                    placeholder="Expense description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Educational Materials">Educational Materials</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (GH₵) *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label>Vendor *</Label>
                  <Input
                    placeholder="Vendor name"
                    value={formData.vendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Academics">Academics</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Library">Library</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddExpenseDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Expense
                  </Button>
                </DialogFooter>
              </form>
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
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">GH₵{rejectedExpenses.toLocaleString()}</p>
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
            {getCategoryData().map((category) => {
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
                <SelectItem value="rejected">Rejected</SelectItem>
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
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {expenses.length === 0 ? "No expenses found. Add your first expense to get started." : "No expenses match your current search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.expense.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.expense.description}</div>
                          <div className="text-xs text-muted-foreground">{expense.expense.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{expense.expense.category}</TableCell>
                      <TableCell>{expense.expense.vendor}</TableCell>
                      <TableCell className="font-medium">GH₵{expense.expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(expense.expense.expenseDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(expense.expense.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(expense.expense.status)}
                            {expense.expense.status.charAt(0).toUpperCase() + expense.expense.status.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.expense.department}</TableCell>
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
                                  Complete information for expense {expense.expense.id}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedExpense && (
                                <div className="space-y-6">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                      <Label className="text-sm font-medium">Expense Information</Label>
                                      <div className="mt-2 space-y-2">
                                        <p><span className="font-medium">Description:</span> {selectedExpense.expense.description}</p>
                                        <p><span className="font-medium">ID:</span> {selectedExpense.expense.id}</p>
                                        <p><span className="font-medium">Category:</span> {selectedExpense.expense.category}</p>
                                        <p><span className="font-medium">Vendor:</span> {selectedExpense.expense.vendor}</p>
                                        <p><span className="font-medium">Department:</span> {selectedExpense.expense.department}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Payment Details</Label>
                                      <div className="mt-2 space-y-2">
                                        <p><span className="font-medium">Amount:</span> GH₵{selectedExpense.expense.amount.toLocaleString()}</p>
                                        <p><span className="font-medium">Date:</span> {new Date(selectedExpense.expense.expenseDate).toLocaleDateString()}</p>
                                        <p><span className="font-medium">Payment Method:</span> {selectedExpense.expense.paymentMethod || 'Not specified'}</p>
                                        <p><span className="font-medium">Status:</span> 
                                          <Badge className={`ml-2 ${getStatusColor(selectedExpense.expense.status)}`}>
                                            {selectedExpense.expense.status}
                                          </Badge>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {selectedExpense.expense.receiptUrl && (
                                    <div>
                                      <Label className="text-sm font-medium">Receipt</Label>
                                      <div className="mt-2 p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Receipt className="h-4 w-4" />
                                          <span className="text-sm">Receipt Available</span>
                                          <Button size="sm" variant="outline" className="ml-auto">
                                            <a href={selectedExpense.expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                                              Download
                                            </a>
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {selectedExpense.expense.notes && (
                                    <div>
                                      <Label className="text-sm font-medium">Notes</Label>
                                      <div className="mt-2 p-3 border rounded-lg">
                                        <p className="text-sm">{selectedExpense.expense.notes}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {expense.expense.status === "pending" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleApproveExpense(expense.expense.id)}
                              title="Approve expense"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {expense.expense.status === "pending" && (
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleEditExpense(expense)}
                              title="Edit expense"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {expense.expense.status === "pending" && (
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                setExpenseToDelete(expense.expense.id)
                                setShowDeleteDialog(true)
                              }}
                              title="Delete expense"
                            >
                              <Trash className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false)
                setExpenseToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteExpense}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the expense information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>Description *</Label>
              <Input
                placeholder="Expense description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={editFormData.category} onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Educational Materials">Educational Materials</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (GH₵) *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={editFormData.amount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <Label>Vendor *</Label>
              <Input
                placeholder="Vendor name"
                value={editFormData.vendor}
                onChange={(e) => setEditFormData(prev => ({ ...prev, vendor: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Department *</Label>
              <Select value={editFormData.department} onValueChange={(value) => setEditFormData(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Academics">Academics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Library">Library</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={editFormData.expenseDate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={editFormData.paymentMethod} onValueChange={(value) => setEditFormData(prev => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Reference</Label>
              <Input
                placeholder="Payment reference number"
                value={editFormData.paymentReference}
                onChange={(e) => setEditFormData(prev => ({ ...prev, paymentReference: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false)
                  setExpenseToEdit(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
