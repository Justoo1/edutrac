import { NextRequest, NextResponse } from "next/server";
import { getStudentsWithFees, recordFeePayment } from "@/lib/finance/queries";
import { getSession } from "@/lib/auth";
import { staff } from "@/lib/schema";
import db from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const students = await getStudentsWithFees(schoolId);
    return NextResponse.json(students);

  } catch (error) {
    console.error("Error in student fees API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Debug logging
    console.log("Session user:", session.user);
    console.log("Request body:", body);
    
    // Ensure we have a valid recordedBy value
    const recordedBy = session.user.id;
    const staffData = await db.select().from(staff).where(eq(staff.userId, recordedBy)).limit(1);
    
    if (!staffData.length) {
      console.error("No valid recordedBy value found in session:", session);
      return NextResponse.json({ error: "Invalid session data" }, { status: 400 });
    }

    const payment = await recordFeePayment({
      ...body,
      recordedBy: staffData[0].id
    });

    return NextResponse.json(payment, { status: 201 });

  } catch (error) {
    console.error("Error recording fee payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
