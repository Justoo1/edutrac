// Update your attendance query in the server action to get current year data instead of just 7 days:

// Recent attendance data - get current year data for filtering
db.select({
  date: sql<string>`DATE(${attendance.date})`,
  status: attendance.status,
  count: sql<number>`CAST(count(*) AS INTEGER)`
})
  .from(attendance)
  .leftJoin(students, eq(attendance.studentId, students.id))
  .where(and(
    eq(students.schoolId, school.id),
    sql`EXTRACT(YEAR FROM ${attendance.date}) = EXTRACT(YEAR FROM CURRENT_DATE)` // Current year data
  ))
  .groupBy(sql`DATE(${attendance.date})`, attendance.status)
  .orderBy(asc(sql`DATE(${attendance.date})`)), // Order ascending for better filtering
