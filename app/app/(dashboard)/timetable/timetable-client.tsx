'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Settings2, Pencil, Printer, Loader2, Clock, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScheduleDialog } from "./schedule-dialog"
import { getTimetables, addTimetable, updateTimetable, deleteTimetable } from './actions'
import { SettingsDialog } from "./settings-dialog"
import { TimetablePDF } from "./timetable-pdf"
import { generatePDF } from '@/lib/pdf'
import { PeriodsDialog } from "./periods-dialog"

export interface Class {
  id: string
  name: string
  room: string | null
}

export interface Subject {
  id: string
  name: string
}

export interface Teacher {
  id: string
  name: string | null
  classesTaught?: {
    subject: {
      id: string
    }
  }[]
}

export interface Schedule {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  day: string
  period: string
  room: string
  academicTermId: string
}

export interface Period {
  id: string
  schoolId: string
  time: string
  label: string
  type: 'class' | 'break'
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}

export interface AcademicTerm {
  id: string
  name: string
  termNumber: number
  academicYearId: string
}

interface ScheduleFormData {
  classId: string
  subjectId: string
  teacherId: string
  day: string
  period: string
  room: string
}

interface TimetableClientProps {
  initialClasses: Class[]
  initialSubjects: Subject[]
  initialTeachers: Teacher[]
  initialAcademicTerms: AcademicTerm[]
  initialPeriods: Period[]
  schoolId: string
  academicYearId: string
  academicTermId: string
}

interface PeriodMenuProps {
  period: Period
  onEdit: (period: Period) => void
}

function PeriodMenu({ period, onEdit }: PeriodMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onEdit(period)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TimetableClient({
  initialClasses,
  initialSubjects,
  initialTeachers,
  initialAcademicTerms,
  initialPeriods,
  schoolId,
  academicYearId,
  academicTermId,
}: TimetableClientProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")
  const [selectedRoom, setSelectedRoom] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [periodsDialogOpen, setPeriodsDialogOpen] = useState(false)
  const [periods, setPeriods] = useState<Period[]>(initialPeriods)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | undefined>(undefined)
  const [settings, setSettings] = useState({
    showRoomNumbers: true,
    showTeacherNames: true,
    showClassNames: true,
    periodDuration: 60,
  })
  const [isPrinting, setIsPrinting] = useState(false)

  const fetchSchedules = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/timetable?schoolId=${schoolId}&academicYearId=${academicYearId}&academicTermId=${academicTermId}`)
      const data = await response.json()
      console.log('Fetched schedules:', data) // Debug log
      setSchedules(data)
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setIsLoading(false)
    }
  }, [schoolId, academicYearId, academicTermId])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  useEffect(() => {
    let filtered = schedules

    if (selectedClass) {
      filtered = filtered.filter(s => s.classId === selectedClass)
    }

    if (selectedTeacher) {
      filtered = filtered.filter(s => s.teacherId === selectedTeacher)
    }

    if (selectedTerm) {
      filtered = filtered.filter(s => s.academicTermId === selectedTerm)
    }

    setFilteredSchedules(filtered)
  }, [schedules, selectedClass, selectedTeacher, selectedTerm])

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId)
    const selectedClassData = initialClasses.find(c => c.id === classId)
    if (selectedClassData) {
      setSelectedRoom(selectedClassData.room || "")
    }
  }

  const handleAddSchedule = async (data: ScheduleFormData) => {
    try {
      const response = await fetch('/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          schoolId,
          academicYearId,
          academicTermId,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        if (response.status === 409) {
          // Handle conflict errors
          if (result.code === 'SCHEDULE_CONFLICT') {
            toast.error("Schedule Conflict", {
              description: "This time slot is already taken for this class."
            })
          } else if (result.code === 'TEACHER_CONFLICT') {
            toast.error("Teacher Schedule Conflict", {
              description: "The selected teacher is already scheduled for this period."
            })
          }
          return
        }
        throw new Error(result.error || 'Failed to create schedule')
      }
      
      await fetchSchedules()
      toast.success("Schedule Created", {
        description: "The schedule has been successfully created."
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error("Error", {
        description: "Failed to create schedule. Please try again."
      })
    }
  }

  const handleEditSchedule = async (data: ScheduleFormData & { id: string }) => {
    try {
      const response = await fetch(`/api/timetable/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          schoolId,
          academicYearId,
          academicTermId,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        if (response.status === 409) {
          // Handle conflict errors
          if (result.code === 'SCHEDULE_CONFLICT') {
            toast.error("Schedule Conflict", {
              description: "This time slot is already taken for this class."
            })
          } else if (result.code === 'TEACHER_CONFLICT') {
            toast.error("Teacher Schedule Conflict", {
              description: "The selected teacher is already scheduled for this period."
            })
          }
          return
        }
        throw new Error(result.error || 'Failed to update schedule')
      }
      
      await fetchSchedules()
      toast.success("Schedule Updated", {
        description: "The schedule has been successfully updated."
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast.error("Error", {
        description: "Failed to update schedule. Please try again."
      })
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    await deleteTimetable(id)
    fetchSchedules()
  }

  const handlePrint = async () => {
    const toastId = toast.loading("Generating PDF...", {
      description: "Please wait while we generate your timetable."
    })

    try {
      const pdfDoc = (
        <TimetablePDF
          schedules={schedules}
          classes={initialClasses}
          subjects={initialSubjects}
          teachers={initialTeachers}
          periods={periods}
          selectedClass={selectedClass}
          selectedTeacher={selectedTeacher}
          selectedTerm={selectedTerm}
          showRoomNumbers={settings.showRoomNumbers}
          showTeacherNames={settings.showTeacherNames}
          showClassNames={settings.showClassNames}
          periodDuration={settings.periodDuration}
          view="weekly"
        />
      )
      const blob = await generatePDF(pdfDoc)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'timetable.pdf'
      link.click()
      URL.revokeObjectURL(url)

      toast.success("PDF generated successfully", {
        description: "Your timetable has been downloaded.",
        id: toastId
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error("Failed to generate PDF", {
        description: "Please try again.",
        id: toastId
      })
    }
  }

  const handlePeriodsSuccess = async () => {
    try {
      const response = await fetch('/api/periods')
      const data = await response.json()
      setPeriods(data)
    } catch (error) {
      console.error('Error fetching periods:', error)
      toast.error('Failed to refresh periods')
    }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const classPeriods = periods.filter(p => p.type === 'class')

  const renderScheduleCell = (day: string, period: Period) => {
    if (isLoading) {
      return (
        <div className="p-2 rounded bg-gray-100 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      )
    }

    const schedule = filteredSchedules.find(s => 
      s.day === day.toLowerCase() && 
      s.period === period.id
    )
    
    if (!schedule) return null

    const subject = initialSubjects.find(s => s.id === schedule.subjectId)
    const teacher = initialTeachers.find(t => t.id === schedule.teacherId)
    const classData = initialClasses.find(c => c.id === schedule.classId)

    return (
      <div
        className="p-2 rounded bg-blue-50 hover:bg-blue-100 cursor-pointer"
        onClick={() => setSelectedSchedule(schedule)}
      >
        <div className="text-sm font-medium">{subject?.name || schedule.subjectId}</div>
        {settings.showTeacherNames && (
          <div className="text-xs text-gray-500">{teacher?.name || schedule.teacherId}</div>
        )}
        {settings.showClassNames && settings.showRoomNumbers && (
          <div className="text-xs text-gray-500">
            {classData?.name} - Room: {schedule.room}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap items-start sm:items-center">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={selectedClass} onValueChange={handleClassChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {initialClasses.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select a teacher" />
            </SelectTrigger>
            <SelectContent>
              {initialTeachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              {initialAcademicTerms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedClass("")
              setSelectedTeacher("")
              setSelectedTerm("")
            }}
            className="whitespace-nowrap"
          >
            Reset Filters
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsSettingsOpen(true)}
            className="whitespace-nowrap"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              setSelectedPeriod(undefined)
              setPeriodsDialogOpen(true)
            }}
            className="whitespace-nowrap"
          >
            <Clock className="w-4 h-4 mr-2" />
            Manage Periods
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handlePrint}
            disabled={isPrinting}
            className="whitespace-nowrap"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            onClick={() => {
              setSelectedSchedule(null)
              setIsDialogOpen(true)
            }}
            className="whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="class">Class View</TabsTrigger>
          <TabsTrigger value="teacher">Teacher View</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Weekly Schedule</CardTitle>
                <div className="flex gap-2">
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {initialClasses.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Term" />
                    </SelectTrigger>
                    <SelectContent>
                      {initialAcademicTerms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-w-[calc(100vw-4rem)]">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-100 w-32">Time</th>
                      {days.map((day) => (
                        <th key={day} className="border p-2 bg-gray-100 w-[calc((100%-8rem)/5)]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period.id} className={period.type === 'break' ? 'bg-gray-50' : ''}>
                        <td className="border p-2 w-32">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{period.time}</div>
                              <div className="text-xs text-gray-500">{period.label}</div>
                            </div>
                            <PeriodMenu
                              period={period}
                              onEdit={(period) => {
                                console.log("Editing period:", period);
                                setSelectedPeriod(period);
                                console.log("Selected period state potentially set, opening dialog...");
                                setPeriodsDialogOpen(true);
                              }}
                            />
                          </div>
                        </td>
                        {days.map((day) => (
                          <td key={day} className="border p-2 w-[calc((100%-8rem)/5)]">
                            {period.type === 'class' && renderScheduleCell(day, period)}
                            {period.type === 'break' && (
                              <div className="text-sm text-center text-gray-500">Break</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Class Schedule</CardTitle>
                <Select value={selectedClass} onValueChange={handleClassChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialClasses.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-w-[calc(100vw-4rem)]">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-100 w-32">Time</th>
                      {days.map((day) => (
                        <th key={day} className="border p-2 bg-gray-100 w-[calc((100%-8rem)/5)]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period.id} className={period.type === 'break' ? 'bg-gray-50' : ''}>
                        <td className="border p-2 w-32">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{period.time}</div>
                              <div className="text-xs text-gray-500">{period.label}</div>
                            </div>
                            <PeriodMenu
                              period={period}
                              onEdit={(period) => {
                                console.log("Editing period:", period);
                                setSelectedPeriod(period);
                                console.log("Selected period state potentially set, opening dialog...");
                                setPeriodsDialogOpen(true);
                              }}
                            />
                          </div>
                        </td>
                        {days.map((day) => (
                          <td key={day} className="border p-2 w-[calc((100%-8rem)/5)]">
                            {period.type === 'class' && renderScheduleCell(day, period)}
                            {period.type === 'break' && (
                              <div className="text-sm text-center text-gray-500">Break</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Teacher Schedule</CardTitle>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-w-[calc(100vw-4rem)]">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-100 w-32">Time</th>
                      {days.map((day) => (
                        <th key={day} className="border p-2 bg-gray-100 w-[calc((100%-8rem)/5)]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period.id} className={period.type === 'break' ? 'bg-gray-50' : ''}>
                        <td className="border p-2 w-32">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{period.time}</div>
                              <div className="text-xs text-gray-500">{period.label}</div>
                            </div>
                            <PeriodMenu
                              period={period}
                              onEdit={(period) => {
                                console.log("Editing period:", period);
                                setSelectedPeriod(period);
                                console.log("Selected period state potentially set, opening dialog...");
                                setPeriodsDialogOpen(true);
                              }}
                            />
                          </div>
                        </td>
                        {days.map((day) => (
                          <td key={day} className="border p-2 w-[calc((100%-8rem)/5)]">
                            {period.type === 'class' && renderScheduleCell(day, period)}
                            {period.type === 'break' && (
                              <div className="text-sm text-center text-gray-500">Break</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ScheduleDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={selectedSchedule ? handleEditSchedule : handleAddSchedule}
        onEdit={handleEditSchedule}
        initialData={selectedSchedule}
        classes={initialClasses}
        subjects={initialSubjects}
        teachers={initialTeachers}
        periods={periods.filter(p => p.type === 'class')}
        selectedRoom={selectedRoom}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onSave={setSettings}
        initialSettings={settings}
      />

      <PeriodsDialog
        isOpen={periodsDialogOpen}
        onClose={() => setPeriodsDialogOpen(false)}
        period={selectedPeriod}
        schoolId={schoolId}
        onSuccess={handlePeriodsSuccess}
      />
    </div>
  )
} 