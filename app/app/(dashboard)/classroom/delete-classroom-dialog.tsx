"use client"

import { useState } from "react"
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
import { deleteClass } from "@/lib/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { SelectClass } from "@/lib/schema"

export function DeleteClassroomDialog({
  children,
  classroom,
}: {
  children: React.ReactNode
  classroom: SelectClass
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    try {
      const formData = new FormData()
      formData.append("id", classroom.id)

      const result = await deleteClass(formData)
      if (result.error) {
        throw new Error(result.error)
      }

      toast.success("Classroom deleted successfully")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Classroom</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the classroom "{classroom.name}"? This action cannot be undone.
            {classroom.enrollments?.length ? (
              <div className="mt-2 text-sm text-yellow-600">
                Warning: This classroom has {classroom.enrollments.length} enrolled students. Deleting it will remove all associated enrollments.
              </div>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Classroom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 