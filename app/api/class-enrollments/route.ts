// import { NextResponse } from "next/server"
// import { getSession } from "@/lib/auth"
// import db from "@/lib/db"
// import { eq, and } from "drizzle-orm"
// import { classEnrollments } from "@/lib/schema"

// export async function GET(request: Request) {
//   try {
//     const session = await getSession()
//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const url = new URL(request.url)
//     const schoolId = url.searchParams.get("schoolId")

//     if (!schoolId) {
//       return NextResponse.json({ error: "School ID is required" }, { status: 400 })
//     }

//     // Check if user has access to this school
//     const school = await db.query.schools.findFirst({
//       where: (schools, { eq }) => eq(schools.adminId, session.user.id)
//     })

//     if (!school || school.adminId !== session.user.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     // Fetch class enrollments with related data
//     const enrollments = await db.query.classEnrollments.findFirst({
//           where: eq(classEnrollments.schoolId, schoolId),
//           with: {
//             student: true,
//             class: true,
//             batch: true
//             }
//         });

//     return NextResponse.json(enrollments)
//   } catch (error) {
//     console.error("Error fetching class enrollments:", error)
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     )
//   }
// } 