"use client"

import { useState } from "react"
import { useSchool } from "@/hooks/useSchool"
import { useStaffSalaries, processSalaryPayment } from "@/hooks/finance/useStaffSalaries"
import { useStaff } from "@/hooks/useStaff"
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
import { Search, Filter, Download, Plus, Edit, Eye, Send, Calendar, Users, DollarSign, CheckCircle2, Clock, AlertTriangle, Calculator, Trash2, FileText, FileSpreadsheet } from "lucide-react"
import { exportPayrollToPDF, exportPayrollToCSV, exportPayrollToExcel, PayrollExportData } from "@/lib/payroll-export"
import { toast } from "sonner"

// Type definitions for payroll data
type PayrollSalary = {
  id: string
  staffId: string
  netSalary: number
  baseSalary: number
  allowances: number
  deductions: number
  payPeriod: string
  status: string
}

type PayrollStaff = {
  id: string
  name: string
  position: string
  department: string
}

type PayrollDetails = {
  salaries: Array<{
    salary: PayrollSalary
    staff: PayrollStaff
  }>
  summary: {
    totalStaff: number
    totalAmount: number
  }
}



export function StaffSalaryManagement() {
  const { school, loading: schoolLoading } = useSchool()
  const { staffData, payrollHistory, summary, loading, error, refetch } = useStaffSalaries(school?.id)
  const { staffMembers, loading: staffLoading, formatStaffDisplayName } = useStaff(school?.id)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [showPayrollDialog, setShowPayrollDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showAddSalaryDialog, setShowAddSalaryDialog] = useState(false)
  const [showEditSalaryDialog, setShowEditSalaryDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [selectedSalaryRecord, setSelectedSalaryRecord] = useState<any>(null)
  const [isDeletingSalary, setIsDeletingSalary] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [exportPayPeriod, setExportPayPeriod] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isEditingSalary, setIsEditingSalary] = useState(false)
  const [selectedPayPeriod, setSelectedPayPeriod] = useState('')
  const [payrollDetails, setPayrollDetails] = useState<PayrollDetails | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [payrollNotes, setPayrollNotes] = useState('')
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false)
  const [isSavingSalary, setIsSavingSalary] = useState(false)
  
  // Form state for Edit Staff Salary dialog
  const [editSalaryForm, setEditSalaryForm] = useState({
    baseSalary: '',
    allowances: '',
    deductions: '',
    paymentMethod: '',
    accountNumber: '',
    notes: ''
  })
  // Utility function to format date to YYYY-MM format
  const formatDateToPayPeriod = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  // Simple toast function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

  // Form state for Add Staff Salary dialog
  const [addSalaryForm, setAddSalaryForm] = useState({
    staffId: '',
    payPeriod: formatDateToPayPeriod(new Date()), // Default to current month
    baseSalary: '',
    allowances: '',
    deductions: '',
    paymentMethod: '',
    accountNumber: '',
    notes: ''
  })

  const filteredStaff = (staffData || []).filter(staff => {
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


  // Fetch payroll details when pay period changes
  const fetchPayrollDetails = async (payPeriod: string) => {
    if (!school?.id || !payPeriod) return
    
    try {
      const response = await fetch(`/api/finance/staff-salaries/process-payroll?schoolId=${school.id}&payPeriod=${payPeriod}`)
      if (!response.ok) {
        throw new Error('Failed to fetch payroll details')
      }
      const data: PayrollDetails = await response.json()
      setPayrollDetails(data)
    } catch (error) {
      console.error('Error fetching payroll details:', error)
      setPayrollDetails(null)
    }
  }

  // Handle pay period selection
  const handlePayPeriodChange = (date: string) => {
    if (date) {
      const payPeriod = formatDateToPayPeriod(new Date(date))
      setSelectedPayPeriod(payPeriod)
      fetchPayrollDetails(payPeriod)
    } else {
      setSelectedPayPeriod('')
      setPayrollDetails(null)
    }
  }

  const handleProcessPayroll = async () => {
    if (!school?.id || !selectedPayPeriod) {
      toast.error('Please select a pay period first')
      return
    }

    if (!payrollDetails || payrollDetails.summary?.totalStaff === 0) {
      toast.error('No pending salaries found for the selected period')
      return
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    setIsProcessingPayroll(true)
    try {
      const response = await fetch('/api/finance/staff-salaries/process-payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId: school.id,
          payPeriod: selectedPayPeriod,
          paymentMethod,
          notes: payrollNotes
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process payroll')
      }

      const result = await response.json()
      console.log('Payroll processed successfully:', result)
      
      // Reset states and close dialog
      setShowPayrollDialog(false)
      setSelectedPayPeriod('')
      setPayrollDetails(null)
      setPaymentMethod('bank_transfer')
      setPayrollNotes('')
      
      // Refresh the data
      await refetch()
      
      // Show success message
      toast.success(`Payroll processed successfully! ${result.processedCount} staff members paid.`)
    } catch (error) {
      console.error('Error processing payroll:', error)
      toast.error(`Error processing payroll: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessingPayroll(false)
    }
  }

  const handleAddSalaryFormChange = (field: string, value: string) => {
    setAddSalaryForm(prev => ({ ...prev, [field]: value }))
  }

  // const handleEditSalaryFormChange = (field: string, value: string) => {
  //   setEditSalaryForm(prev => ({ ...prev, [field]: value }))
  // }

  const handleEditSalarySubmit = async () => {
    if (!selectedSalaryRecord) return

    setIsEditingSalary(true)
    try {
      // Validate salary amounts
      const baseSalary = parseFloat(editSalaryForm.baseSalary) || 0
      const allowances = parseFloat(editSalaryForm.allowances) || 0
      const deductions = parseFloat(editSalaryForm.deductions) || 0

      if (baseSalary <= 0) {
        toast.error('Base salary must be greater than 0')
        return
      }

      if (deductions < 0 || allowances < 0) {
        toast.error('Allowances and deductions cannot be negative')
        return
      }

      // Prepare the update data
      const updateData = {
        baseSalary,
        allowances,
        deductions,
        paymentMethod: editSalaryForm.paymentMethod || 'bank_transfer',
        accountNumber: editSalaryForm.accountNumber || undefined,
        notes: editSalaryForm.notes || undefined
      }

      console.log('Updating salary with data:', updateData)

      // Make the API call
      const response = await fetch(`/api/finance/staff-salaries/${selectedSalaryRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update salary record')
      }

      const result = await response.json()
      console.log('Salary record updated:', result)
      
      // Reset form and close dialog
      resetEditSalaryForm()
      setShowEditSalaryDialog(false)
      setSelectedSalaryRecord(null)
      setSelectedEmployee(null)
      
      // Refresh the salary data
      await refetch()
      
      // Show success message
      toast.success('Salary record updated successfully!')
      
    } catch (error) {
      console.error('Error updating salary:', error)
      toast.error(`Error updating salary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsEditingSalary(false)
    }
  }

  const handleDeleteSalary = async () => {
    if (!selectedSalaryRecord) return

    setIsDeletingSalary(true)
    try {
      console.log({selectedSalaryRecord})

      // Make the API call
      const response = await fetch(`/api/finance/staff-salaries/${selectedSalaryRecord.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete salary record')
      }

      const result = await response.json()
      console.log('Salary record deleted:', result)
      
      // Close dialog and reset state
      setShowDeleteConfirmDialog(false)
      setSelectedSalaryRecord(null)
      setSelectedEmployee(null)
      
      // Refresh the salary data
      await refetch()
      
      // Show success message
      toast.success('Salary record deleted successfully!')
      
    } catch (error) {
      console.error('Error deleting salary:', error)
      toast.error(`Error deleting salary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeletingSalary(false)
    }
  }

  const resetEditSalaryForm = () => {
    setEditSalaryForm({
      baseSalary: '',
      allowances: '',
      deductions: '',
      paymentMethod: '',
      accountNumber: '',
      notes: ''
    })
  }

  const openEditDialog = (salary: any, staff: any) => {
    console.log({salary, staff})
    setSelectedSalaryRecord(salary)
    setSelectedEmployee(staff)
    setEditSalaryForm({
      baseSalary: salary.baseSalary?.toString() || '',
      allowances: salary.allowances?.toString() || '',
      deductions: salary.deductions?.toString() || '',
      paymentMethod: salary.paymentMethod || '',
      accountNumber: salary.accountNumber || '',
      notes: salary.notes || ''
    })
    setShowEditSalaryDialog(true)
  }

  const openDeleteDialog = (salary: any, staff: any) => {
    console.log({salary, staff})
    setSelectedSalaryRecord(salary)
    setSelectedEmployee(staff)
    setShowDeleteConfirmDialog(true)
  }

  const handleEditSalaryFormChange = (field: string, value: string) => {
    setEditSalaryForm(prev => ({ ...prev, [field]: value }))
  }



  const resetAddSalaryForm = () => {
    setAddSalaryForm({
      staffId: '',
      payPeriod: formatDateToPayPeriod(new Date()), // Default to current month
      baseSalary: '',
      allowances: '',
      deductions: '',
      paymentMethod: '',
      accountNumber: '',
      notes: ''
    })
  }



  const handleAddSalarySubmit = async () => {
    setIsSavingSalary(true)
    try {
      // Validate required fields
      if (!addSalaryForm.staffId || !addSalaryForm.payPeriod || !addSalaryForm.baseSalary) {
        toast.error('Please fill in all required fields')
        return
      }

      if (!school?.id) {
        toast.error('School information not available')
        return
      }

      // Validate salary amounts
      const baseSalary = parseFloat(addSalaryForm.baseSalary)
      const allowances = parseFloat(addSalaryForm.allowances) || 0
      const deductions = parseFloat(addSalaryForm.deductions) || 0

      if (baseSalary <= 0) {
        toast.error('Base salary must be greater than 0')
        return
      }

      if (deductions < 0 || allowances < 0) {
        toast.error('Allowances and deductions cannot be negative')
        return
      }

      // Prepare the data for the API call
      const salaryData = {
        staffId: addSalaryForm.staffId,
        schoolId: school.id,
        baseSalary,
        allowances,
        deductions,
        payPeriod: addSalaryForm.payPeriod,
        academicYear: addSalaryForm.payPeriod.split('-')[0],
        paymentMethod: addSalaryForm.paymentMethod || 'bank_transfer',
        accountNumber: addSalaryForm.accountNumber || undefined,
        notes: addSalaryForm.notes || undefined
      }

      console.log('Submitting salary data:', salaryData)

      // Make the API call
      const response = await fetch('/api/finance/staff-salaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salaryData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save salary record')
      }

      const result = await response.json()
      console.log('Salary record created:', result)
      
      // Reset form and close dialog
      resetAddSalaryForm()
      setShowAddSalaryDialog(false)
      
      // Refresh the salary data
      await refetch()
      
      // Show success message
      showToast('Salary record saved successfully!')
      
    } catch (error) {
      console.error('Error saving salary:', error)
      showToast(`Error saving salary: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setIsSavingSalary(false)
    }
  }

  const handleExportPayroll = async () => {
  if (!school) {
    showToast('School information not available', 'error')
    return
  }

  setIsExporting(true)
  try {
    let exportStaffData = filteredStaff;
    let exportSummary = summary;
    
    // If a specific pay period is selected, fetch data for that period from API
    if (exportPayPeriod) {
      const [year, month] = exportPayPeriod.split('-');
      const payPeriodFormatted = `${year}-${month}`;
      
      console.log('Export pay period:', exportPayPeriod);
      console.log('Formatted pay period:', payPeriodFormatted);
      // fetch(`/api/finance/staff-salaries/process-payroll?schoolId=${school.id}&payPeriod=${payPeriod}`)
      try {
        // Try to fetch from API (you might need to adjust this URL based on your actual API)
        const apiUrl = `/api/finance/staff-salaries/process-payroll/paid?schoolId=${school.id}&payPeriod=${exportPayPeriod}`;
        console.log('API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('API response:', response);
        
        if (response.ok) {
          const periodData = await response.json();
          console.log('Period data received from API:', periodData);
          
          if (periodData.staffData && periodData.summary) {
            exportStaffData = periodData.staffData;
            exportSummary = periodData.summary || summary;
            console.log('Using API data:', exportStaffData.length, 'staff records');
          } else {
            console.log('No staff data in API response');
            showToast(`No salary data found for ${payPeriodFormatted} status code: ${response.status}`, 'error');
            return;
          }
        } else {
          // If API doesn't work, just use current data but warn user
          console.log('API call failed, using current data');
          showToast(`Using current data (API unavailable for ${payPeriodFormatted})`, 'error');
          return;
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        // If API fails, use current data but warn user
        showToast(`Using current data (unable to fetch ${payPeriodFormatted} specific data)`, 'error');
        return ;
      }
    }
    
    // Filter by selected staff if any
    if (selectedStaff.length > 0) {
      exportStaffData = exportStaffData.filter(staff => selectedStaff.includes(staff.id));
      console.log('Filtered by selected staff:', exportStaffData.length, 'records');
    }
    
    // Check if we have data to export
    if (exportStaffData.length === 0) {
      showToast('No data available for the selected criteria', 'error');
      return;
    }

    console.log('Final export data:', exportStaffData, 'staff records');
    console.log('Final export data:', exportSummary, 'Summary');

    // Prepare export data
    const exportData: PayrollExportData = {
      staffData: exportStaffData,
      school,
      summary: exportSummary,
      payPeriod: exportPayPeriod || undefined,
      selectedStaff: selectedStaff.length > 0 ? selectedStaff : undefined
    }

    // Export based on selected format
    switch (exportFormat) {
      case 'pdf':
        exportPayrollToPDF(exportData)
        break
      case 'csv':
        exportPayrollToCSV(exportData)
        break
      case 'excel':
        await exportPayrollToExcel(exportData)
        break
      default:
        throw new Error('Invalid export format')
    }

    setShowExportDialog(false)
    setExportFormat('pdf')
    setExportPayPeriod('')
    
    const periodText = exportPayPeriod ? ` for ${exportPayPeriod}` : '';
    showToast(`Payroll exported successfully as ${exportFormat.toUpperCase()}${periodText}!`)
    
  } catch (error) {
    console.error('Error exporting payroll:', error)
    showToast(`Error exporting payroll: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
  } finally {
    setIsExporting(false)
  }
}

  // We'll handle empty data in the main component layout
  if (schoolLoading || loading || staffLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading staff salary data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading staff salary data: {error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Get unique departments for filter
  const departments = Array.from(new Set((staffData || []).map(staff => staff.department).filter(Boolean)))

  const { totalStaff, totalSalaryBudget, paidSalaries, pendingSalaries } = summary
  
  // Show zeros when no data is available
  const safeStaffCount = totalStaff || 0
  const safeTotalBudget = totalSalaryBudget || 0
  const safePaidSalaries = paidSalaries || 0
  const safePendingSalaries = pendingSalaries || 0

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Salary Management</h2>
          <p className="text-muted-foreground">Manage staff salaries and payroll processing</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddSalaryDialog} onOpenChange={(open) => {
            if (!open) resetAddSalaryForm()
            setShowAddSalaryDialog(open)
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Staff Salary
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Staff Salary Record</DialogTitle>
                <DialogDescription>
                  Add salary information for a staff member
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Staff Member <span className="text-red-500">*</span></Label>
                    <Select value={addSalaryForm.staffId} onValueChange={(value) => handleAddSalaryFormChange('staffId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={staffLoading ? "Loading staff..." : "Select staff member"} />
                      </SelectTrigger>
                      <SelectContent>
                        {staffLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading staff members...
                          </SelectItem>
                        ) : staffMembers.length > 0 ? (
                          staffMembers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {formatStaffDisplayName(staff)}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-staff" disabled>
                            No staff members available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pay Period <span className="text-red-500">*</span></Label>
                    <Input 
                      type="month" 
                      value={addSalaryForm.payPeriod ? `${addSalaryForm.payPeriod.split('-')[0]}-${addSalaryForm.payPeriod.split('-')[1]}` : ''}
                      onChange={(e) => {
                        // Convert month input (YYYY-MM) to our format (YYYY-MM)
                        const selectedDate = e.target.value
                        if (selectedDate) {
                          const [year, month] = selectedDate.split('-')
                          const payPeriod = `${year}-${month}`
                          handleAddSalaryFormChange('payPeriod', payPeriod)
                        } else {
                          handleAddSalaryFormChange('payPeriod', '')
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Select the month and year for this salary record
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Salary (GH₵)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={addSalaryForm.baseSalary}
                      onChange={(e) => handleAddSalaryFormChange('baseSalary', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Allowances (GH₵)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={addSalaryForm.allowances}
                      onChange={(e) => handleAddSalaryFormChange('allowances', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Deductions (GH₵)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={addSalaryForm.deductions}
                      onChange={(e) => handleAddSalaryFormChange('deductions', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={addSalaryForm.paymentMethod} onValueChange={(value) => handleAddSalaryFormChange('paymentMethod', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Account Number (Optional)</Label>
                  <Input 
                    placeholder="Account number or mobile money number"
                    value={addSalaryForm.accountNumber}
                    onChange={(e) => handleAddSalaryFormChange('accountNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea 
                    placeholder="Additional notes..."
                    value={addSalaryForm.notes}
                    onChange={(e) => handleAddSalaryFormChange('notes', e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  resetAddSalaryForm()
                  setShowAddSalaryDialog(false)
                }} disabled={isSavingSalary}>
                  Cancel
                </Button>
                <Button onClick={handleAddSalarySubmit} disabled={isSavingSalary}>
                  {isSavingSalary ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Salary Record'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Export Payroll Report</DialogTitle>
                <DialogDescription>
                  Choose export format and options for your payroll report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF Report
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV File
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel File
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pay Period (Optional)</Label>
                  <Input
                    type="month"
                    value={exportPayPeriod}
                    onChange={(e) => setExportPayPeriod(e.target.value)}
                    placeholder="Select pay period"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to export current view data, or select a specific month to export salary data for that period only
                  </p>
                </div>
                {selectedStaff.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Only {selectedStaff.length} selected staff member(s) will be exported.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowExportDialog(false)
                    setExportFormat('pdf')
                    setExportPayPeriod('')
                  }} 
                  disabled={isExporting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleExportPayroll} 
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export {exportFormat.toUpperCase()}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showPayrollDialog} onOpenChange={(open) => {
            if (!open) {
              // Reset states when closing
              setSelectedPayPeriod('')
              setPayrollDetails(null)
              setPaymentMethod('bank_transfer')
              setPayrollNotes('')
            }
            setShowPayrollDialog(open)
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Calculator className="mr-2 h-4 w-4" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Process Monthly Payroll</DialogTitle>
                <DialogDescription>
                  Select a pay period and process salaries for all pending staff members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Pay Period</Label>
                  <Input
                    type="month"
                    value={selectedPayPeriod ? `${selectedPayPeriod.split('-')[0]}-${selectedPayPeriod.split('-')[1]}` : ''}
                    onChange={(e) => handlePayPeriodChange(e.target.value + '-01')}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Select the month and year for payroll processing
                  </p>
                </div>

                {payrollDetails && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Payroll Summary for {selectedPayPeriod}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Staff Count</Label>
                        <p className="text-lg font-bold">{payrollDetails.summary?.totalStaff || 0} employees</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Total Amount</Label>
                        <p className="text-lg font-bold">GH₵{payrollDetails.summary?.totalAmount?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                    
                    {payrollDetails.salaries && payrollDetails.salaries.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium">Pending Staff:</Label>
                        <div className="max-h-32 overflow-y-auto mt-2">
                          {payrollDetails.salaries.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm py-1">
                              <span>{item.staff.name}</span>
                              <span>GH₵{item.salary.netSalary.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedPayPeriod && payrollDetails && payrollDetails.summary?.totalStaff === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800">No pending salaries found for {selectedPayPeriod}</p>
                  </div>
                )}

                {payrollDetails && payrollDetails.summary?.totalStaff && payrollDetails.summary.totalStaff > 0 && (
                  <>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes (Optional)</Label>
                      <Textarea 
                        placeholder="Payroll processing notes..."
                        value={payrollNotes}
                        onChange={(e) => setPayrollNotes(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedPayPeriod('')
                    setPayrollDetails(null)
                    setPaymentMethod('bank_transfer')
                    setPayrollNotes('')
                    setShowPayrollDialog(false)
                  }} 
                  disabled={isProcessingPayroll}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleProcessPayroll} 
                  disabled={isProcessingPayroll || !payrollDetails || payrollDetails.summary?.totalStaff === 0}
                >
                  {isProcessingPayroll ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    `Process Payroll (${payrollDetails?.summary?.totalStaff || 0} staff)`
                  )}
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
                <p className="text-2xl font-bold">{safeStaffCount}</p>
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
                <p className="text-2xl font-bold">GH₵{safeTotalBudget.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-green-600">GH₵{safePaidSalaries.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-amber-600">GH₵{safePendingSalaries.toLocaleString()}</p>
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
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => (
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
                                title="View Details"
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
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => openEditDialog(staff, staff)}
                            disabled={staff.paymentStatus === 'paid'}
                            title={staff.paymentStatus === 'paid' ? 'Cannot edit paid salary' : 'Edit salary'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => openDeleteDialog(staff, staff)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete salary record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        {searchTerm || selectedDepartment !== "all" || selectedStatus !== "all" ? (
                          // Filtered empty state
                          <>
                            <Search className="h-12 w-12 text-muted-foreground" />
                            <div className="space-y-2">
                              <p className="text-lg font-medium">No matches found</p>
                              <p className="text-muted-foreground">
                                No staff members match your current filters.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchTerm("")
                                setSelectedDepartment("all")
                                setSelectedStatus("all")
                              }}
                            >
                              Clear Filters
                            </Button>
                          </>
                        ) : (
                          // No data empty state
                          <>
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                              <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-lg font-medium">No Staff Salary Records</p>
                              <p className="text-muted-foreground max-w-md">
                                Start by adding salary information for your staff members or import existing payroll data.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setShowAddSalaryDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Staff Salary
                              </Button>
                              <Button variant="outline" size="sm" onClick={refetch}>
                                <Search className="mr-2 h-4 w-4" />
                                Refresh Data
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
            {payrollHistory && payrollHistory.length > 0 ? (
              payrollHistory.map((record, index) => (
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
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payroll history available yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Salary Dialog */}
      <Dialog open={showEditSalaryDialog} onOpenChange={(open) => {
        if (!open) {
          resetEditSalaryForm()
          setSelectedSalaryRecord(null)
          setSelectedEmployee(null)
        }
        setShowEditSalaryDialog(open)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Salary Record</DialogTitle>
            <DialogDescription>
              Edit salary information for {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Base Salary (GH₵) <span className="text-red-500">*</span></Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={editSalaryForm.baseSalary}
                  onChange={(e) => handleEditSalaryFormChange('baseSalary', e.target.value)}
                />
              </div>
              <div>
                <Label>Allowances (GH₵)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={editSalaryForm.allowances}
                  onChange={(e) => handleEditSalaryFormChange('allowances', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Deductions (GH₵)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={editSalaryForm.deductions}
                  onChange={(e) => handleEditSalaryFormChange('deductions', e.target.value)}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={editSalaryForm.paymentMethod} onValueChange={(value) => handleEditSalaryFormChange('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Account Number (Optional)</Label>
              <Input 
                placeholder="Account number or mobile money number"
                value={editSalaryForm.accountNumber}
                onChange={(e) => handleEditSalaryFormChange('accountNumber', e.target.value)}
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea 
                placeholder="Additional notes..."
                value={editSalaryForm.notes}
                onChange={(e) => handleEditSalaryFormChange('notes', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetEditSalaryForm()
              setShowEditSalaryDialog(false)
              setSelectedSalaryRecord(null)
              setSelectedEmployee(null)
            }} disabled={isEditingSalary}>
              Cancel
            </Button>
            <Button onClick={handleEditSalarySubmit} disabled={isEditingSalary}>
              {isEditingSalary ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Salary Record'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={(open) => {
        if (!open) {
          setSelectedSalaryRecord(null)
          setSelectedEmployee(null)
        }
        setShowDeleteConfirmDialog(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Salary Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the salary record for {selectedEmployee?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSalaryRecord && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Record Details:</h4>
              <div className="space-y-1 text-sm text-red-700">
                <p><span className="font-medium">Staff:</span> {selectedEmployee?.name}</p>
                <p><span className="font-medium">Pay Period:</span> {selectedSalaryRecord.payPeriod}</p>
                <p><span className="font-medium">Net Salary:</span> GH₵{selectedSalaryRecord.netSalary?.toLocaleString()}</p>
                <p><span className="font-medium">Status:</span> {selectedSalaryRecord.paymentStatus || selectedSalaryRecord.status}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteConfirmDialog(false)
              setSelectedSalaryRecord(null)
              setSelectedEmployee(null)
            }} disabled={isDeletingSalary}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSalary} disabled={isDeletingSalary}>
              {isDeletingSalary ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Record'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}