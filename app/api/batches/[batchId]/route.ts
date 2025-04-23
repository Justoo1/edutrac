import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { batches, batchEnrollments, students } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batchId = params.batchId;
    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Fetch the batch
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
      with: {
        school: true,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Fetch the enrolled students
    const enrollments = await db
      .select({
        enrollment: batchEnrollments,
        student: students,
      })
      .from(batchEnrollments)
      .leftJoin(students, eq(batchEnrollments.studentId, students.id))
      .where(eq(batchEnrollments.batchId, batchId));

    // Format the response
    return NextResponse.json({
      ...batch,
      enrolledStudents: enrollments.map((enrollment) => ({
        enrollmentId: enrollment.enrollment.id,
        enrollmentStatus: enrollment.enrollment.status,
        enrollmentDate: enrollment.enrollment.enrollmentDate,
        student: enrollment.student,
      })),
    });
  } catch (error) {
    console.error("Error fetching batch:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch details" },
      { status: 500 }
    );
  }
} 