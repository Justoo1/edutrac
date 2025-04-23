import { NoticeList } from "@/components/dashboard/notice/notice-list"
import { NoticeDetail } from "@/components/dashboard/notice/notice-detail"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, Plus, Search } from "lucide-react"

export default function NoticePage() {
  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notice Board</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search by Title or Author" className="w-[300px] pl-8" />
            </div>
            <Button size="icon" variant="outline">
              <Filter className="h-4 w-4" />
            </Button>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <NoticeList />
          </div>
          <div>
            <NoticeDetail />
          </div>
        </div>
      </div>
  )
}

