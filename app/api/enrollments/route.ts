// app/api/enrollments/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { classEnrollments, classes, students as studentsTable, schools } from "@/lib/schema";
import { nanoid } from "nanoid";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { classId, studentIds } = body;

    if (!classId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Class ID and at least one student ID are required" },
        { status: 400 }
      );
    }

    // Check if class exists
    const classExists = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Check if all students exist
    const studentsData = await db.query.students.findMany({
      where: inArray(studentsTable.id, studentIds),
    });

    if (studentsData.length !== studentIds.length) {
      return NextResponse.json(
        { error: "One or more students not found" },
        { status: 404 }
      );
    }

    // Check for existing enrollments in any class
    const existingEnrollments = await db.query.classEnrollments.findMany({
      where: inArray(classEnrollments.studentId, studentIds),
      with: {
        class: true
      }
    });

    if (existingEnrollments.length > 0) {
      // Group enrollments by student to show which class each student is already enrolled in
      const enrolledStudentDetails = existingEnrollments.reduce((acc, enrollment) => {
        if (!acc[enrollment.studentId]) {
          acc[enrollment.studentId] = {
            studentId: enrollment.studentId,
            classIds: [enrollment.classId],
            classNames: [enrollment.class.name]
          };
        } else {
          acc[enrollment.studentId].classIds.push(enrollment.classId);
          acc[enrollment.studentId].classNames.push(enrollment.class.name);
        }
        return acc;
      }, {} as Record<string, { studentId: string, classIds: string[], classNames: string[] }>);
      
      const enrolledStudentIds = Object.keys(enrolledStudentDetails);
      
      const alreadyEnrolledStudents = studentsData
        .filter(s => enrolledStudentIds.includes(s.id))
        .map(s => ({
          name: `${s.firstName} ${s.lastName}`,
          id: s.id,
          enrolledIn: enrolledStudentDetails[s.id].classNames.join(", ")
        }));
      
      return NextResponse.json(
        { 
          error: "Students can only be enrolled in one class at a time",
          alreadyEnrolledStudents: alreadyEnrolledStudents
        },
        { status: 400 }
      );
    }

    // Create new enrollments
    const enrollments = studentIds.map(studentId => ({
      classId,
      studentId,
      enrollmentDate: new Date(),
      status: "active",
    }));

    await db.insert(classEnrollments).values(enrollments);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating enrollments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    // Check if the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq, isNull }) => 
        schoolId
          ? eq(schools.id, schoolId)
          : isNull(schools.id)
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build the query based on provided parameters
    const query: any = {
      schoolId: schoolId
    };
    
    if (classId) {
      query.classId = classId;
    }
    
    if (studentId) {
      query.studentId = studentId;
    }

    // Fetch enrollment data with student and class details
    const enrollmentData = await db.query.classEnrollments.findMany({
      where: (classEnrollments, { eq, and }) => {
        const conditions = [];
        
        if (classId) {
          conditions.push(eq(classEnrollments.classId, classId));
        }
        
        if (studentId) {
          conditions.push(eq(classEnrollments.studentId, studentId));
        }
        
        // Only active enrollments by default
        conditions.push(eq(classEnrollments.status, "active"));
        
        return and(...conditions);
      },
      with: {
        student: true,
        class: true
      }
    });

    // Filter only enrollments for the given school
    const filteredEnrollments = enrollmentData.filter((enrollment: any) => 
      enrollment.class.schoolId === schoolId &&
      enrollment.student.schoolId === schoolId
    );

    return NextResponse.json(filteredEnrollments);
  } catch (error) {
    console.error("[ENROLLMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}