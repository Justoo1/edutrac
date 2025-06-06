"use client"

import { useState, useEffect } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useStudentFees(schoolId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/finance/student-fees?schoolId=${schoolId}` : null,
    fetcher
  )

  return {
    students: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useStaffSalaries(schoolId: string, payPeriod?: string) {
  const url = payPeriod 
    ? `/api/finance/staff-salaries?schoolId=${schoolId}&payPeriod=${payPeriod}`
    : `/api/finance/staff-salaries?schoolId=${schoolId}`

  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? url : null,
    fetcher
  )

  return {
    salaries: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useExpenses(schoolId: string, filters?: {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const searchParams = new URLSearchParams()
  searchParams.append('schoolId', schoolId)
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) searchParams.append(key, value)
    })
  }

  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/finance/expenses?${searchParams.toString()}` : null,
    fetcher
  )

  return {
    expenses: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useFinancialOverview(schoolId: string, type?: 'overview' | 'monthly', options?: {
  year?: number;
  startDate?: string;
  endDate?: string;
}) {
  const searchParams = new URLSearchParams()
  searchParams.append('schoolId', schoolId)
  
  if (type) searchParams.append('type', type)
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString())
    })
  }

  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/finance/overview?${searchParams.toString()}` : null,
    fetcher
  )

  return {
    data: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useFeeTypes(schoolId: string, filters?: {
  academicYear?: string;
  term?: string;
  gradeLevel?: string;
}) {
  const searchParams = new URLSearchParams()
  searchParams.append('schoolId', schoolId)
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) searchParams.append(key, value)
    })
  }

  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/finance/fee-types?${searchParams.toString()}` : null,
    fetcher
  )

  return {
    feeTypes: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useStudentFeesWithStatus(studentId: string, academicYear?: string, term?: string) {
  const searchParams = new URLSearchParams()
  searchParams.append('studentId', studentId)
  
  if (academicYear) searchParams.append('academicYear', academicYear)
  if (term) searchParams.append('term', term)

  const { data, error, isLoading, mutate } = useSWR(
    studentId ? `/api/finance/student-fees/status?${searchParams.toString()}` : null,
    fetcher
  )

  return {
    fees: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Custom hooks for actions
export function useFinanceActions() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recordPayment = async (paymentData: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/finance/student-fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        throw new Error('Failed to record payment')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const processSalary = async (salaryData: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/finance/staff-salaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salaryData),
      })

      if (!response.ok) {
        throw new Error('Failed to process salary')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createExpense = async (expenseData: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        throw new Error('Failed to create expense')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const approveExpense = async (expenseId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/finance/expenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expenseId, action: 'approve' }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve expense')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createFeeType = async (feeData: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/finance/fee-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feeData,
          // Handle the feeStructureId for linking to fee structure
          feeStructureId: feeData.feeStructureId || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create fee type')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateFeeType = async (feeId: string, feeData: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/finance/fee-types/${feeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feeData),
      })

      if (!response.ok) {
        throw new Error('Failed to update fee type')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFeeType = async (feeId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/finance/fee-types/${feeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete fee type')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    recordPayment,
    processSalary,
    createExpense,
    approveExpense,
    createFeeType,
    updateFeeType,
    deleteFeeType,
    isLoading,
    error
  }
}
