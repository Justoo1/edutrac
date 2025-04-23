export function PerformanceCard() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-medium">Performance</h3>
        <div className="mt-4 flex flex-col items-center">
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#d8b4fe"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset="75"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">3.4</span>
              <span className="text-xs text-muted-foreground">of 4.0 max GPA</span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm">
            <span>1st Semester - 6st Semester</span>
          </div>
        </div>
      </div>
    </div>
  )
}

