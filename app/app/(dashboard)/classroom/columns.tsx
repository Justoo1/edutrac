"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditClassroomDialog } from "./edit-classroom-dialog"
import { DeleteClassroomDialog } from "./delete-classroom-dialog"
import { SelectClass } from "@/lib/schema"
import { ClassroomDetailsDialog } from "./classroom-details-dialog"

export const columns: ColumnDef<SelectClass>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "gradeLevel",
    header: "Grade Level",
  },
  {
    accessorKey: "academicYear",
    header: "Academic Year",
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
  },
  {
    accessorKey: "room",
    header: "Room",
  },
  {
    id: "enrollments",
    header: "Students",
    cell: ({ row }) => {
      return (row.original as SelectClass & { enrollments?: { id: string }[] }).enrollments?.length || 0
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const classroom = row.original

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
          <ClassroomDetailsDialog classId={classroom.id}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          </ClassroomDetailsDialog>
            <EditClassroomDialog classroom={classroom}>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </EditClassroomDialog>
            <DeleteClassroomDialog classroom={classroom}>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DeleteClassroomDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 