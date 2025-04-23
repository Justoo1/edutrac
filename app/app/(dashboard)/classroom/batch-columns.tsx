"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, UserPlus, Eye, PenLine } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddStudentsToBatchDialog } from "./add-students-to-batch-dialog"
import { SelectSchool } from "@/lib/schema"
import { BatchDetailsDialog } from "./batch-details-dialog"
import Link from "next/link"

// Define the batch data type
export type Batch = {
  id: string
  name: string
  gradeLevel: string
  schoolId: string
  createdAt: string
  updatedAt: string
  studentCount?: number
}

interface BatchActionsProps {
  batch: Batch
  school: SelectSchool
}

// Component for the batch actions
export function BatchActions({ batch, school }: BatchActionsProps) {
  return (
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
        <BatchDetailsDialog batchId={batch.id}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        </BatchDetailsDialog>
        <DropdownMenuItem asChild>
          <Link href={`/app/classroom?edit=${batch.id}`}>
            <PenLine className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <AddStudentsToBatchDialog school={school} batch={batch}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Students
          </DropdownMenuItem>
        </AddStudentsToBatchDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const createBatchColumns = (school: SelectSchool) => {
  const columns: ColumnDef<Batch>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Batch Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
          <BatchDetailsDialog batchId={row.original.id}>
            <button className="font-medium text-blue-600 hover:underline">
              {row.getValue("name")}
            </button>
          </BatchDetailsDialog>
        )
      },
    },
    {
      accessorKey: "gradeLevel",
      header: "Grade Level",
    },
    {
      accessorKey: "studentCount",
      header: "Students",
      cell: ({ row }) => {
        const count = row.original.studentCount || 0
        return (
          <div className="font-medium">
            {count} {count === 1 ? "student" : "students"}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        // Format the date nicely
        return new Date(row.original.createdAt).toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <BatchActions batch={row.original} school={school} />,
    },
  ]

  return columns
} 