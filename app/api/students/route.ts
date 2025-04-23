// app/api/students/route.ts
import { NextResponse } from "next/server";
import { createUser, getSession } from "@/lib/auth";
import db from "@/lib/db";
import { guardianStudents, students, guardians, users } from "@/lib/schema";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate the required fields
    const { firstName, lastName, dateOfBirth, gender, parentName, parentPhone, admissionDate, schoolId, contactInfo, healthInfo } = body;
    
    if (!firstName || !lastName || !dateOfBirth || !gender || !parentName || !parentPhone || !admissionDate || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a student ID if not provided
    const studentId = body.studentId || generateStudentId(firstName, lastName);

    // Ensure dates are properly formatted
    const formattedStudentData = {
      ...body,
      dateOfBirth: new Date(dateOfBirth),
      admissionDate: new Date(admissionDate),
      id: nanoid(),
      studentId: studentId,
      schoolId: schoolId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      contactInfo: contactInfo || {},
      healthInfo: healthInfo || {},
    };

    // Create the student record
    const createdStudent = await db.insert(students).values(formattedStudentData).returning();
    
    // Extract guardian name parts
    const parentNameParts = parentName.split(" ");
    const guardianFirstName = parentNameParts[0] || "";
    const guardianLastName = parentNameParts.slice(1).join(" ") || "";
    
    // Create guardian record
    const guardianId = nanoid();
    const guardianData = {
      id: guardianId,
      firstName: guardianFirstName,
      lastName: guardianLastName,
      email: body.parentEmail || `${parentName.replace(/\s+/g, "").toLowerCase()}@example.com`,
      phone: parentPhone,
      alternativePhone: body.alternativePhone || null,
      relationship: body.relationship || "Parent",
      occupation: body.occupation || null,
      address: body.address || null,
      emergencyContact: true,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const createdGuardian = await db.insert(guardians).values(guardianData).returning();
    
    // Create guardian-student relationship
    const guardianStudentData = {
      id: nanoid(),
      guardianId: guardianId,
      studentId: createdStudent[0].id,
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(guardianStudents).values(guardianStudentData);
    
    // Create user account for student if needed
    const loginEmail = body.studentEmail || studentId;
    await createUser(loginEmail, "student@123", `${firstName} ${lastName}`, "student", schoolId);

    return NextResponse.json(createdStudent[0]);
  } catch (error) {
    console.error("[STUDENT_CREATE]", error);
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

    // Fetch students for the school
    const studentsList = await db.query.students.findMany({
      where: (students, { eq }) => eq(students.schoolId, schoolId),
      orderBy: (students, { asc }) => [asc(students.lastName), asc(students.firstName)],
      with: {
        batchEnrollments: {
          with: {
            batch: true
          }
        },
        enrollments: {
          with: {
            class: true
          }
        },
        subjectEnrollments: {
          with: {
            subject: true
          }
        }
      }
    });
    
    // Get guardian information for all students
    const guardianConnections = await db.query.guardianStudents.findMany({
      where: (gs, { and, inArray }) => 
        and(
          inArray(gs.studentId, studentsList.map(s => s.id))
        ),
      with: {
        guardian: true,
        student: true
      }
    });
    
    // Map guardian info to students
    const enrichedStudentsList = studentsList.map(student => {
      const studentGuardians = guardianConnections.filter(
        gc => gc.studentId === student.id
      );
      
      const primaryGuardian = studentGuardians.find(gc => gc.isPrimary)?.guardian;
      
      return {
        ...student,
        // For backward compatibility, map primary guardian info to the guardian field
        guardian: primaryGuardian ? {
          parentName: `${primaryGuardian.firstName} ${primaryGuardian.lastName}`,
          parentPhone: primaryGuardian.phone,
          parentEmail: primaryGuardian.email,
          emergencyContact: primaryGuardian.emergencyContact ? primaryGuardian.phone : primaryGuardian.alternativePhone
        } : student.guardian || null
      };
    });

    return NextResponse.json(enrichedStudentsList);
  } catch (error) {
    console.error("[STUDENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to generate a student ID
function generateStudentId(firstName: string, lastName: string): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${year}${firstInitial}${lastInitial}${randomDigits}`;
}