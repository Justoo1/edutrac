import { NextRequest, NextResponse } from "next/server";
import { getStudentsWithFees, recordFeePayment } from "@/lib/finance/queries";
import { getServerSession } from "next-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
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
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const payment = await recordFeePayment({
      ...body,
      recordedBy: session.user.id
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
