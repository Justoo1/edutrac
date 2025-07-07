"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, TrendingUp, Users, CheckCircle, XCircle } from "lucide-react"
import { useState } from "react"

export interface AttendanceData {
  date: string
  present: number
  absent: number
  total: number
  rate: number
}

interface AttendanceChartProps {
  data: AttendanceData[]
  overallRate: number
  totalStudents: number
  loading?: boolean
}

export function AttendanceChart({ 
  data, 
  overallRate, 
  totalStudents,
  loading = false
}: AttendanceChartProps) {
  const [timeRange, setTimeRange] = useState("weekly")
  const [selectedClass, setSelectedClass] = useState("all")

  const last7Days = data.slice(-7)
  const maxHeight = Math.max(...last7Days.map(d => d.total))

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return "text-green-600"
    if (rate >= 85) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusBadge = (rate: number) => {
    if (rate >= 95) return { label: "Excellent", variant: "secondary" as const }
    if (rate >= 85) return { label: "Good", variant: "secondary" as const }
    return { label: "Needs Attention", variant: "destructive" as const }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const statusBadge = getStatusBadge(overallRate)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current rate:</span>
              <Badge variant={statusBadge.variant} className="text-xs">
                {overallRate}% - {statusBadge.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Week</SelectItem>
                <SelectItem value="monthly">Month</SelectItem>
                <SelectItem value="yearly">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Present</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {last7Days.reduce((sum, day) => sum + day.present, 0)}
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Absent</span>
              </div>
              <div className="text-2xl font-bold text-red-700">
                {last7Days.reduce((sum, day) => sum + day.absent, 0)}
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {totalStudents}
              </div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Weekly Attendance</h4>
            <div className="h-48 flex items-end gap-2">
              {last7Days.map((day, index) => {
                const presentHeight = maxHeight > 0 ? (day.present / maxHeight) * 100 : 0
                const absentHeight = maxHeight > 0 ? (day.absent / maxHeight) * 100 : 0
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full h-40 bg-gray-100 rounded-t-lg overflow-hidden">
                      {/* Present bar */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-700 ease-out"
                        style={{ height: `${presentHeight}%` }}
                      />
                      {/* Absent bar - stacked on top */}
                      <div 
                        className="absolute bg-gradient-to-t from-red-500 to-red-400 left-0 right-0 transition-all duration-700 ease-out"
                        style={{ 
                          height: `${absentHeight}%`,
                          bottom: `${presentHeight}%`
                        }}
                      />
                      {/* Percentage overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-black/30 px-2 py-1 rounded">
                          {day.rate}%
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium">{dayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(day.date).getDate()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Attendance Rate</span>
              <span className={`text-sm font-bold ${getStatusColor(overallRate)}`}>
                {overallRate}%
              </span>
            </div>
            <Progress 
              value={overallRate} 
              className="h-3"
              style={{
                background: `linear-gradient(to right, 
                  ${overallRate >= 95 ? '#22c55e' : overallRate >= 85 ? '#eab308' : '#ef4444'} 0%, 
                  ${overallRate >= 95 ? '#16a34a' : overallRate >= 85 ? '#ca8a04' : '#dc2626'} 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: 95%</span>
              <span>Current: {overallRate}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}