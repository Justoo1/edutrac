import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { schools, staff, users } from "@/lib/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });
    
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const body = await req.json();
    
    // Validate the required fields
    const { name, email, staffId, position, department, qualification, contactInfo} = body;
    
    if (!name || !email || !staffId || !position || !department || !qualification || !contactInfo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user with email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: "Email already exists",
        message: `The email "${email}" is already registered in the system.` 
      }, { status: 400 });
    }

    // Create user with default password
    const hashedPassword = await hash("teacher@1234", 10);
    const user = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: "teacher",
      schoolId: school.id
    }).returning();

    if (!user[0]) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Create contact info from existing fields
  

    // Create teacher record
    const teacher = await db.insert(staff).values({
      userId: user[0].id,
      position: position, // Teacher, Headmaster, etc.
      department: department,
      qualification: qualification,
      staffId: staffId,
      name: name,
      schoolId: school.id,
      email: email,
      contactInfo: contactInfo
    }).returning();

    return NextResponse.json(teacher[0]);
  } catch (error: any) {
    console.error("[TEACHER_CREATE]", error);
    
    // Handle duplicate email error as fallback
    if (error.message?.includes("duplicate key") && error.message?.includes("email")) {
      return NextResponse.json({ 
        error: "Email already exists",
        message: "This email is already registered in the system."
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Get the teacher to get the userId
    const teacher = await db.query.staff.findFirst({
      where: eq(staff.id, id),
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Delete the teacher profile
    await db.delete(staff).where(eq(staff.id, id));

    // Delete the associated user
    if (teacher.userId) {
      await db.delete(users).where(eq(users.id, teacher.userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TEACHER_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const schoolId = url.searchParams.get("schoolId");

    // Get all teachers with related user data
    const teachers = await db.query.staff.findMany({
      with: {
        user: true,
        },
      where: eq(staff.schoolId, schoolId!)
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("[TEACHERS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 