import { getTeachers } from "@/lib/fetchers"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { CreateTeacherModal } from "@/components/dashboard/teachers/create-teacher-modal"
import { TeachersClient } from "./teachers-client"

export default async function TeachersPage() {
  const session = await getSession()
  
  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "admin"
  const teachers = await getTeachers() || []
  
  // Extract unique departments for filter options
  const departments = [...new Set(teachers.map(teacher => teacher.department).filter(Boolean))] as string[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Teachers List</h1>
        <div className="flex items-center gap-2">
          {isAdmin && <CreateTeacherModal />}
        </div>
      </div>
      
      <TeachersClient teachers={teachers} isAdmin={isAdmin} departments={departments} />
    </div>
  )
}

