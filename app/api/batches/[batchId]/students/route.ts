import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { students, batches, batchEnrollments, schools } from "@/lib/schema";

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

    // Get batch to verify permissions and get grade level
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
      with: {
        school: true
      }
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    // Check permission
    if (batch.school.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to access this batch" },
        { status: 403 }
      );
    }

    // Get all students from the batch with the right grade level
    // This uses batch enrollments to find students
    const batchStudents = await db.query.batchEnrollments.findMany({
      where: eq(batchEnrollments.batchId, batchId),
      with: {
        student: true
      }
    });

    // Extract just the student data
    const studentsData = batchStudents.map(item => ({
      id: item.student.id,
      firstName: item.student.firstName,
      lastName: item.student.lastName,
      studentId: item.student.studentId,
      status: item.student.status,
      createdAt: item.student.createdAt,
      updatedAt: item.student.updatedAt
    }));

    // Filter to only active students
    const activeStudents = studentsData.filter(student => student.status === "active");

    return NextResponse.json(activeStudents);
  } catch (error) {
    console.error("Error fetching batch students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Get batch to verify permissions
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
      with: {
        school: true
      }
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    // Check permission
    if (batch.school.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to modify this batch" },
        { status: 403 }
      );
    }

    // Get student IDs from request body
    const body = await req.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "At least one student ID is required" },
        { status: 400 }
      );
    }

    // Verify all students exist and belong to this school
    const studentsData = await db.query.students.findMany({
      where: and(
        inArray(students.id, studentIds),
        eq(students.schoolId, batch.schoolId),
        eq(students.status, "active")
      ),
    });

    if (studentsData.length !== studentIds.length) {
      return NextResponse.json(
        { error: "One or more students not found or do not belong to this school" },
        { status: 400 }
      );
    }

    // Check if any students are already in ANY batch (not just this batch)
    const existingBatchEnrollments = await db.query.batchEnrollments.findMany({
      where: and(
        inArray(batchEnrollments.studentId, studentIds),
        eq(batchEnrollments.status, "active")
      ),
    });

    if (existingBatchEnrollments.length > 0) {
      const enrolledStudentIds = existingBatchEnrollments.map(e => e.studentId);
      const alreadyEnrolled = studentsData
        .filter(s => enrolledStudentIds.includes(s.id))
        .map(s => `${s.firstName} ${s.lastName}`);

      return NextResponse.json(
        { 
          error: `Some students are already assigned to a batch: ${alreadyEnrolled.join(", ")}`,
          alreadyEnrolled
        },
        { status: 400 }
      );
    }

    // Add students to the batch
    const enrollmentsToCreate = studentIds.map(studentId => ({
      batchId,
      studentId,
      enrollmentDate: new Date(),
      status: "active",
    }));

    await db.insert(batchEnrollments).values(enrollmentsToCreate);

    // Return success
    return NextResponse.json({ 
      success: true,
      message: `Added ${studentIds.length} students to batch` 
    });
    
  } catch (error) {
    console.error("Error adding students to batch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 