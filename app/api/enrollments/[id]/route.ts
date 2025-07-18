// app/api/enrollments/[id]/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { classEnrollments, schools } from "@/lib/schema";
import { eq } from "drizzle-orm";

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
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 });
    }

    // Fetch the enrollment with student and class data
    const enrollment = await db.query.classEnrollments.findFirst({
      where: (classEnrollments, { eq }) => eq(classEnrollments.id, id),
      with: {
        student: true,
        class: true
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Check if the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq, isNull }) => 
        enrollment.class.schoolId 
          ? eq(schools.id, enrollment.class.schoolId)
          : isNull(schools.id)
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("[ENROLLMENT_GET]", error);
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
    if (!id) {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 });
    }

    // Fetch the existing enrollment to check permissions
    const existingEnrollment = await db.query.classEnrollments.findFirst({
      where: (classEnrollments, { eq }) => eq(classEnrollments.id, id),
      with: {
        class: true
      }
    });

    if (!existingEnrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq, isNull }) => 
        existingEnrollment.class.schoolId 
          ? eq(schools.id, existingEnrollment.class.schoolId)
          : isNull(schools.id)
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the update data
    const body = await req.json();

    // Update the enrollment record
    const updatedEnrollment = await db.update(classEnrollments)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(classEnrollments.id, id))
      .returning();

    return NextResponse.json(updatedEnrollment[0]);
  } catch (error) {
    console.error("[ENROLLMENT_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id: enrollmentId} = await params;
    if (!enrollmentId) {
      return NextResponse.json(
        { error: "Enrollment ID is required" },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the enrollment with related data to check permissions
    const enrollment = await db.query.classEnrollments.findFirst({
      where: eq(classEnrollments.id, enrollmentId),
      with: {
        class: {
          with: {
            school: true
          }
        },
        student: true
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Check if user has permission (is the school admin)
    const schoolId = enrollment.class.schoolId;
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId as string),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this enrollment" },
        { status: 403 }
      );
    }

    // Delete the enrollment
    await db.delete(classEnrollments).where(eq(classEnrollments.id, enrollmentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}