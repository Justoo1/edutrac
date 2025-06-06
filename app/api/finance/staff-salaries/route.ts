import { NextRequest, NextResponse } from "next/server";
import { getStaffSalaries, processSalaryPayment, createSalaryRecord, processPayrollPayments, getPendingSalariesForPeriod } from "@/lib/finance/queries";
import { getServerSession } from "next-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const payPeriod = searchParams.get("payPeriod");
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const salaries = await getStaffSalaries(schoolId, payPeriod || undefined);
    return NextResponse.json(salaries);

  } catch (error) {
    console.error("Error in staff salaries API:", error);
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
    
    // Use createSalaryRecord for adding new salary records
    const salary = await createSalaryRecord({
      ...body,
      recordedBy: session.user.id
    });

    return NextResponse.json(salary, { status: 201 });

  } catch (error) {
    console.error("Error creating salary record:", error);
    return NextResponse.json(
      { error: "Failed to create salary record" },
      { status: 500 }
    );
  }
}
