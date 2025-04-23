"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MonthPicker } from "@/components/month-picker"
import { format } from "date-fns"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Loader2, X, Edit2, FileDown } from "lucide-react"

interface Class {
  id: string
  name: string
}

interface AttendanceControlsProps {
  viewSelectedClass: string
  createSelectedClass: string
  selectedMonth: string
  selectedWeek: string
  viewSelectedWeek: string | null
  onViewClassSelect: (classId: string) => void
  onCreateClassSelect: (classId: string) => void
  onMonthSelect: (month: string) => void
  onWeekSelect: (week: string) => void
  onViewWeekSelect: (week: string | null) => void
  onCreateSheet: () => void
  onEditSheet: (classId: string, weekId: string) => void
  onGeneratePDF: (classId: string, month: string, weekFilter: string | null) => void
}

export function AttendanceControls({
  viewSelectedClass,
  createSelectedClass,
  selectedMonth,
  selectedWeek,
  viewSelectedWeek,
  onViewClassSelect,
  onCreateClassSelect,
  onMonthSelect,
  onWeekSelect,
  onViewWeekSelect,
  onCreateSheet,
  onEditSheet,
  onGeneratePDF
}: AttendanceControlsProps) {
  const [mode, setMode] = useState<"view" | "create">("view")
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true)
        if (status === "loading") return
        if (!session?.user?.schoolId) {
          throw new Error("School not found")
        }
        
        const response = await fetch(`/api/classes?schoolId=${session.user.schoolId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch classes")
        }
        const data = await response.json()
        setClasses(data)
      } catch (error) {
        console.error("Error fetching classes:", error)
        toast.error(error instanceof Error ? error.message : "Failed to load classes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [session, status])

  const handleMonthChange = (date: Date) => {
    onMonthSelect(format(date, "yyyy-MM"))
  }

  const canCreateSheet = session?.user?.role === "admin" || session?.user?.role === "class_teacher"

  const handleCreateSheet = () => {
    onCreateSheet()
    // Switch back to view mode after creation
    setMode("view")
    // Set the view class to match the create class
    onViewClassSelect(viewSelectedClass)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={mode} onValueChange={(value) => setMode(value as "view" | "create")}>
          <TabsList className="mb-4">
            <TabsTrigger value="view">View Attendance</TabsTrigger>
            {canCreateSheet && <TabsTrigger value="create">Create Sheet</TabsTrigger>}
          </TabsList>

          <TabsContent value="view" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Select
                value={viewSelectedClass}
                onValueChange={onViewClassSelect}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select class" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <MonthPicker
                selected={new Date(selectedMonth)}
                onSelect={handleMonthChange}
                disabled={isLoading}
              />

              <div className="flex gap-2 items-center">
                <Select
                  value={viewSelectedWeek || ""}
                  onValueChange={onViewWeekSelect}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by week (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week1">Week 1</SelectItem>
                    <SelectItem value="week2">Week 2</SelectItem>
                    <SelectItem value="week3">Week 3</SelectItem>
                    <SelectItem value="week4">Week 4</SelectItem>
                  </SelectContent>
                </Select>
                {viewSelectedWeek && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewWeekSelect(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {canCreateSheet && viewSelectedClass && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditSheet(viewSelectedClass, viewSelectedWeek || "week1")}
                      className="ml-2"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Sheet
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGeneratePDF(viewSelectedClass, selectedMonth, viewSelectedWeek)}
                      className="ml-2"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Generate PDF
                    </Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Select
                value={createSelectedClass}
                onValueChange={onCreateClassSelect}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select class" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedWeek}
                onValueChange={onWeekSelect}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week1">Week 1</SelectItem>
                  <SelectItem value="week2">Week 2</SelectItem>
                  <SelectItem value="week3">Week 3</SelectItem>
                  <SelectItem value="week4">Week 4</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleCreateSheet}
                disabled={!createSelectedClass || !selectedWeek || isLoading}
              >
                Create Sheet
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 