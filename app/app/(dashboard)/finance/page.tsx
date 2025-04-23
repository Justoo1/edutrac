import { FeesTable } from "@/components/dashboard/finance/fees-table"
import { FinanceStats } from "@/components/dashboard/finance/finance-stats"
import { FinanceChart } from "@/components/dashboard/finance/finance-chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Search } from "lucide-react"

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fees Collection</h1>
      <FinanceChart />
      <FinanceStats />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Fees Collection</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search by Name or ID" className="w-[300px] pl-8" />
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <CalendarIcon className="h-4 w-4" />
            Today
          </Button>
          <Select defaultValue="all-classes">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-classes">All Classes</SelectItem>
              <SelectItem value="class-10">Class 10</SelectItem>
              <SelectItem value="class-11">Class 11</SelectItem>
              <SelectItem value="class-12">Class 12</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-status">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <FeesTable />
    </div>
  )
}

