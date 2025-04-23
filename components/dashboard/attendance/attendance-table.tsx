"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDate } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Student {
  id: string
  name: string
  attendance: {
    date: string
    status: "present" | "absent" | "none"
  }[]
}

interface AttendanceTableProps {
  classId: string
  month: string
  weekFilter: string | null
}

export function AttendanceTable({ classId, month, weekFilter }: AttendanceTableProps) {
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Generate all days in the selected month
  const [year, monthNum] = month.split("-").map(Number)
  const monthStart = startOfMonth(new Date(year, monthNum - 1))
  const monthEnd = endOfMonth(monthStart)
  const allDates = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Filter dates by week if weekFilter is set
  const displayDates = weekFilter ? allDates.filter(date => {
    const dayOfMonth = getDate(date)
    switch(weekFilter) {
      case "week1": return dayOfMonth <= 7
      case "week2": return dayOfMonth > 7 && dayOfMonth <= 14
      case "week3": return dayOfMonth > 14 && dayOfMonth <= 21
      case "week4": return dayOfMonth > 21
      default: return true
    }
  }) : allDates

  const handleAttendanceChange = async (studentId: string, date: string, newStatus: "present" | "absent") => {
    if (!session?.user?.role || (session.user.role !== "admin" && session.user.role !== "class_teacher")) {
      toast.error("You don't have permission to modify attendance")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/attendance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          classId,
          date,
          status: newStatus
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update attendance")
      }
      
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === studentId
            ? {
                ...student,
                attendance: student.attendance.map(day => 
                  day.date === date ? { ...day, status: newStatus } : day
                )
              }
            : student
        )
      )
      
      toast.success("Attendance updated successfully")
    } catch (error) {
      toast.error("Failed to update attendance")
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!classId || !month) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/attendance?classId=${classId}&month=${month}`)
        if (!response.ok) {
          throw new Error('Failed to fetch attendance')
        }
        const data = await response.json()
        setStudents(data)
      } catch (error) {
        console.error('Error fetching attendance:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendance()
  }, [classId, month])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!students.length) {
    return <div>No attendance records found</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-md border bg-white"
    >
      <div className="relative overflow-x-auto">
        <div className="sticky left-0 z-10 w-[200px] bg-white">
          {/* Fixed Student Name Column */}
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px] font-medium">Student Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{student.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="absolute left-[200px] top-0 min-w-full">
          {/* Scrollable Attendance Dates */}
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {displayDates.map(date => (
                  <TableHead key={date.toISOString()} className="text-center font-medium p-2 min-w-[40px]">
                    {String(getDate(date)).padStart(2, '0')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/50">
                  {displayDates.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd')
                    const attendance = student.attendance.find(a => a.date === dateStr)
                    return (
                      <TableCell key={dateStr} className="text-center p-2 min-w-[40px]">
                        <button
                          onClick={() => {
                            const newStatus = attendance?.status === "present" ? "absent" : "present"
                            handleAttendanceChange(student.id, dateStr, newStatus)
                          }}
                          disabled={isSaving || !attendance}
                          className="mx-auto block"
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {attendance?.status === "present" ? (
                                  <div className="h-6 w-6 rounded-full bg-sky-500/20 mx-auto flex items-center justify-center">
                                    <Check className="h-4 w-4 text-sky-500" />
                                  </div>
                                ) : attendance?.status === "absent" ? (
                                  <div className="h-6 w-6 rounded-full bg-red-500/20 mx-auto flex items-center justify-center">
                                    <X className="h-4 w-4 text-red-500" />
                                  </div>
                                ) : (
                                  <div className="h-6 w-6 mx-auto flex items-center justify-center">-</div>
                                )}
                              </TooltipTrigger>
                              {attendance?.status && (
                                <TooltipContent>
                                  <p className="capitalize">{attendance.status}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </button>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  )
}

