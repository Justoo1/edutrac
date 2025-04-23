import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function EarningsChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Earnings</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="h-3 w-3 rounded-full bg-sky-400"></span>
            <span className="text-sm text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-3 w-3 rounded-full bg-purple-400"></span>
            <span className="text-sm text-muted-foreground">Expense</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          {/* This would be a real chart in production */}
          <div className="relative h-full w-full">
            <div className="absolute bottom-0 left-0 right-0 h-[80%]">
              <svg viewBox="0 0 100 20" className="h-full w-full" preserveAspectRatio="none">
                <path
                  d="M0,10 Q10,5 20,10 T40,10 T60,15 T80,5 T100,10"
                  fill="none"
                  stroke="rgb(56, 189, 248)"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M0,15 Q10,10 20,15 T40,10 T60,5 T80,15 T100,10"
                  fill="none"
                  stroke="rgb(192, 132, 252)"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
              {["0", "25K", "50K", "75K", "100K"].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-background p-2 text-xs">
              <div className="font-medium">Sep 14, 2030</div>
              <div className="text-muted-foreground">$437,000</div>
              <div className="text-muted-foreground">$500,000</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
