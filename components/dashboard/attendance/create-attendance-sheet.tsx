"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format, addDays, startOfWeek, endOfWeek } from "date-fns"

interface CreateAttendanceSheetProps {
  classId: string
  weekId: string
  isEditing?: boolean
  onSuccess: () => void
  onCancel: () => void
}

export function CreateAttendanceSheet({ 
  classId, 
  weekId, 
  isEditing = false,
  onSuccess, 
  onCancel 
}: CreateAttendanceSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [dates, setDates] = useState<string[]>([])

  useEffect(() => {
    // Calculate the dates for the selected week
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Get the first day of the current month
    const firstDay = new Date(currentYear, currentMonth, 1)
    
    // Calculate week start based on weekId
    let weekStart: Date
    switch (weekId) {
      case "week1":
        weekStart = firstDay
        break
      case "week2":
        weekStart = addDays(firstDay, 7)
        break
      case "week3":
        weekStart = addDays(firstDay, 14)
        break
      case "week4":
        weekStart = addDays(firstDay, 21)
        break
      default:
        weekStart = firstDay
    }
    
    // Generate array of dates for the week
    const weekDates: string[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i)
      // Only include dates that fall within the same month
      if (date.getMonth() === currentMonth) {
        weekDates.push(format(date, "yyyy-MM-dd"))
      }
    }
    
    setDates(weekDates)
  }, [weekId])

  const handleCreate = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          weekId,
          dates,
          isEditing
        }),
      })

      if (!response.ok) {
        throw new Error(isEditing ? "Failed to update attendance sheet" : "Failed to create attendance sheet")
      }

      toast.success(isEditing ? "Attendance sheet updated successfully" : "Attendance sheet created successfully")
      onSuccess()
    } catch (error) {
      console.error("Error creating attendance sheet:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {isEditing ? "Update Attendance Sheet" : "Create Attendance Sheet"}
            </h3>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Update Sheet" : "Create Sheet"
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isEditing 
                ? "This will add any new students to the existing attendance sheet for the selected week." 
                : "This will create attendance records for all students in the selected class for the following dates:"}
            </p>
            <ul className="list-disc list-inside space-y-1">
              {dates.map((date) => (
                <li key={date} className="text-sm">
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 