"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define the enrollment data type
export type Enrollment = {
  id: string
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNumber: string
  }
  class: {
    id: string
    name: string
    gradeLevel: string
  }
  enrollmentDate: string
  status: string
}

// Component for the actions cell
export function EnrollmentActions({ enrollment }: { enrollment: Enrollment }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUnenroll = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unenroll student")
      }

      toast.success(`Student unenrolled successfully`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to unenroll student")
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Status
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-red-600"
            onClick={() => setIsOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Unenroll
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unenroll Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unenroll <strong>{enrollment.student.firstName} {enrollment.student.lastName}</strong> from <strong>{enrollment.class.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleUnenroll()
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Unenrolling..." : "Unenroll Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const enrollmentColumns: ColumnDef<Enrollment>[] = [
  {
    accessorKey: "student.admissionNumber",
    header: "Admission #",
  },
  {
    accessorKey: "student",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Student Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const student = row.original.student
      return `${student.firstName} ${student.lastName}`
    },
  },
  {
    accessorKey: "class.name",
    header: "Classroom",
  },
  {
    accessorKey: "class.gradeLevel",
    header: "Grade Level",
  },
  {
    accessorKey: "enrollmentDate",
    header: "Enrollment Date",
    cell: ({ row }) => {
      // Format the date
      return new Date(row.original.enrollmentDate).toLocaleDateString()
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'active' ? 'bg-green-100 text-green-800' : 
          status === 'transferred' ? 'bg-yellow-100 text-yellow-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <EnrollmentActions enrollment={row.original} />
  },
] 