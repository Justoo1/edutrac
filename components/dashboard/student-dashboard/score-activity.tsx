import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ScoreActivity() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Score Activity</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="weekly">
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          {/* This would be a real chart in production */}
          <div className="relative h-full w-full">
            <svg viewBox="0 0 100 20" className="h-full w-full" preserveAspectRatio="none">
              <path
                d="M0,10 Q5,15 10,7 T20,10 T30,5 T40,15 T50,5 T60,10 T70,15 T80,5 T90,10 T100,5"
                fill="none"
                stroke="rgb(250, 204, 21)"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0,10 Q5,15 10,7 T20,10 T30,5 T40,15 T50,5 T60,10 T70,15 T80,5 T90,10 T100,5"
                fill="rgba(250, 204, 21, 0.1)"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
              {["Apr 10", "Apr 11", "Apr 12", "Apr 13", "Apr 14", "Apr 15", "Apr 16"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
              {["0", "25", "50", "75", "100"].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className="absolute right-1/4 top-1/3 flex items-center gap-1 rounded-md border bg-background p-2 text-xs">
              <span className="font-medium">70 %</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

