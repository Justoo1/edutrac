"use client"

import { useState } from "react"
import { TeacherTable } from "@/components/dashboard/teachers/teacher-table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface TeachersClientProps {
  teachers: any[]
  isAdmin: boolean
  departments: string[]
}

export function TeachersClient({ teachers, isAdmin, departments }: TeachersClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValue, setFilterValue] = useState("all")

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleFilterChange = (value: string) => {
    setFilterValue(value)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search by Name, ID, or Department" 
            className="w-full pl-8" 
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filterValue} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department} value={department.toLowerCase()}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <TeacherTable 
        teachers={teachers} 
        isAdmin={isAdmin} 
        searchQuery={searchQuery}
        filterValue={filterValue}
      />
    </>
  )
} 