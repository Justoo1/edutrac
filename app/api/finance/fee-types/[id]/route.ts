import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { feeTypes } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const {
      name,
      description,
      amount,
      frequency,
      gradeLevel,
      academicYear,
      term,
      optional,
      dueDate
    } = body;

    const updatedFeeType = await db
      .update(feeTypes)
      .set({
        name,
        description,
        amount: parseFloat(amount),
        frequency,
        gradeLevel,
        academicYear,
        term,
        optional: optional || false,
        dueDate: dueDate ? new Date(dueDate) : null,
        updatedAt: new Date()
      })
      .where(eq(feeTypes.id, id))
      .returning();

    if (!updatedFeeType.length) {
      return NextResponse.json({ error: "Fee type not found" }, { status: 404 });
    }

    return NextResponse.json(updatedFeeType[0]);

  } catch (error) {
    console.error("Error updating fee type:", error);
    return NextResponse.json(
      { error: "Failed to update fee type" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const deletedFeeType = await db
      .delete(feeTypes)
      .where(eq(feeTypes.id, id))
      .returning();

    if (!deletedFeeType.length) {
      return NextResponse.json({ error: "Fee type not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Fee type deleted successfully" });

  } catch (error) {
    console.error("Error deleting fee type:", error);
    return NextResponse.json(
      { error: "Failed to delete fee type" },
      { status: 500 }
    );
  }
}
