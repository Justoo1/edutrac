import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { schools } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

// GET: Fetch school details
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
    
    // Fetch the school details
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check if user is the admin of this school
    // if (school.adminId !== session.user.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    return NextResponse.json(school);
  } catch (error) {
    console.error("[SCHOOL_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update school details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    
    // Fetch the existing school to verify ownership
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check if user is the admin of this school
    if (school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    
    const allowedFields = [
      "name", 
      "description", 
      "schoolCode", 
      "schoolType", 
      "region", 
      "district", 
      "address", 
      "phone", 
      "email", 
      "establishedYear"
    ];
    
    // Filter out any fields that are not in the allowed list
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    // Update the school
    const updatedSchool = await db
      .update(schools)
      .set(updateData)
      .where(eq(schools.id, schoolId))
      .returning();
    
    return NextResponse.json(updatedSchool[0]);
  } catch (error) {
    console.error("[SCHOOL_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 