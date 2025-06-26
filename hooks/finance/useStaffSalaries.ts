"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export interface StaffSalaryData {
  salary: {
    id: string
    staffId: string
    schoolId: string
    baseSalary: number
    allowances: number
    deductions: number
    netSalary: number
    paymentDate: string | null
    paymentMethod: string | null
    paymentReference: string | null
    accountNumber: string | null
    payPeriod: string
    academicYear: string
    status: string
    processedBy: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
  }
  staff: {
    id: string
    userId: string | null
    name: string | null
    schoolId: string | null
    staffId: string | null
    position: string | null
    department: string | null
    qualification: string | null
    joinedDate: string | null
    status: string | null
    contactInfo: any
    gender: string | null
    role: string | null
    isActive: boolean | null
    email: string | null
    createdAt: string
    updatedAt: string
  }
}

export interface ProcessedStaffData {
  id: string
  name: string
  position: string
  department: string
  avatar: string
  phone: string
  email: string
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  paymentStatus: string
  lastPayment: string | Date | null
  paymentMethod: string
  accountNumber: string
  joinDate: string | Date
  employeeType: string
}

export interface PayrollHistory {
  month: string
  totalPaid: number
  staffCount: number
  status: string
}

export function useStaffSalaries(schoolId?: string, payPeriod?: string) {
  const { data: session } = useSession()
  const [data, setData] = useState<StaffSalaryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStaffSalaries() {
      if (!session?.user || !schoolId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const url = new URL('/api/finance/staff-salaries', window.location.origin)
        url.searchParams.set('schoolId', schoolId)
        if (payPeriod) {
          url.searchParams.set('payPeriod', payPeriod)
        }

        const response = await fetch(url.toString())
        
        if (!response.ok) {
          throw new Error('Failed to fetch staff salaries')
        }

        const result = await response.json()
        console.log(result)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStaffSalaries()
  }, [session, schoolId, payPeriod])

  // Process the data to match the component's expected format
  const processedStaff: ProcessedStaffData[] = data.map((item) => {
    const { salary, staff } = item
    
    // Extract contact info
    const contactInfo = staff.contactInfo as any || {}
    const phone = contactInfo?.phone || contactInfo?.primaryPhone || '+233 XX XXX XXXX'
    
    // Generate avatar initials
    const nameInitials = staff.name?.split(' ').map(n => n[0]).join('') || 'ST'
    
    return {
      staffId: staff.id,
      id: salary.id,
      name: staff.name || 'Unknown Staff',
      position: staff.position || 'Staff Member',
      department: staff.department || 'General',
      avatar: `/placeholder.svg`, // You can customize this based on your needs
      phone,
      email: staff.email || contactInfo?.email || 'No email',
      baseSalary: salary.baseSalary,
      allowances: salary.allowances || 0,
      deductions: salary.deductions || 0,
      netSalary: salary.netSalary,
      paymentStatus: salary.status || 'pending',
      lastPayment: salary.paymentDate,
      paymentMethod: salary.paymentMethod || 'Not specified',
      accountNumber: salary.accountNumber || 'Not provided',
      joinDate: staff.joinedDate || staff.createdAt,
      employeeType: staff.role === 'teacher' ? 'full-time' : staff.role || 'full-time'
    }
  })

  // Calculate summary statistics
  const totalStaff = processedStaff.length
  const totalSalaryBudget = processedStaff.reduce((sum, staff) => sum + staff.netSalary, 0)
  const paidSalaries = processedStaff
    .filter(s => s.paymentStatus === 'paid')
    .reduce((sum, staff) => sum + staff.netSalary, 0)
  const pendingSalaries = processedStaff
    .filter(s => s.paymentStatus === 'pending')
    .reduce((sum, staff) => sum + staff.netSalary, 0)

  // Generate payroll history (mock data for now - you can enhance this later)
  const payrollHistory: PayrollHistory[] = [
    { month: "January 2024", totalPaid: totalSalaryBudget, staffCount: totalStaff, status: "completed" },
    { month: "December 2023", totalPaid: totalSalaryBudget * 0.98, staffCount: totalStaff, status: "completed" },
    { month: "November 2023", totalPaid: totalSalaryBudget, staffCount: totalStaff, status: "completed" },
    { month: "October 2023", totalPaid: totalSalaryBudget * 0.95, staffCount: totalStaff - 1, status: "completed" },
  ]

  return {
    staffData: processedStaff,
    payrollHistory,
    summary: {
      totalStaff,
      totalSalaryBudget,
      paidSalaries,
      pendingSalaries
    },
    loading,
    error,
    refetch: () => fetchStaffSalaries()
  }

  function fetchStaffSalaries() {
    if (!session?.user || !schoolId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const url = new URL('/api/finance/staff-salaries', window.location.origin)
    url.searchParams.set('schoolId', schoolId)
    if (payPeriod) {
      url.searchParams.set('payPeriod', payPeriod)
    }

    fetch(url.toString())
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch staff salaries')
        }
        return response.json()
      })
      .then(result => {
        setData(result)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'An error occurred')
      })
      .finally(() => {
        setLoading(false)
      })
  }
}

export async function processSalaryPayment(paymentData: {
  staffId: string
  schoolId: string
  baseSalary: number
  allowances: number
  deductions: number
  payPeriod: string
  academicYear: string
  paymentMethod: string
  accountNumber?: string
  notes?: string
}) {
  const response = await fetch('/api/finance/staff-salaries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  })

  if (!response.ok) {
    throw new Error('Failed to process salary payment')
  }

  return response.json()
}
