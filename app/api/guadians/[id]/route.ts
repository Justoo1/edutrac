// app/api/guardians/[id]/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { guardians, guardianStudents, users, schools, students } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hash } from "bcryptjs";
import { generateTemporaryPassword, sendWelcomeEmail } from "@/lib/email";

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
      return NextResponse.json({ error: "Guardian ID is required" }, { status: 400 });
    }

    // Fetch the guardian
    const guardian = await db.query.guardians.findFirst({
      where: (guardians, { eq }) => eq(guardians.id, id),
    });

    if (!guardian) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
    }

    // Get associated students
    const relations = await db.query.guardianStudents.findMany({
      where: (guardianStudents, { eq }) => eq(guardianStudents.guardianId, guardian.id),
      with: {
        student: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            schoolId: true
          },
          with: {
            batchEnrollments: {
              with: {
                batch: {
                  columns: {
                    id: true,
                    name: true,
                    gradeLevel: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (relations.length === 0) {
      return NextResponse.json({ error: "No students associated with this guardian" }, { status: 404 });
    }

    // Get the school ID of the first student to check permissions
    const schoolId = relations[0].student.schoolId;

    // Verify that the user has permission for this school
    const school = schoolId ? await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    }) : null;

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract student information
    const students = relations.map(relation => ({
      ...relation.student,
      isPrimary: relation.isPrimary,
    }));

    // Check if guardian has a user account
    const hasUserAccount = !!guardian.userId;

    const guardianData = {
      ...guardian,
      students,
      studentIds: students.map(student => student.id),
      primaryStudentIds: students
        .filter(student => student.isPrimary)
        .map(student => student.id),
      hasUserAccount,
      schoolId, // Include for convenience
    };

    return NextResponse.json(guardianData);
  } catch (error) {
    console.error("[GUARDIAN_GET]", error);
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
      return NextResponse.json({ error: "Guardian ID is required" }, { status: 400 });
    }

    // Fetch the existing guardian to check permissions
    const existingGuardian = await db.query.guardians.findFirst({
      where: (guardians, { eq }) => eq(guardians.id, id),
    });

    if (!existingGuardian) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
    }

    // Get associated students to check school permission
    const existingRelations = await db.query.guardianStudents.findMany({
      where: (guardianStudents, { eq }) => eq(guardianStudents.guardianId, id),
      with: {
        student: {
          columns: {
            id: true,
            schoolId: true,
          },
        },
      },
    });

    if (existingRelations.length === 0) {
      return NextResponse.json({ error: "No students associated with this guardian" }, { status: 404 });
    }

    // Get the school ID to check permissions
    const schoolId = existingRelations[0].student.schoolId;

    // Verify that the user has permission for this school
    const school = schoolId ? await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    }) : null;

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse update data
    const body = await req.json();
    
    // Validate the required fields
    const { 
      firstName, 
      lastName, 
      email, 
      phone,
      relationship,
      studentIds,
      primaryStudentIds = [],
      createAccount = false, // Not typically needed for updates
    } = body;
    
    if (!firstName || !lastName || !email || !phone || !relationship || !studentIds || studentIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email is being changed and if it already exists for another guardian
    if (email !== existingGuardian.email) {
      const guardianWithEmail = await db.query.guardians.findFirst({
        where: (guardians, { and, eq, ne }) => 
          and(
            eq(guardians.email, email),
            ne(guardians.id, id)
          ),
      });

      if (guardianWithEmail) {
        return NextResponse.json({ error: "Email already in use by another guardian" }, { status: 400 });
      }
    }

    // Verify that all students exist and belong to the school
    const studentsData = await db.query.students.findMany({
      where: (students, { and, eq, inArray }) => 
        and(
          eq(students.schoolId, schoolId as string),
          inArray(students.id, studentIds)
        ),
    });

    if (studentsData.length !== studentIds.length) {
      return NextResponse.json({ 
        error: "Some selected students were not found or do not belong to this school" 
      }, { status: 400 });
    }

    // Validate primary student IDs
    const validPrimaryIds = primaryStudentIds.filter((id: string) => studentIds.includes(id));
    if (primaryStudentIds.length > 0 && validPrimaryIds.length === 0) {
      return NextResponse.json({ 
        error: "Primary students must be selected from the associated students" 
      }, { status: 400 });
    }

    let userId = existingGuardian.userId;

    // Create user account if requested and one doesn't exist
    if (createAccount && !userId) {
      // Generate temporary password
      const tempPassword = generateTemporaryPassword();
      const hashedPassword = await hash(tempPassword, 10);
      
      // Create user
      const newUser = await db.insert(users).values({
        id: nanoid(),
        name: `${firstName} ${lastName}`,
        email: email,
        password: hashedPassword,
        role: "guardian",
        emailVerified: new Date(),
      }).returning();
      
      userId = newUser[0].id;
      
      // Send welcome email with temporary password
      await sendWelcomeEmail(email, firstName, tempPassword);
    } else if (userId) {
      // Update user name and email if there's a linked account
      await db.update(users)
        .set({
          name: `${firstName} ${lastName}`,
          email: email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    // Update guardian record
    const updatedGuardian = await db.update(guardians)
      .set({
        firstName,
        lastName,
        email,
        phone,
        alternativePhone: body.alternativePhone || null,
        relationship,
        occupation: body.occupation || null,
        address: body.address || null,
        emergencyContact: body.emergencyContact !== undefined ? body.emergencyContact : true,
        notes: body.notes || null,
        userId, // Update or keep existing userId
        updatedAt: new Date(),
      })
      .where(eq(guardians.id, id))
      .returning();

    // Get existing student relationships
    const existingStudentIds = existingRelations.map(relation => relation.student.id);
    
    // Delete relationships that are no longer needed
    const studentsToRemove = existingStudentIds.filter(studentId => !studentIds.includes(studentId));
    
    if (studentsToRemove.length > 0) {
      await db.delete(guardianStudents)
        .where(
          and(
            eq(guardianStudents.guardianId, id),
            inArray(guardianStudents.studentId, studentsToRemove)
          )
        );
    }
    
    // Update existing relationships and add new ones
    for (const studentId of studentIds) {
      const relationExists = existingStudentIds.includes(studentId);
      const isPrimary = validPrimaryIds.includes(studentId);
      
      if (relationExists) {
        // Update existing relationship
        await db.update(guardianStudents)
          .set({
            isPrimary,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(guardianStudents.guardianId, id),
              eq(guardianStudents.studentId, studentId)
            )
          );
      } else {
        // Create new relationship
        await db.insert(guardianStudents).values({
          id: nanoid(),
          guardianId: id,
          studentId,
          isPrimary,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      ...updatedGuardian[0],
      studentIds,
      primaryStudentIds: validPrimaryIds,
      userAccountCreated: createAccount && !existingGuardian.userId,
    });
  } catch (error) {
    console.error("[GUARDIAN_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: "Guardian ID is required" }, { status: 400 });
    }

    // Fetch the existing guardian to check permissions
    const existingGuardian = await db.query.guardians.findFirst({
      where: (guardians, { eq }) => eq(guardians.id, id),
    });

    if (!existingGuardian) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
    }

    // Get associated students to check school permission
    const existingRelations = await db.query.guardianStudents.findMany({
      where: (guardianStudents, { eq }) => eq(guardianStudents.guardianId, id),
      with: {
        student: {
          columns: {
            id: true,
            schoolId: true,
          },
        },
      },
    });

    if (existingRelations.length === 0) {
      return NextResponse.json({ error: "No students associated with this guardian" }, { status: 404 });
    }

    // Get the school ID to check permissions
    const schoolId = existingRelations[0].student.schoolId;

    // Verify that the user has permission for this school
    const school = schoolId ? await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    }) : null;

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all guardian-student relationships
    await db.delete(guardianStudents)
      .where(eq(guardianStudents.guardianId, id));

    // Delete the guardian record
    const deletedGuardian = await db.delete(guardians)
      .where(eq(guardians.id, id))
      .returning();

    // If there is a linked user account, we might want to handle it here
    // Options:
    // 1. Delete the user account (potentially risky)
    // 2. Mark the user account as inactive
    // 3. Keep it as is (user can still log in but won't have access to students)
    
    // For this implementation, if there's a linked user account, just mark it as inactive
    if (existingGuardian.userId) {
      await db.update(users)
        .set({
          updatedAt: new Date(),
          // Instead of active which doesn't exist, we'll just add a comment
          // You'll need to add an isActive column to your users table
          // isActive: false,
        })
        .where(eq(users.id, existingGuardian.userId));
    }

    return NextResponse.json({
      success: true,
      message: "Guardian successfully deleted",
      id: id,
    });
  } catch (error) {
    console.error("[GUARDIAN_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}