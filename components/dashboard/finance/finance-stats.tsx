import { ArrowDown, ArrowUp } from "lucide-react"

export function FinanceStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg bg-sky-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-sky-900">Total Amount</p>
            <h3 className="text-2xl font-bold text-sky-900">$126,450</h3>
          </div>
          <div className="flex items-center text-emerald-500">
            <ArrowUp className="h-4 w-4" />
            <span className="ml-1 text-xs font-medium">15%</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-sky-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-sky-900">Total Tuition</p>
            <h3 className="text-2xl font-bold text-sky-900">$67,200</h3>
          </div>
          <div className="flex items-center text-emerald-500">
            <ArrowUp className="h-4 w-4" />
            <span className="ml-1 text-xs font-medium">15%</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-sky-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-sky-900">Total Activities</p>
            <h3 className="text-2xl font-bold text-sky-900">$8,000</h3>
          </div>
          <div className="flex items-center text-red-500">
            <ArrowDown className="h-4 w-4" />
            <span className="ml-1 text-xs font-medium">8%</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-sky-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-sky-900">Total Miscellaneous</p>
            <h3 className="text-2xl font-bold text-sky-900">$6,150</h3>
          </div>
          <div className="flex items-center text-red-500">
            <ArrowDown className="h-4 w-4" />
            <span className="ml-1 text-xs font-medium">6%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

