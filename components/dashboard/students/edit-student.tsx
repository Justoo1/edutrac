"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StudentForm } from "@/components/form/student-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: Date | string;
  gender?: string;
  status?: string;
  currentGradeLevel?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  emergencyContact?: string;
  admissionDate?: Date | string;
  contactInfo?: any;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  guardian?: any;
  primaryGuardian?: any;
  guardians?: any[];
}

interface EditStudentProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  schoolId: string;
  onStudentUpdated?: () => void;
}

export function EditStudent({ isOpen, onClose, studentId, schoolId, onStudentUpdated }: EditStudentProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle form submission success
  const handleFormSuccess = useCallback(() => {
    // Call the parent component's callback to refresh data
    if (onStudentUpdated) {
      onStudentUpdated()
    }
    
    // Close the dialog
    onClose()
  }, [onStudentUpdated, onClose])

  useEffect(() => {
    if (isOpen && studentId) {
      const fetchStudentData = async () => {
        setLoading(true)
        setError(null)
        
        try {
          // Real API call to fetch student data
          const response = await fetch(`/api/students/${studentId}?schoolId=${schoolId}`)
          
          if (!response.ok) {
            throw new Error(`Failed to fetch student data: ${response.status}`)
          }
          
          const data = await response.json()
          setStudent(data)
          setLoading(false)
        } catch (err) {
          console.error("Error fetching student:", err)
          setError("Failed to load student details. Please try again.")
          setLoading(false)
          
          // Optional fallback for development/testing
          if (process.env.NODE_ENV === 'development') {
            console.log("Using fallback data in development mode")
            setTimeout(() => {
              setStudent({
                id: studentId,
                studentId: studentId.startsWith("demo") ? "2023-ST-" + studentId.split("-")[1] : studentId,
                firstName: "Sarah",
                lastName: "Miller",
                middleName: "Jane",
                email: "sarahmiller@eduprohigh.edu",
                dateOfBirth: "2008-04-18",
                gender: "female",
                currentGradeLevel: "Grade 10",
                status: "active",
                phone: "(555) 101-0101",
                address: "101 High St, Springfield, IL",
                parentName: "John Miller",
                parentPhone: "(555) 101-0202",
                parentEmail: "johnmiller@example.com",
                emergencyContact: "(555) 101-0303",
                admissionDate: "2022-09-01",
                notes: "Excels in mathematics.",
                guardian: {}
              })
              setLoading(false)
              setError(null)
            }, 1000)
          }
        }
      }
      
      fetchStudentData()
    }
  }, [isOpen, studentId, schoolId])

  // Format date string to Date object
  const formatFormData = (student: Student) => {
    // Fix gender field to match the expected enum type
    let formattedGender: "male" | "female" | "other" | undefined = undefined;
    
    if (student.gender) {
      const gender = student.gender.toLowerCase();
      if (gender === "male" || gender === "female" || gender === "other") {
        formattedGender = gender as "male" | "female" | "other";
      }
    }
    
    // Handle guardian information prioritizing primaryGuardian, then guardian, then direct fields
    const getPrimaryGuardianInfo = () => {
      if (student.primaryGuardian) {
        return {
          parentName: `${student.primaryGuardian.firstName} ${student.primaryGuardian.lastName}`,
          parentPhone: student.primaryGuardian.phone,
          parentEmail: student.primaryGuardian.email,
          emergencyContact: student.primaryGuardian.alternativePhone || student.primaryGuardian.phone
        };
      }
      
      if (student.guardian) {
        return {
          parentName: student.guardian.parentName,
          parentPhone: student.guardian.parentPhone,
          parentEmail: student.guardian.parentEmail,
          emergencyContact: student.guardian.emergencyContact
        };
      }
      
      return {
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        parentEmail: student.parentEmail || '',
        emergencyContact: student.emergencyContact || ''
      };
    };
    
    const guardianInfo = getPrimaryGuardianInfo();
    
    return {
      ...student,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
      admissionDate: student.admissionDate ? new Date(student.admissionDate) : new Date(),
      gender: formattedGender,
      // Map guardian fields 
      ...guardianInfo
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student information and details
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        ) : student ? (
          <StudentForm 
            initialData={formatFormData(student)} 
            schoolId={schoolId}
            onSuccess={handleFormSuccess}
          />
        ) : (
          <div className="p-4 text-center">
            No student data found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 