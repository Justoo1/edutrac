import { getSession } from "@/lib/auth"
import db from "@/lib/db"
import { schools } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import StudentsPageClient from "./client"

export default async function StudentsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    return redirect("/login")
  }
  
  // Get the first school owned by this user
  // In a real app, you might want to improve this logic
  const school = await db.query.schools.findFirst({
    where: (schools, { eq }) => eq(schools.adminId, session.user.id)
  })
  
  if (!school) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No School Found</h1>
          <p className="mt-2 text-muted-foreground">
            You need to create a school before adding students.
          </p>
        </div>
      </div>
    )
  }
  
  return <StudentsPageClient schoolId={school.id} />
}

