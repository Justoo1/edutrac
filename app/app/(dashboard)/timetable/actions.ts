'use server'

import db from "@/lib/db"
import { timetables } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export async function getTimetables(schoolId: string, academicYearId: string, academicTermId: string) {
  return await db.query.timetables.findMany({
    where: and(
      eq(timetables.schoolId, schoolId),
      eq(timetables.academicYearId, academicYearId),
      eq(timetables.academicTermId, academicTermId)
    ),
    with: {
      class: true,
      subject: true,
      teacher: true,
    }
  })
}

export async function addTimetable(data: {
  schoolId: string
  classId: string
  subjectId: string
  teacherId: string
  day: string
  period: string
  room: string
  academicYearId: string
  academicTermId: string
}) {
  return await db.insert(timetables).values(data)
}

export async function updateTimetable(
  id: string,
  data: {
    classId: string
    subjectId: string
    teacherId: string
    day: string
    period: string
    room: string
  }
) {
  return await db
    .update(timetables)
    .set(data)
    .where(eq(timetables.id, id))
}

export async function deleteTimetable(id: string) {
  return await db.delete(timetables).where(eq(timetables.id, id))
} 