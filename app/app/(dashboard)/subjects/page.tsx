import { getSession } from "@/lib/auth"
import db from "@/lib/db"
import { schools, subjects as subjectsTable, studentSubjects } from "@/lib/schema"
import { eq, count } from "drizzle-orm"
import { redirect } from "next/navigation"
import SubjectsPageClient, { SubjectsPageClientProps } from "./client"

export default async function SubjectsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    return redirect("/login")
  }
  
  // Get the first school owned by this user
  const school = await db.query.schools.findFirst({
    where: (schools, { eq }) => eq(schools.adminId, session.user.id)
  })

  if (!school) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">No School Found</h2>
        <p className="text-muted-foreground">
          You don&apos;t have a school configured. Please set up your school first.
        </p>
      </div>
    )
  }

  // Determine school type from the database
  const schoolType = school.schoolType === 'SHS' ? 'SHS' : 'Basic'

  // Fetch subject statistics
  const totalSubjectsResult = await db
    .select({ count: count() })
    .from(subjectsTable)
    .where(eq(subjectsTable.schoolId, school.id))

  const totalSubjects = totalSubjectsResult[0]?.count || 0

  // Fetch total student enrollments by joining with subjects
  const studentEnrollmentsResult = await db
    .select({ count: count() })
    .from(studentSubjects)
    .innerJoin(subjectsTable, eq(studentSubjects.subjectId, subjectsTable.id))
    .where(eq(subjectsTable.schoolId, school.id))

  const totalStudentEnrollments = studentEnrollmentsResult[0]?.count || 0
  
  return (
    <SubjectsPageClient 
      schoolId={school.id} 
      schoolType={schoolType}
      initialStats={{
        totalSubjects,
        courseLinkedSubjects: schoolType === 'SHS' ? Math.floor(totalSubjects * 0.7) : 0,
        studentEnrollments: totalStudentEnrollments
      }}
    />
  )
}