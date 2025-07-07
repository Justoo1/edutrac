"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { 
  Users, 
  School, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react"

const iconMap = {
  Users,
  School,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
}

interface EnhancedStatsCardProps {
  title: string
  value: string | number
  iconName: keyof typeof iconMap  // Change this line
  trend?: {
    value: string
    isPositive: boolean
    label: string
  }
  color: string
  iconColor: string
  subtitle?: string
  className?: string
  loading?: boolean
}

export function StatsCard({ 
  title, 
  value, 
  iconName, 
  trend, 
  color, 
  iconColor, 
  subtitle, 
  className,
  loading = false
}: EnhancedStatsCardProps) {
  const Icon = iconMap[iconName]
  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group cursor-pointer", 
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </h3>
              {trend && (
                <Badge 
                  variant={trend.isPositive ? "secondary" : "destructive"}
                  className="text-xs flex items-center gap-1"
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {trend.value}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "rounded-full p-3 transition-all duration-300 group-hover:scale-110", 
            color
          )}>
            <Icon className={cn("h-6 w-6 transition-colors", iconColor)} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.label}
            </div>
          </div>
        )}
        {/* Decorative elements */}
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -left-2 -bottom-2 h-12 w-12 rounded-full bg-gradient-to-tr from-white/10 to-transparent opacity-30 group-hover:opacity-70 transition-opacity" />
      </CardContent>
    </Card>
  )
}