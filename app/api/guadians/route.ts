// app/api/guardians/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { guardians, guardianStudents, users } from "@/lib/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { generateTemporaryPassword, sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      createAccount = true,
      schoolId 
    } = body;
    
    if (!firstName || !lastName || !email || !phone || !relationship || !studentIds || studentIds.length === 0 || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if guardian with this email already exists
    const existingGuardian = await db.query.guardians.findFirst({
      where: (guardians, { eq }) => eq(guardians.email, email),
    });

    if (existingGuardian) {
      return NextResponse.json({ error: "A guardian with this email already exists" }, { status: 400 });
    }

    // Verify that all students exist and belong to the school
    const studentsData = await db.query.students.findMany({
      where: (students, { and, eq, inArray }) => 
        and(
          eq(students.schoolId, schoolId),
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

    let userId = null;

    // Create user account if requested
    if (createAccount) {
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
        schoolId: schoolId,
        emailVerified: new Date(),
      }).returning();
      
      userId = newUser[0].id;
      
      // Send welcome email with temporary password
      await sendWelcomeEmail(email, firstName, tempPassword);
    }

    // Create guardian record
    const guardianId = nanoid();
    const guardianData = await db.insert(guardians).values({
      id: guardianId,
      userId: userId,
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
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Create guardian-student relationships
    const guardianStudentsData = studentIds.map((studentId: string) => ({
      id: nanoid(),
      guardianId: guardianId,
      studentId,
      isPrimary: validPrimaryIds.includes(studentId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(guardianStudents).values(guardianStudentsData);

    return NextResponse.json({
      ...guardianData[0],
      studentIds,
      primaryStudentIds: validPrimaryIds,
      userAccountCreated: createAccount,
    });
  } catch (error) {
    console.error("[GUARDIAN_CREATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const studentId = searchParams.get("studentId");

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    // Check if the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let guardiansData;

    // If studentId is provided, get guardians for that specific student
    if (studentId) {
      // First check if the student exists and belongs to the school
      const student = await db.query.students.findFirst({
        where: (students, { and, eq }) => 
          and(
            eq(students.id, studentId),
            eq(students.schoolId, schoolId)
          ),
      });

      if (!student) {
        return NextResponse.json({ error: "Student not found or does not belong to this school" }, { status: 404 });
      }

      // Get guardians for this student
      const guardianRelations = await db.query.guardianStudents.findMany({
        where: (guardianStudents, { eq }) => eq(guardianStudents.studentId, studentId),
        with: {
          guardian: true,
        },
      });

      guardiansData = guardianRelations.map(relation => relation.guardian);
    } else {
      // Get all guardians related to students in this school
      // This is more complex as we need to join across tables
      
      // First, get all students in the school
      const schoolStudents = await db.query.students.findMany({
        where: (students, { eq }) => eq(students.schoolId, schoolId),
        columns: {
          id: true,
        },
      });
      
      const studentIds = schoolStudents.map(student => student.id);
      
      if (studentIds.length === 0) {
        return NextResponse.json([]);
      }
      
      // Get guardians related to these students
      const guardianRelations = await db.query.guardianStudents.findMany({
        where: (guardianStudents, { inArray }) => 
          inArray(guardianStudents.studentId, studentIds),
        with: {
          guardian: true,
        },
      });
      
      // Filter out duplicates
      const guardianMap = new Map();
      guardianRelations.forEach(relation => {
        guardianMap.set(relation.guardian.id, relation.guardian);
      });
      
      guardiansData = Array.from(guardianMap.values());
    }
    
    // For each guardian, get their associated students and primary relationships
    const enrichedGuardians = await Promise.all(
      guardiansData.map(async (guardian) => {
        const relations = await db.query.guardianStudents.findMany({
          where: (guardianStudents, { eq }) => eq(guardianStudents.guardianId, guardian.id),
          with: {
            student: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
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
        
        const associatedStudents = relations.map(relation => ({
          ...relation.student,
          isPrimary: relation.isPrimary,
        }));
        
        // Check if guardian has a user account
        const hasUserAccount = !!guardian.userId;
        
        return {
          ...guardian,
          students: associatedStudents,
          studentIds: associatedStudents.map(student => student.id),
          primaryStudentIds: associatedStudents
            .filter(student => student.isPrimary)
            .map(student => student.id),
          hasUserAccount,
        };
      })
    );

    return NextResponse.json(enrichedGuardians);
  } catch (error) {
    console.error("[GUARDIANS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}