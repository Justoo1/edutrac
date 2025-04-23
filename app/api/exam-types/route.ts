import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { examTypes } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Check if End of Term exam type exists, if not create it
    const endOfTermType = await db.query.examTypes.findFirst({
      where: and(
        eq(examTypes.schoolId, schoolId),
        eq(examTypes.name, "End of Term")
      ),
    });

    if (!endOfTermType) {
      await db.insert(examTypes).values({
        name: "End of Term",
        description: "End of term examination",
        weight: 100,
        schoolId: schoolId,
        isSystem: true,
      });
    }

    // Fetch all exam types for the school
    const types = await db.query.examTypes.findMany({
      where: eq(examTypes.schoolId, schoolId),
      orderBy: (types, { asc }) => [asc(types.name)],
    });

    return NextResponse.json(types);
  } catch (error) {
    console.error("[EXAM_TYPES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, weight, schoolId } = body;

    if (!name || !description || weight === undefined || !schoolId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prevent creating End of Term exam type
    if (name.toLowerCase() === "end of term") {
      return NextResponse.json(
        { error: "Cannot create End of Term exam type" },
        { status: 400 }
      );
    }

    const type = await db.insert(examTypes).values({
      name,
      description,
      weight,
      schoolId,
      isSystem: false,
    }).returning();

    return NextResponse.json(type[0]);
  } catch (error) {
    console.error("[EXAM_TYPES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, weight } = body;

    if (!id || !name || !description || weight === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if this is the End of Term exam type
    const existingType = await db.query.examTypes.findFirst({
      where: eq(examTypes.id, id),
    });

    if (existingType?.isSystem) {
      return NextResponse.json(
        { error: "Cannot modify system exam types" },
        { status: 400 }
      );
    }

    const type = await db
      .update(examTypes)
      .set({
        name,
        description,
        weight,
      })
      .where(eq(examTypes.id, id))
      .returning();

    return NextResponse.json(type[0]);
  } catch (error) {
    console.error("[EXAM_TYPES_PUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 