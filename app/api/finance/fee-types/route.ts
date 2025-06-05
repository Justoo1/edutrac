import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { feeTypes } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const academicYear = searchParams.get("academicYear");
    const term = searchParams.get("term");
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    let whereConditions = [eq(feeTypes.schoolId, schoolId)];
    
    if (academicYear) {
      whereConditions.push(eq(feeTypes.academicYear, academicYear));
    }
    
    if (term) {
      whereConditions.push(eq(feeTypes.term, term));
    }

    const fees = await db
      .select()
      .from(feeTypes)
      .where(and(...whereConditions))
      .orderBy(feeTypes.createdAt);

    return NextResponse.json(fees);

  } catch (error) {
    console.error("Error in fee types API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      schoolId,
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

    // Validate required fields
    if (!schoolId || !name || !amount || !frequency || !academicYear || !term) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newFeeType = await db
      .insert(feeTypes)
      .values({
        schoolId,
        name,
        description,
        amount: parseFloat(amount),
        frequency,
        gradeLevel,
        academicYear,
        term,
        optional: optional || false,
        dueDate: dueDate ? new Date(dueDate) : undefined
      })
      .returning();

    return NextResponse.json(newFeeType[0], { status: 201 });

  } catch (error) {
    console.error("Error creating fee type:", error);
    return NextResponse.json(
      { error: "Failed to create fee type" },
      { status: 500 }
    );
  }
}
