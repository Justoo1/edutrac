// import { NextResponse } from "next/server";
// import { getSession } from "@/lib/auth";
// import db from "@/lib/db";
// import { examPeriods } from "@/lib/schema";
// import { eq, and } from "drizzle-orm";

// export async function GET(req: Request) {
//   try {
//     const session = await getSession();
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const schoolId = searchParams.get("schoolId");

//     if (!schoolId) {
//       return NextResponse.json(
//         { error: "School ID is required" },
//         { status: 400 }
//       );
//     }

//     const periods = await db.query.examPeriods.findMany({
//       where: eq(examPeriods.schoolId, schoolId),
//       orderBy: (periods, { desc }) => [desc(periods.startDate)],
//     });

//     return NextResponse.json(periods);
//   } catch (error) {
//     console.error("[EXAM_PERIODS_GET]", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const session = await getSession();
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const { name, startDate, endDate, schoolId } = body;

//     if (!name || !startDate || !endDate || !schoolId) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const period = await db.insert(examPeriods).values({
//       name,
//       startDate: new Date(startDate),
//       endDate: new Date(endDate),
//       schoolId,
//       isActive: true,
//     }).returning();

//     return NextResponse.json(period[0]);
//   } catch (error) {
//     console.error("[EXAM_PERIODS_POST]", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(req: Request) {
//   try {
//     const session = await getSession();
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const { id, name, startDate, endDate } = body;

//     if (!id || !name || !startDate || !endDate) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const period = await db
//       .update(examPeriods)
//       .set({
//         name,
//         startDate: new Date(startDate),
//         endDate: new Date(endDate),
//       })
//       .where(eq(examPeriods.id, id))
//       .returning();

//     return NextResponse.json(period[0]);
//   } catch (error) {
//     console.error("[EXAM_PERIODS_PUT]", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// } 