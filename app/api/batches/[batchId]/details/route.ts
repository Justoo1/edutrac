import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { batches, batchEnrollments, students, schools, academicYears } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { batchId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batchId = params.batchId;
    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required" },
        { status: 400 }
      );
    }

    // Get batch details
    const batchData = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
      with: {
        school: true,
        academicYear: true
      }
    });

    if (!batchData) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (batchData.school.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to access this batch" },
        { status: 403 }
      );
    }

    // Get enrolled students
    const enrollments = await db.query.batchEnrollments.findMany({
      where: eq(batchEnrollments.batchId, batchId),
      with: {
        student: true
      }
    });

    const studentCount = enrollments.length;
    
    // Return combined data
    return NextResponse.json({
      ...batchData,
      studentCount,
      enrollments
    });
  } catch (error) {
    console.error("Error fetching batch details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 