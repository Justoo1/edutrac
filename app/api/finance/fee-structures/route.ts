import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { feeStructures } from "@/lib/schema";
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
    const level = searchParams.get("level");
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    let whereConditions = [eq(feeStructures.schoolId, schoolId)];
    
    if (academicYear) {
      whereConditions.push(eq(feeStructures.academicYear, academicYear));
    }
    
    if (level && level !== "all") {
      whereConditions.push(eq(feeStructures.level, level));
    }

    const structures = await db
      .select()
      .from(feeStructures)
      .where(and(...whereConditions))
      .orderBy(feeStructures.academicYear, feeStructures.level, feeStructures.className);

    return NextResponse.json(structures);

  } catch (error) {
    console.error("Error in fee structures API:", error);
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
    if (!schoolId || !className || !level || !academicYear) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate total fee
    const totalFee = (tuitionFee || 0) + (activitiesFee || 0) + (examinationFee || 0) + 
                     (libraryFee || 0) + (laboratoryFee || 0) + (transportFee || 0);

    const newFeeStructure = await db
      .insert(feeStructures)
      .values({
        schoolId,
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
        status: "active"
      })
      .returning();

    return NextResponse.json(newFeeStructure[0], { status: 201 });

  } catch (error) {
    console.error("Error creating fee structure:", error);
    return NextResponse.json(
      { error: "Failed to create fee structure" },
      { status: 500 }
    );
  }
}
