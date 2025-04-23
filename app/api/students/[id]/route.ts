// app/api/students/[id]/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { students, schools, academicYears, guardians, guardianStudents, batchEnrollments, batches } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// Define the GuardianInfo interface
interface GuardianInfo {
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  emergencyContact?: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Fetch the student with all fields
    const student = await db.query.students.findFirst({
      where: (students, { eq }) => eq(students.id, id),
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, student.schoolId as string),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch active batch enrollment to get grade level
    let currentGradeLevel: string | null = null;
    const activeEnrollment = await db.query.batchEnrollments.findFirst({
      where: and(eq(batchEnrollments.studentId, id), eq(batchEnrollments.status, "active")),
      with: {
        batch: {
          columns: {
            gradeLevel: true,
          },
        },
      },
      // Optional: Order by enrollment date if multiple active enrollments are possible
      // orderBy: (be, { desc }) => [desc(be.enrollmentDate)],
    });

    if (activeEnrollment && activeEnrollment.batch) {
      currentGradeLevel = activeEnrollment.batch.gradeLevel;
    }

    // Fetch guardian information
    const guardianConnections = await db.query.guardianStudents.findMany({
      where: (gs, { eq }) => eq(gs.studentId, id),
      with: {
        guardian: true
      }
    });

    // Format the response to include guardian information AND grade level
    const primaryGuardian = guardianConnections.find(gc => gc.isPrimary)?.guardian;
    const allGuardians = guardianConnections.map(gc => gc.guardian);

    const enrichedStudent = {
      ...student,
      guardians: allGuardians,
      primaryGuardian,
      currentGradeLevel: currentGradeLevel,
      // For backward compatibility, map primary guardian info to the guardian field
      guardian: primaryGuardian ? {
        parentName: `${primaryGuardian.firstName} ${primaryGuardian.lastName}`,
        parentPhone: primaryGuardian.phone,
        parentEmail: primaryGuardian.email,
        emergencyContact: primaryGuardian.emergencyContact ? primaryGuardian.phone : primaryGuardian.alternativePhone
      } : student.guardian || null
    };

    // Log the student data to verify all fields are present
    console.log("Fetched student data:", enrichedStudent);

    return NextResponse.json(enrichedStudent);
  } catch (error) {
    console.error("[STUDENT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log({id});
    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Fetch the existing student to check permissions
    const existingStudent = await db.query.students.findFirst({
      where: (students, { eq }) => eq(students.id, id),
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, existingStudent.schoolId as string),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the update data
    const body = await req.json();
    
    // Log the incoming data to debug
    console.log("Update student request body:", body);

    // Format date fields to ensure proper Date objects
    const formattedBody = {
      ...body,
      updatedAt: new Date(),
    };

    // Convert date fields if they exist and are strings
    if (body.dateOfBirth) {
      formattedBody.dateOfBirth = new Date(body.dateOfBirth);
    }
    
    if (body.admissionDate) {
      formattedBody.admissionDate = new Date(body.admissionDate);
    }
    
    // Handle guardian information properly
    // For legacy support, look for parent fields and update the guardian JSON field
    const guardianInfo: GuardianInfo = existingStudent.guardian ? { ...existingStudent.guardian as GuardianInfo } : {};
    
    // Check if any parent/guardian fields are provided directly
    if (body.parentName) guardianInfo.parentName = body.parentName;
    if (body.parentPhone) guardianInfo.parentPhone = body.parentPhone;
    if (body.parentEmail) guardianInfo.parentEmail = body.parentEmail;
    if (body.emergencyContact) guardianInfo.emergencyContact = body.emergencyContact;
    
    // Only set guardian field if we have guardian information
    if (Object.keys(guardianInfo).length > 0) {
      formattedBody.guardian = guardianInfo;
    }
    
    // Remove any standalone parent fields not in the schema
    delete formattedBody.parentName;
    delete formattedBody.parentPhone;
    delete formattedBody.parentEmail;
    delete formattedBody.emergencyContact;

    // Update the student record
    const updatedStudent = await db.update(students)
      .set(formattedBody)
      .where(eq(students.id, id))
      .returning();
      
    // Log the updated student data
    console.log("Updated student data:", updatedStudent[0]);

    return NextResponse.json(updatedStudent[0]);
  } catch (error) {
    console.error("[STUDENT_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Start a transaction to ensure all deletions are atomic
    await db.transaction(async (tx) => {
      // 1. Get all guardians associated with this student
      const studentGuardianRelations = await tx.select()
        .from(guardianStudents)
        .where(eq(guardianStudents.studentId, id))

      const guardianIds = studentGuardianRelations.map(rel => rel.guardianId)

      // 2. Delete student-guardian relationships
      await tx.delete(guardianStudents)
        .where(eq(guardianStudents.studentId, id))

      // 3. For each guardian, check if they have other students
      for (const guardianId of guardianIds) {
        const remainingStudents = await tx.select()
          .from(guardianStudents)
          .where(eq(guardianStudents.guardianId, guardianId))

        // If no other students are associated with this guardian, delete the guardian
        if (remainingStudents.length === 0) {
          await tx.delete(guardians)
            .where(eq(guardians.id, guardianId))
        }
      }

      // 4. Finally, delete the student
      await tx.delete(students)
        .where(eq(students.id, id))
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student and related records' },
      { status: 500 }
    )
  }
}