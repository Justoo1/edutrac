"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Eye, Trash, BookOpen, GraduationCap, Activity, FlaskConical, Car, Library, Calculator, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import useSWR from 'swr'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Hook to fetch classes
function useClasses(schoolId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/classes?schoolId=${schoolId}` : null,
    fetcher
  )

  return {
    classes: (data as any[]) || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Hook to fetch academic years
function useAcademicYears(schoolId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/schools/${schoolId}/academic/years` : null,
    fetcher
  )

  return {
    academicYears: (data as any[]) || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Hook to fetch fee structures
function useFeeStructures(schoolId: string, filters?: {
  academicYear?: string;
  level?: string;
}) {
  const searchParams = new URLSearchParams()
  searchParams.append('schoolId', schoolId)
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) searchParams.append(key, value)
    })
  }

  const { data, error, isLoading, mutate } = useSWR(
    schoolId ? `/api/finance/fee-structures?${searchParams.toString()}` : null,
    fetcher
  )

  return {
    feeStructures: (data as any[]) || [],
    isLoading,
    isError: error,
    mutate
  }
}

const feeCategories = [
  { name: "Tuition", icon: BookOpen, description: "Core academic instruction fees" },
  { name: "Activities", icon: Activity, description: "Sports, clubs, and extracurricular activities" },
  { name: "Examination", icon: GraduationCap, description: "Assessment and examination fees" },
  { name: "Library", icon: Library, description: "Library access and resources" },
  { name: "Laboratory", icon: FlaskConical, description: "Science laboratory usage and materials" },
  { name: "Transport", icon: Car, description: "School bus transportation services" }
]

export function FeeStructureManagement() {
  const { data: session } = useSession()
  const schoolId = session?.user?.schoolId || ""
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedStructure, setSelectedStructure] = useState<any>(null)
  const [showAddStructureDialog, setShowAddStructureDialog] = useState(false)
  const [showEditStructureDialog, setShowEditStructureDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [structureToDelete, setStructureToDelete] = useState<any>(null)
  const [editingStructure, setEditingStructure] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form state for adding new fee structure
  const [feeForm, setFeeForm] = useState({
    className: "",
    level: "",
    academicYear: "",
    tuitionFee: 0,
    activitiesFee: 0,
    examinationFee: 0,
    libraryFee: 0,
    laboratoryFee: 0,
    transportFee: 0,
    studentsEnrolled: 0
  })

  // Fetch data
  const { classes, isLoading: classesLoading } = useClasses(schoolId)
  const { academicYears, isLoading: yearsLoading } = useAcademicYears(schoolId)
  const { feeStructures, isLoading: structuresLoading, mutate } = useFeeStructures(schoolId, {
    academicYear: selectedYear,
    level: selectedLevel
  })

  // Auto-populate student count when class is selected
  useEffect(() => {
    if (feeForm.className && classes.length > 0) {
      const selectedClass = classes.find((cls: any) => cls.name === feeForm.className)
      if (selectedClass) {
        console.log('🎯 Selected class:', selectedClass.name, 'Enrollment count:', selectedClass.enrollmentCount)
        setFeeForm(prev => ({ ...prev, studentsEnrolled: selectedClass.enrollmentCount || 0 }))
      } else {
        console.log('❌ Class not found:', feeForm.className, 'Available classes:', classes.map(c => c.name))
      }
    } else {
      console.log('📊 Classes data:', { classNameSelected: feeForm.className, classesLength: classes.length })
    }
  }, [feeForm.className, classes])

  // Set default academic year when data loads
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const currentYear = academicYears.find(year => year.isCurrent) || academicYears[0]
      setSelectedYear(currentYear.name)
      setFeeForm(prev => ({ ...prev, academicYear: currentYear.name }))
    }
  }, [academicYears, selectedYear])

  // Extract unique grade levels from classes
  const gradeLevels = Array.from(
    new Set(
      classes
        .map((cls: any) => cls.gradeLevel)
        .filter((level): level is string => typeof level === 'string' && level.length > 0)
    )
  ).sort()

  const filteredStructures = feeStructures.filter(structure => {
    const matchesSearch = structure.className.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleCreateFeeStructure = async () => {
    if (!feeForm.className || !feeForm.level || !feeForm.academicYear) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/finance/fee-structures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feeForm,
          schoolId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create fee structure')
      }

      toast.success("Fee structure created successfully")
      setShowAddStructureDialog(false)
      setFeeForm({
        className: "",
        level: "",
        academicYear: selectedYear,
        tuitionFee: 0,
        activitiesFee: 0,
        examinationFee: 0,
        libraryFee: 0,
        laboratoryFee: 0,
        transportFee: 0,
        studentsEnrolled: 0
      })
      mutate() // Refresh data
    } catch (error) {
      toast.error("Failed to create fee structure")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditStructure = (structure: any) => {
    setEditingStructure(structure)
    setFeeForm({
      className: structure.className,
      level: structure.level,
      academicYear: structure.academicYear,
      tuitionFee: structure.tuitionFee || 0,
      activitiesFee: structure.activitiesFee || 0,
      examinationFee: structure.examinationFee || 0,
      libraryFee: structure.libraryFee || 0,
      laboratoryFee: structure.laboratoryFee || 0,
      transportFee: structure.transportFee || 0,
      studentsEnrolled: structure.studentsEnrolled || 0
    })
    setShowEditStructureDialog(true)
  }

  const handleUpdateFeeStructure = async () => {
    if (!feeForm.className || !feeForm.level || !feeForm.academicYear || !editingStructure) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/finance/fee-structures/${editingStructure.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feeForm,
          schoolId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update fee structure')
      }

      toast.success("Fee structure updated successfully")
      setShowEditStructureDialog(false)
      setEditingStructure(null)
      setFeeForm({
        className: "",
        level: "",
        academicYear: selectedYear,
        tuitionFee: 0,
        activitiesFee: 0,
        examinationFee: 0,
        libraryFee: 0,
        laboratoryFee: 0,
        transportFee: 0,
        studentsEnrolled: 0
      })
      mutate() // Refresh data
    } catch (error) {
      toast.error("Failed to update fee structure")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteStructure = (structure: any) => {
    setStructureToDelete(structure)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!structureToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/finance/fee-structures/${structureToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete fee structure')
      }

      toast.success("Fee structure deleted successfully")
      setShowDeleteDialog(false)
      setStructureToDelete(null)
      mutate() // Refresh data
    } catch (error) {
      toast.error("Failed to delete fee structure")
    } finally {
      setIsDeleting(false)
    }
  }

  const totalStudents = feeStructures.reduce((sum, structure) => sum + (structure.studentsEnrolled || 0), 0)
  const averageFee = feeStructures.length > 0 ? feeStructures.reduce((sum, structure) => sum + (structure.totalFee || 0), 0) / feeStructures.length : 0
  const totalRevenuePotential = feeStructures.reduce((sum, structure) => sum + ((structure.totalFee || 0) * (structure.studentsEnrolled || 0)), 0)

  if (structuresLoading || classesLoading || yearsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fee Structure Management</h2>
          <p className="text-muted-foreground">Manage fee structures for different classes and academic levels</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddStructureDialog} onOpenChange={setShowAddStructureDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Fee Structure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-scroll">
              <DialogHeader>
                <DialogTitle>Add New Fee Structure</DialogTitle>
                <DialogDescription>Create a fee structure for a class or academic level</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Class Name *</Label>
                    <Select value={feeForm.className} onValueChange={(value) => 
                      setFeeForm({...feeForm, className: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.name}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Academic Level *</Label>
                    <Select value={feeForm.level} onValueChange={(value) => 
                      setFeeForm({...feeForm, level: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradeLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Academic Year *</Label>
                  <Select value={feeForm.academicYear} onValueChange={(value) => 
                    setFeeForm({...feeForm, academicYear: value})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year: any) => (
                        <SelectItem key={year.id} value={year.name}>
                          {year.name} {year.isCurrent && '(Current)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Tuition Fee (GH₵)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={feeForm.tuitionFee || ""}
                      onChange={(e) => setFeeForm({...feeForm, tuitionFee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Activities Fee (GH₵)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={feeForm.activitiesFee || ""}
                      onChange={(e) => setFeeForm({...feeForm, activitiesFee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Examination Fee (GH₵)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={feeForm.examinationFee || ""}
                      onChange={(e) => setFeeForm({...feeForm, examinationFee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Library Fee (GH₵)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={feeForm.libraryFee || ""}
                      onChange={(e) => setFeeForm({...feeForm, libraryFee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Laboratory Fee (GH₵)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={feeForm.laboratoryFee || ""}
                      onChange={(e) => setFeeForm({...feeForm, laboratoryFee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Transport Fee (GH₵)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={feeForm.transportFee || ""}
                      onChange={(e) => setFeeForm({...feeForm, transportFee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Students Enrolled</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={feeForm.studentsEnrolled || ""}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {feeForm.className 
                      ? `Auto-populated from ${feeForm.className} (${feeForm.studentsEnrolled || 0} students)`
                      : "Auto-populated from selected class enrollment"
                    }
                  </p>
                </div>
                
                {/* Total Fee Display */}
                <div className="p-4 bg-blue-50 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-700">Total Fee:</span>
                    <span className="text-xl font-bold text-blue-700">
                      GH₵{(
                        (feeForm.tuitionFee || 0) + 
                        (feeForm.activitiesFee || 0) + 
                        (feeForm.examinationFee || 0) + 
                        (feeForm.libraryFee || 0) + 
                        (feeForm.laboratoryFee || 0) + 
                        (feeForm.transportFee || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddStructureDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFeeStructure} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Fee Structure"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Fee Structure Dialog */}
      <Dialog open={showEditStructureDialog} onOpenChange={setShowEditStructureDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-scroll">
          <DialogHeader>
            <DialogTitle>Edit Fee Structure</DialogTitle>
            <DialogDescription>Update the fee structure for {editingStructure?.className}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Class Name *</Label>
                <Select value={feeForm.className} onValueChange={(value) => 
                  setFeeForm({...feeForm, className: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Level *</Label>
                <Select value={feeForm.level} onValueChange={(value) => 
                  setFeeForm({...feeForm, level: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Academic Year *</Label>
              <Select value={feeForm.academicYear} onValueChange={(value) => 
                setFeeForm({...feeForm, academicYear: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year: any) => (
                    <SelectItem key={year.id} value={year.name}>
                      {year.name} {year.isCurrent && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Tuition Fee (GH₵)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={feeForm.tuitionFee || ""}
                  onChange={(e) => setFeeForm({...feeForm, tuitionFee: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Activities Fee (GH₵)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={feeForm.activitiesFee || ""}
                  onChange={(e) => setFeeForm({...feeForm, activitiesFee: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Examination Fee (GH₵)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={feeForm.examinationFee || ""}
                  onChange={(e) => setFeeForm({...feeForm, examinationFee: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Library Fee (GH₵)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={feeForm.libraryFee || ""}
                  onChange={(e) => setFeeForm({...feeForm, libraryFee: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Laboratory Fee (GH₵)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={feeForm.laboratoryFee || ""}
                  onChange={(e) => setFeeForm({...feeForm, laboratoryFee: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Transport Fee (GH₵)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={feeForm.transportFee || ""}
                  onChange={(e) => setFeeForm({...feeForm, transportFee: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div>
              <Label>Students Enrolled</Label>
              <Input 
                type="number" 
                placeholder="0"
                value={feeForm.studentsEnrolled || ""}
                readOnly
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {feeForm.className 
                  ? `Auto-populated from ${feeForm.className} (${feeForm.studentsEnrolled || 0} students)`
                  : "Auto-populated from selected class enrollment"
                }
              </p>
            </div>
            
            {/* Total Fee Display */}
            <div className="p-4 bg-blue-50 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-700">Total Fee:</span>
                <span className="text-xl font-bold text-blue-700">
                  GH₵{(
                    (feeForm.tuitionFee || 0) + 
                    (feeForm.activitiesFee || 0) + 
                    (feeForm.examinationFee || 0) + 
                    (feeForm.libraryFee || 0) + 
                    (feeForm.laboratoryFee || 0) + 
                    (feeForm.transportFee || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditStructureDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFeeStructure} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Fee Structure"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Structure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the fee structure for {structureToDelete?.className}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold">{feeStructures.length}</p>
              </div>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Fee</p>
                <p className="text-2xl font-bold">GH₵{Math.round(averageFee).toLocaleString()}</p>
              </div>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Potential</p>
                <p className="text-2xl font-bold text-green-600">GH₵{totalRevenuePotential.toLocaleString()}</p>
              </div>
              <Calculator className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Categories</CardTitle>
          <CardDescription>Overview of different fee types and their purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {feeCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <div key={category.name} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by class name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {gradeLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year: any) => (
                  <SelectItem key={year.id} value={year.name}>
                    {year.name} {year.isCurrent && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Structures</CardTitle>
          <CardDescription>Current fee structures for all classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Tuition</TableHead>
                  <TableHead>Activities</TableHead>
                  <TableHead>Examination</TableHead>
                  <TableHead>Other Fees</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStructures.map((structure) => (
                  <TableRow key={structure.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{structure.className}</div>
                        <div className="text-xs text-muted-foreground">{structure.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{structure.level}</TableCell>
                    <TableCell>{structure.studentsEnrolled || 0}</TableCell>
                    <TableCell>GH₵{(structure.tuitionFee || 0).toLocaleString()}</TableCell>
                    <TableCell>GH₵{(structure.activitiesFee || 0).toLocaleString()}</TableCell>
                    <TableCell>GH₵{(structure.examinationFee || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      GH₵{((structure.libraryFee || 0) + (structure.laboratoryFee || 0) + (structure.transportFee || 0)).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">GH₵{(structure.totalFee || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {structure.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedStructure(structure)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Fee Structure Details</DialogTitle>
                              <DialogDescription>
                                Complete breakdown for {structure.className}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedStructure && (
                              <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">Class Information</Label>
                                    <div className="mt-2 space-y-2">
                                      <p><span className="font-medium">Class:</span> {selectedStructure.className}</p>
                                      <p><span className="font-medium">Level:</span> {selectedStructure.level}</p>
                                      <p><span className="font-medium">Academic Year:</span> {selectedStructure.academicYear}</p>
                                      <p><span className="font-medium">Students Enrolled:</span> {selectedStructure.studentsEnrolled || 0}</p>
                                      <p><span className="font-medium">Last Updated:</span> {new Date(selectedStructure.updatedAt || selectedStructure.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Revenue Analysis</Label>
                                    <div className="mt-2 space-y-2">
                                      <p><span className="font-medium">Per Student:</span> GH₵{(selectedStructure.totalFee || 0).toLocaleString()}</p>
                                      <p><span className="font-medium">Total Potential:</span> GH₵{((selectedStructure.totalFee || 0) * (selectedStructure.studentsEnrolled || 0)).toLocaleString()}</p>
                                      <p><span className="font-medium">Monthly (10 months):</span> GH₵{Math.round(((selectedStructure.totalFee || 0) * (selectedStructure.studentsEnrolled || 0)) / 10).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">Fee Breakdown</Label>
                                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                      <span className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        Tuition:
                                      </span>
                                      <span>GH₵{(selectedStructure.tuitionFee || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                      <span className="flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Activities:
                                      </span>
                                      <span>GH₵{(selectedStructure.activitiesFee || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                      <span className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4" />
                                        Examination:
                                      </span>
                                      <span>GH₵{(selectedStructure.examinationFee || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                      <span className="flex items-center gap-2">
                                        <Library className="h-4 w-4" />
                                        Library:
                                      </span>
                                      <span>GH₵{(selectedStructure.libraryFee || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                      <span className="flex items-center gap-2">
                                        <FlaskConical className="h-4 w-4" />
                                        Laboratory:
                                      </span>
                                      <span>GH₵{(selectedStructure.laboratoryFee || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                      <span className="flex items-center gap-2">
                                        <Car className="h-4 w-4" />
                                        Transport:
                                      </span>
                                      <span>GH₵{(selectedStructure.transportFee || 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200 mt-4">
                                    <span className="font-bold text-blue-700 flex items-center gap-2">
                                      <Calculator className="h-4 w-4" />
                                      Total Fee:
                                    </span>
                                    <span className="font-bold text-blue-700">GH₵{(selectedStructure.totalFee || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleEditStructure(structure)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleDeleteStructure(structure)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}