export function FinanceChart() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">$152,927</h3>
            <p className="text-sm text-muted-foreground">Aug 19, 2030</p>
          </div>
        </div>
        <div className="mt-4 h-[200px]">
          {/* This would be a real chart in production */}
          <div className="relative h-full w-full">
            <svg viewBox="0 0 100 20" className="h-full w-full" preserveAspectRatio="none">
              <path
                d="M0,10 Q5,5 10,7 T20,10 T30,15 T40,5 T50,10 T60,5 T70,15 T80,10 T90,5 T100,10"
                fill="none"
                stroke="rgb(250, 204, 21)"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0,10 Q5,5 10,7 T20,10 T30,15 T40,5 T50,10 T60,5 T70,15 T80,10 T90,5 T100,10"
                fill="rgba(250, 204, 21, 0.1)"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
              {["0", "1,000", "2,500", "5,000", "7,500"].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

