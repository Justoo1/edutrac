"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { SelectClass } from "@/lib/schema"

interface ClassroomTableProps {
  data: SelectClass[]
}

export function ClassroomTable({ data }: ClassroomTableProps) {
  return <DataTable columns={columns} data={data} />
} 