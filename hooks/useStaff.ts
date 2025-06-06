"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export interface StaffMember {
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

export function useStaff(schoolId?: string) {
  const { data: session } = useSession()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStaff() {
      if (!session?.user || !schoolId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/teachers?schoolId=${schoolId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch staff members')
        }

        const result = await response.json()
        
        // Filter only active staff members
        const activeStaff = result.filter((staff: StaffMember) => 
          staff.isActive !== false && staff.status !== 'former'
        )
        
        setStaffMembers(activeStaff)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [session, schoolId])

  // Helper function to format staff display name
  const formatStaffDisplayName = (staff: StaffMember) => {
    const name = staff.name || 'Unknown Name'
    const position = staff.position || 'Staff'
    const department = staff.department ? ` - ${staff.department}` : ''
    return `${name} (${position}${department})`
  }

  return {
    staffMembers,
    loading,
    error,
    formatStaffDisplayName,
    refetch: () => fetchStaff()
  }

  function fetchStaff() {
    if (!session?.user || !schoolId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/api/teachers?schoolId=${schoolId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch staff members')
        }
        return response.json()
      })
      .then(result => {
        // Filter only active staff members
        const activeStaff = result.filter((staff: StaffMember) => 
          staff.isActive !== false && staff.status !== 'former'
        )
        setStaffMembers(activeStaff)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'An error occurred')
      })
      .finally(() => {
        setLoading(false)
      })
  }
}
