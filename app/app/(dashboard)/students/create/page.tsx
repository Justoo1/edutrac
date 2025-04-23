import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { CreateStudentForm } from "../components/create-student-form"
import db from "@/lib/db"
import { eq } from "drizzle-orm"
import { schools } from "@/lib/schema"

export default async function CreateStudentPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const school = await db.query.schools.findFirst({
    where: eq(schools.adminId, session.user.id),
  })

  if (!school) {
    redirect('/onboarding')
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Add New Student</h1>
        <CreateStudentForm school={school} />
      </div>
    </div>
  )
} 