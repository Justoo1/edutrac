import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { TeacherForm } from "@/components/dashboard/teachers/teacher-form"
import db from "@/lib/db"
import { staff } from "@/lib/schema"
import { eq } from "drizzle-orm"

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession()
  
  if (!session?.user || session.user.role !== "admin") {
    redirect("/teachers")
  }

  const { id } = await params;
  const teacher = await db.query.staff.findFirst({
    where: eq(staff.id, id),
    with: {
      user: true,
    },
  })

  if (!teacher) {
    redirect("/teachers")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Teacher</h1>
      </div>
      <TeacherForm teacher={teacher} />
    </div>
  )
} 