"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TeacherForm } from "./teacher-form"
import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CreateTeacherModal() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        if (response.status === 400 && responseData.error?.includes("Email already exists")) {
          throw new Error(responseData.message || `The email "${data.email}" is already registered in the system. Please use a different email address.`)
        }
        throw new Error(responseData.error || "Failed to create teacher")
      }

      toast.success("Teacher created successfully")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to create teacher")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (isLoading) return; // Prevent closing while loading
      setOpen(newOpen);
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Teacher</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new teacher to your school.
          </DialogDescription>
        </DialogHeader>
        <TeacherForm onSubmit={onSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  )
} 