"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, TrendingUp, Users, CheckCircle, XCircle } from "lucide-react"
import { useState, useMemo } from "react"

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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedClass, setSelectedClass] = useState("all")

  const currentYear = new Date().getFullYear()

  // Generate months for the current year
  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ]

  // Calculate weeks in selected month
  const weeksInMonth = useMemo(() => {
    const year = currentYear
    const month = selectedMonth
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Get the first Monday of the month or the first day if it starts on Monday
    const firstMonday = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek // If Sunday, add 1 day; otherwise, days until next Monday
    if (dayOfWeek !== 1) { // If not Monday
      firstMonday.setDate(firstDay.getDate() + daysToAdd)
    }

    const weeks = []
    let weekNumber = 1
    let currentWeekStart = new Date(firstMonday)

    // If the month doesn't start on Monday, include the partial first week
    if (firstDay.getDate() !== firstMonday.getDate()) {
      weeks.push({
        value: weekNumber,
        label: `Week ${weekNumber}`,
        startDate: new Date(firstDay),
        endDate: new Date(firstMonday.getTime() - 24 * 60 * 60 * 1000) // Day before first Monday
      })
      weekNumber++
    }

    // Add complete weeks
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(currentWeekStart.getDate() + 6)
      
      // Don't go beyond the last day of the month
      if (weekEnd > lastDay) {
        weekEnd.setTime(lastDay.getTime())
      }

      weeks.push({
        value: weekNumber,
        label: `Week ${weekNumber}`,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEnd)
      })

      weekNumber++
      currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    }

    return weeks
  }, [selectedMonth, currentYear])

  // Filter data based on selected month and week
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []

    const selectedWeekInfo = weeksInMonth.find(w => w.value === selectedWeek)
    if (!selectedWeekInfo) return data.slice(-7) // Fallback to last 7 days

    const { startDate, endDate } = selectedWeekInfo
    
    return data.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate && itemDate <= endDate
    }).slice(0, 7) // Limit to 7 days max for display
  }, [data, selectedWeek, weeksInMonth])

  // Calculate metrics for filtered data
  const filteredMetrics = useMemo(() => {
    const present = filteredData.reduce((sum, day) => sum + day.present, 0)
    const absent = filteredData.reduce((sum, day) => sum + day.absent, 0)
    const total = present + absent
    const rate = total > 0 ? Math.round((present / total) * 100) : 0

    return { present, absent, total, rate }
  }, [filteredData])

  const maxHeight = Math.max(...filteredData.map(d => d.total), 1) // Prevent division by zero

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

  // Reset week when month changes
  const handleMonthChange = (month: string) => {
    setSelectedMonth(parseInt(month))
    setSelectedWeek(1) // Reset to first week
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

  const statusBadge = getStatusBadge(filteredMetrics.rate)

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
              <span className="text-sm text-muted-foreground">Selected period rate:</span>
              <Badge variant={statusBadge.variant} className="text-xs">
                {filteredMetrics.rate}% - {statusBadge.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedWeek.toString()} onValueChange={(week) => setSelectedWeek(parseInt(week))}>
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weeksInMonth.map((week) => (
                  <SelectItem key={week.value} value={week.value.toString()}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics for Selected Period */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Present</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {filteredMetrics.present}
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Absent</span>
              </div>
              <div className="text-2xl font-bold text-red-700">
                {filteredMetrics.absent}
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
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                {months[selectedMonth].label} {currentYear} - Week {selectedWeek}
              </h4>
              <span className="text-xs text-muted-foreground">
                {weeksInMonth.find(w => w.value === selectedWeek)?.startDate.toLocaleDateString()} - {weeksInMonth.find(w => w.value === selectedWeek)?.endDate.toLocaleDateString()}
              </span>
            </div>
            <div className="h-48 flex items-end gap-2">
              {filteredData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">No attendance data for selected period</p>
                </div>
              ) : (
                filteredData.map((day, index) => {
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
                        {day.total > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white bg-black/30 px-2 py-1 rounded">
                              {day.rate}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium">{dayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(day.date).getDate()}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Selected Period Attendance Rate</span>
              <span className={`text-sm font-bold ${getStatusColor(filteredMetrics.rate)}`}>
                {filteredMetrics.rate}%
              </span>
            </div>
            <Progress 
              value={filteredMetrics.rate} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: 95%</span>
              <span>Current: {filteredMetrics.rate}%</span>
            </div>
          </div>

          {/* Overall School Rate */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Overall School Rate</span>
              <span className={`text-sm font-bold ${getStatusColor(overallRate)}`}>
                {overallRate}%
              </span>
            </div>
            <Progress value={overallRate} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}