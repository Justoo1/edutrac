import { TimetableClient } from "./timetable-client"
import { getClasses, getSubjects, getTeachers, getAcademicYear, getAcademicTerm, getPeriods } from "@/lib/fetchers"
import { getSession } from "@/lib/auth"
import { eq, asc } from "drizzle-orm"
import db from "@/lib/db"
import { academicTerms } from "@/lib/schema"

export const dynamic = 'force-dynamic';

export default async function TimetablePage() {
  const [classes, subjects, teachers, periods] = await Promise.all([
    getClasses(),
    getSubjects(),
    getTeachers(),
    getPeriods(),
  ])

  const session = await getSession()
  const schoolId = session?.user.schoolId
  if (!schoolId) {
    return <div>No school ID found</div>
  }

  const academicYear = await getAcademicYear(schoolId)
  if (!academicYear) {
    return <div>No academic year found</div>
  }

  const terms = await db.query.academicTerms.findMany({
    where: eq(academicTerms.academicYearId, academicYear.id),
    orderBy: asc(academicTerms.termNumber)
  })

  if (!terms) {
    return <div>No academic terms found</div>
  }

  // Ensure we're passing only the necessary data
  const initialClasses = classes.map(c => ({
    id: c.id,
    name: c.name,
    room: c.room
  }))

  const initialSubjects = subjects.map(s => ({
    id: s.id,
    name: s.name
  }))

  const initialTeachers = teachers.map(t => ({
    id: t.id,
    name: t.name,
    classesTaught: t.classesTaught?.map(ct => ({
      subject: {
        id: ct.subject.id
      }
    })) || []
  }))

  const initialPeriods = periods.map(p => ({
    id: p.id,
    schoolId: p.schoolId,
    time: p.time,
    label: p.label,
    type: p.type as 'class' | 'break',
    orderIndex: p.orderIndex,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }))

  return (
    <TimetableClient 
      initialClasses={initialClasses}
      initialSubjects={initialSubjects}
      initialTeachers={initialTeachers}
      initialPeriods={initialPeriods}
      initialAcademicTerms={terms}
      schoolId={schoolId}
      academicYearId={academicYear.id}
      academicTermId={terms[0].id}
    />
  )
}