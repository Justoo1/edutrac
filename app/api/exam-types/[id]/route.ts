import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { examTypes } from "@/lib/schema";
import { eq } from "drizzle-orm";

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
      return NextResponse.json(
        { error: "Exam type ID is required" },
        { status: 400 }
      );
    }

    // Check if this is the End of Term exam type
    const existingType = await db.query.examTypes.findFirst({
      where: eq(examTypes.id, id),
    });

    if (existingType?.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system exam types" },
        { status: 400 }
      );
    }

    await db.delete(examTypes).where(eq(examTypes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EXAM_TYPES_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 