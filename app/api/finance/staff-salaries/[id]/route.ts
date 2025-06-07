import { NextRequest, NextResponse } from "next/server";
import { deleteSalaryRecord, updateSalaryRecord } from "@/lib/finance/queries";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { staff } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {id:salaryId} = await params;
    console.log({salaryId});

    if (!salaryId) {
      return NextResponse.json({ error: "Salary ID is required" }, { status: 400 });
    }

    const _staff = await db.query.staff.findFirst({
      where: eq(staff.userId, session.user.id)
    });

    if (!_staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Delete the salary record
    const result = await deleteSalaryRecord(salaryId, _staff.id);

    return NextResponse.json({
      success: true,
      message: "Salary record deleted successfully",
      deletedRecord: result
    });

  } catch (error) {
    console.error("Error deleting salary record:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to delete salary record" 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {id:salaryId} = await params;
    const body = await request.json();

    if (!salaryId) {
      return NextResponse.json({ error: "Salary ID is required" }, { status: 400 });
    }

    const _staff = await db.query.staff.findFirst({
      where: eq(staff.userId, session.user.id)
    });

    if (!_staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Update the salary record
    const result = await updateSalaryRecord(salaryId, {
      ...body,
      updatedBy: _staff.id
    });

    return NextResponse.json({
      success: true,
      message: "Salary record updated successfully",
      updatedRecord: result
    });

  } catch (error) {
    console.error("Error updating salary record:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to update salary record" 
      },
      { status: 500 }
    );
  }
}
