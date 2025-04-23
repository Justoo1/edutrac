"use client"

import { useState } from "react"
import { format } from "date-fns"
import { AttendanceControls } from "./attendance-controls"
import { AttendanceTable } from "./attendance-table"
import { CreateAttendanceSheet } from "./create-attendance-sheet"
import { AttendancePDF } from "./attendance-pdf"
import { pdf } from "@react-pdf/renderer"
import { toast } from "sonner"

export function AttendancePageWrapper() {
  const [viewSelectedClass, setViewSelectedClass] = useState("")
  const [createSelectedClass, setCreateSelectedClass] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))
  const [selectedWeek, setSelectedWeek] = useState("week1")
  const [viewSelectedWeek, setViewSelectedWeek] = useState<string | null>(null)
  const [isCreatingSheet, setIsCreatingSheet] = useState(false)
  const [isEditingSheet, setIsEditingSheet] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleCreateSheet = () => {
    if (!createSelectedClass || !selectedWeek) {
      return
    }
    setIsCreatingSheet(true)
  }

  const handleEditSheet = (classId: string, weekId: string) => {
    setEditingClassId(classId)
    setEditingWeekId(weekId)
    setIsEditingSheet(true)
  }

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      toast.loading("Generating PDF...")

      // Get data from the API
      const response = await fetch(`/api/attendance/pdf?classId=${viewSelectedClass}&month=${selectedMonth}&weekFilter=${viewSelectedWeek}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }

      const data = await response.json()

      // Generate PDF
      const pdfBlob = await pdf(
        <AttendancePDF
          classInfo={data.classInfo}
          students={data.students}
          dates={data.dates}
          month={data.month}
          weekFilter={data.weekFilter}
          createdBy={data.classInfo.createdBy}
        />
      ).toBlob()

      // Create download link with updated filename
      const url = URL.createObjectURL(pdfBlob)
      const weekSuffix = viewSelectedWeek ? `-${viewSelectedWeek}` : '-full-month'
      const link = document.createElement("a")
      link.href = url
      link.download = `attendance-${data.classInfo.name}-${data.month}${weekSuffix}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.dismiss()
      toast.success("PDF generated successfully!")
    } catch (error) {
      console.error("[PDF_GENERATION]", error)
      toast.dismiss()
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-4">
      <AttendanceControls
        viewSelectedClass={viewSelectedClass}
        createSelectedClass={createSelectedClass}
        selectedMonth={selectedMonth}
        selectedWeek={selectedWeek}
        viewSelectedWeek={viewSelectedWeek}
        onViewClassSelect={setViewSelectedClass}
        onCreateClassSelect={setCreateSelectedClass}
        onMonthSelect={setSelectedMonth}
        onWeekSelect={setSelectedWeek}
        onViewWeekSelect={setViewSelectedWeek}
        onCreateSheet={handleCreateSheet}
        onEditSheet={handleEditSheet}
        onGeneratePDF={handleGeneratePDF}
      />
      
      {isCreatingSheet ? (
        <CreateAttendanceSheet
          classId={createSelectedClass}
          weekId={selectedWeek}
          onSuccess={() => {
            setIsCreatingSheet(false)
            setCreateSelectedClass("")
            setSelectedWeek("week1")
            setViewSelectedClass(createSelectedClass)
          }}
          onCancel={() => {
            setIsCreatingSheet(false)
            setCreateSelectedClass("")
            setSelectedWeek("week1")
          }}
        />
      ) : isEditingSheet && editingClassId && editingWeekId ? (
        <CreateAttendanceSheet
          classId={editingClassId}
          weekId={editingWeekId}
          isEditing={true}
          onSuccess={() => {
            setIsEditingSheet(false)
            setEditingClassId(null)
            setEditingWeekId(null)
            // Refresh the view
            const tempClass = viewSelectedClass
            setViewSelectedClass("")
            setTimeout(() => setViewSelectedClass(tempClass), 100)
          }}
          onCancel={() => {
            setIsEditingSheet(false)
            setEditingClassId(null)
            setEditingWeekId(null)
          }}
        />
      ) : (
        viewSelectedClass && selectedMonth ? (
          <AttendanceTable
            classId={viewSelectedClass}
            month={selectedMonth}
            weekFilter={viewSelectedWeek}
          />
        ) : (
          <div className="text-center p-4 text-muted-foreground">
            Select a class and month to view attendance
          </div>
        )
      )}
    </div>
  )
} 