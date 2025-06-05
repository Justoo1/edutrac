import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { feeStructures } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

// GET - Fetch single fee structure by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Fee structure ID is required" }, { status: 400 });
    }

    const feeStructure = await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.id, id))
      .limit(1);

    if (!feeStructure.length) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    return NextResponse.json(feeStructure[0]);

  } catch (error) {
    console.error("Error fetching fee structure:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update fee structure
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

    if (!id) {
      return NextResponse.json({ error: "Fee structure ID is required" }, { status: 400 });
    }

    const {
      className,
      level,
      academicYear,
      tuitionFee,
      activitiesFee,
      examinationFee,
      libraryFee,
      laboratoryFee,
      transportFee,
      studentsEnrolled
    } = body;

    // Validate required fields
    if (!className || !level || !academicYear) {
      return NextResponse.json(
        { error: "Missing required fields: className, level, academicYear" },
        { status: 400 }
      );
    }

    // Check if fee structure exists
    const existingStructure = await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.id, id))
      .limit(1);

    if (!existingStructure.length) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    // Calculate total fee
    const totalFee = (tuitionFee || 0) + (activitiesFee || 0) + (examinationFee || 0) + 
                     (libraryFee || 0) + (laboratoryFee || 0) + (transportFee || 0);

    // Update the fee structure
    const updatedFeeStructure = await db
      .update(feeStructures)
      .set({
        className,
        level,
        academicYear,
        tuitionFee: tuitionFee || 0,
        activitiesFee: activitiesFee || 0,
        examinationFee: examinationFee || 0,
        libraryFee: libraryFee || 0,
        laboratoryFee: laboratoryFee || 0,
        transportFee: transportFee || 0,
        totalFee,
        studentsEnrolled: studentsEnrolled || 0,
        updatedAt: new Date()
      })
      .where(eq(feeStructures.id, id))
      .returning();

    if (!updatedFeeStructure.length) {
      return NextResponse.json({ error: "Failed to update fee structure" }, { status: 500 });
    }

    return NextResponse.json(updatedFeeStructure[0]);

  } catch (error) {
    console.error("Error updating fee structure:", error);
    return NextResponse.json(
      { error: "Failed to update fee structure" },
      { status: 500 }
    );
  }
}

// DELETE - Delete fee structure
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

    if (!id) {
      return NextResponse.json({ error: "Fee structure ID is required" }, { status: 400 });
    }

    // Check if fee structure exists
    const existingStructure = await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.id, id))
      .limit(1);

    if (!existingStructure.length) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    // Check if there are any related records (student fees, payments, etc.)
    // You might want to add checks here to prevent deletion if there are dependent records
    // For now, we'll proceed with the deletion

    // Delete the fee structure
    const deletedFeeStructure = await db
      .delete(feeStructures)
      .where(eq(feeStructures.id, id))
      .returning();

    if (!deletedFeeStructure.length) {
      return NextResponse.json({ error: "Failed to delete fee structure" }, { status: 500 });
    }

    return NextResponse.json(
      { 
        message: "Fee structure deleted successfully",
        deletedStructure: deletedFeeStructure[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting fee structure:", error);
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { 
          error: "Cannot delete fee structure as it has associated records (student fees, payments, etc.). Please remove related records first." 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete fee structure" },
      { status: 500 }
    );
  }
}
