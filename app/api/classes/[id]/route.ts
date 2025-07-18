// app/api/classes/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { classes, schools } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Get class info with teacher details
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, id),
      with: {
        classTeacher: {
          columns: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!classInfo) {
      return new NextResponse("Class not found", { status: 404 });
    }

    return NextResponse.json({
      id: classInfo.id,
      name: classInfo.name,
      teacher: classInfo.classTeacher?.name || "Not Assigned",
      createdBy: session.user.name || session.user.email,
    });
  } catch (error) {
    console.error("[CLASS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    // Fetch the existing class to check permissions
    const existingClass = await db.query.classes.findFirst({
      where: (classes, { eq }) => eq(classes.id, id),
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, existingClass.schoolId as string),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the update data
    const body = await req.json();

    // Update the class record
    const updatedClass = await db.update(classes)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, id))
      .returning();

    return NextResponse.json(updatedClass[0]);
  } catch (error) {
    console.error("[CLASS_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    // Fetch the existing class to check permissions
    const existingClass = await db.query.classes.findFirst({
      where: (classes, { eq }) => eq(classes.id, id),
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, existingClass.schoolId as string),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete the class by updating status to 'inactive'
    const deletedClass = await db.update(classes)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(classes.id, id))
      .returning();

    return NextResponse.json(deletedClass[0]);
  } catch (error) {
    console.error("[CLASS_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}