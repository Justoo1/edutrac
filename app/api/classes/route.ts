// app/api/classes/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { classes } from "@/lib/schema";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate the required fields
    const { name, gradeLevel, academicYear, schoolId } = body;
    
    if (!name || !gradeLevel || !academicYear || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the class record
    const createdClass = await db.insert(classes).values({
      ...body,
      id: nanoid(),
      schoolId: schoolId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
    }).returning();

    return NextResponse.json(createdClass[0]);
  } catch (error) {
    console.error("[CLASS_CREATE]", error);
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

    // Fetch classes for the school
    const classesList = await db.query.classes.findMany({
      where: (classes, { eq }) => eq(classes.schoolId, schoolId),
      orderBy: (classes, { asc }) => [asc(classes.gradeLevel), asc(classes.name)],
    });

    return NextResponse.json(classesList);
  } catch (error) {
    console.error("[CLASSES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}