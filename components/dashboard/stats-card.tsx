import type React from "react"

interface StatsCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend: React.ReactNode
  color: string
  iconColor: string
}

export function StatsCard({ title, value, icon, trend, color, iconColor }: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
          <div className={`rounded-md p-2 ${color} ${iconColor}`}>{icon}</div>
        </div>
        <div className="mt-4">
          <div className="flex items-center">{trend}</div>
        </div>
      </div>
    </div>
  )
}

