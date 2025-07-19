import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { batches, batchEnrollments, schools, students } from "@/lib/schema";
import { and, eq, inArray } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to access this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this school" },
        { status: 403 }
      );
    }

    // Get batch IDs for this school
    const schoolBatches = await db.query.batches.findMany({
      where: eq(batches.schoolId, schoolId),
      columns: { id: true }
    });

    const batchIds = schoolBatches.map(batch => batch.id);

    if (batchIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get all batch enrollments for the school's batches
    const allBatchEnrollments = await db.query.batchEnrollments.findMany({
      where: inArray(batchEnrollments.batchId, batchIds),
      with: {
        student: {
          columns: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        batch: {
          columns: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(allBatchEnrollments);
  } catch (error) {
    console.error("Error fetching batch enrollments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to access this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this school" },
        { status: 403 }
      );
    }

    // Get enrollment data from request body
    const body = await req.json();
    const { batchId, studentIds } = body;

    if (!batchId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Batch ID and at least one student ID are required" },
        { status: 400 }
      );
    }

    // Verify batch exists and belongs to this school
    const batch = await db.query.batches.findFirst({
      where: and(
        eq(batches.id, batchId),
        eq(batches.schoolId, schoolId)
      ),
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found or does not belong to this school" },
        { status: 404 }
      );
    }

    // Verify all students exist and belong to this school
    const studentsData = await db.query.students.findMany({
      where: and(
        inArray(students.id, studentIds),
        eq(students.schoolId, schoolId),
        eq(students.status, "active")
      ),
    });

    if (studentsData.length !== studentIds.length) {
      return NextResponse.json(
        { error: "One or more students not found or do not belong to this school" },
        { status: 400 }
      );
    }

    // Check if any students are already in ANY batch
    const existingBatchEnrollments = await db.query.batchEnrollments.findMany({
      where: and(
        inArray(batchEnrollments.studentId, studentIds),
        eq(batchEnrollments.status, "active")
      ),
      with: {
        batch: {
          columns: {
            id: true,
            name: true
          }
        }
      }
    });

    if (existingBatchEnrollments.length > 0) {
      const enrolledStudentInfo = existingBatchEnrollments.reduce((acc, enrollment) => {
        const studentId = enrollment.studentId;
        if (!acc[studentId]) {
          acc[studentId] = {
            batchIds: [enrollment.batchId],
            batchNames: [enrollment.batch.name]
          };
        } else {
          acc[studentId].batchIds.push(enrollment.batchId);
          acc[studentId].batchNames.push(enrollment.batch.name);
        }
        return acc;
      }, {} as Record<string, { batchIds: string[], batchNames: string[] }>);
      
      const enrolledStudentIds = Object.keys(enrolledStudentInfo);
      
      const alreadyEnrolledStudents = studentsData
        .filter(s => enrolledStudentIds.includes(s.id))
        .map(s => ({
          name: `${s.firstName} ${s.lastName}`,
          id: s.id,
          enrolledIn: enrolledStudentInfo[s.id].batchNames.join(", ")
        }));
      
      return NextResponse.json(
        { 
          error: "Students can only be enrolled in one batch at a time",
          alreadyEnrolledStudents
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
      message: `Added ${studentIds.length} students to batch`,
      enrollments: enrollmentsToCreate
    });
    
  } catch (error) {
    console.error("Error adding batch enrollments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 