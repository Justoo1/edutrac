"use client"

import { useEffect, useState } from "react"
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
import { SelectClass, SelectSchool } from "@/lib/schema"
import { getSession } from "@/lib/auth"
import { string } from "zod"

export function DeleteClassroomDialog({
  children,
  classroom,
}: {
  children: React.ReactNode
  classroom: SelectClass
}) {
  const [open, setOpen] = useState(false)
  const [school, setSchool] = useState<SelectSchool>();
  const [schoolId, setSchooId] = useState<string | undefined>(undefined);
  const router = useRouter()

  getSession().then((res) => {
    const user = res?.user;
    setSchooId(user?.schoolId);
  });

  useEffect(() => {
    if (schoolId) {
      fetch(`/api/schools/${schoolId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch school");
          }
          return response.json();
        })
        .then(data => {
          setSchool(data);
        })
        .catch(error => {
          console.error(error);
        });
    }
  }, [schoolId]);

  async function handleDelete() {
    if (!school) {
      throw new Error("School data is not available");
    }
    try {
      const formData = new FormData()
      formData.append("id", classroom.id)

      const result = await deleteClass(formData, school, 'class')
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
            Are you sure you want to delete the classroom &quot;{classroom.name}&quot;? This action cannot be undone.
            {/* TODO: Add a warning if the classroom has enrolled students */}
            {/* {classroom.enrollments?.length ? (
              <div className="mt-2 text-sm text-yellow-600">
                Warning: This classroom has {classroom.enrollments.length} enrolled students. Deleting it will remove all associated enrollments.
              </div>
            ) : null} */}
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