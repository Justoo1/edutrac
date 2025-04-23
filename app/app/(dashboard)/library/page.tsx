import { BookTable } from "@/components/dashboard/library/book-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, Plus, Search } from "lucide-react"

export default function LibraryPage() {
  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Books</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search by ID, Name or Subject" className="w-[300px] pl-8" />
            </div>
            <Button size="icon" variant="outline">
              <Filter className="h-4 w-4" />
            </Button>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <BookTable />
      </div>
  )
}

