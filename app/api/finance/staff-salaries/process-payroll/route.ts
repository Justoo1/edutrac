import { NextRequest, NextResponse } from "next/server";
import { processPayrollPayments, getPendingSalariesForPeriod } from "@/lib/finance/queries";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { staff } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { schoolId, payPeriod, paymentMethod, notes } = body;
    
    console.log('Payroll API received:', { schoolId, payPeriod, paymentMethod, notes });
    
    if (!schoolId || !payPeriod || !paymentMethod) {
      return NextResponse.json({ 
        error: "School ID, pay period, and payment method are required" 
      }, { status: 400 });
    }
    
    const _staff = await db.query.staff.findFirst({
      where: eq(staff.userId, session.user.id)
    })

    console.log('Found staff member:', _staff);

    if (!_staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Process the payroll
    const result = await processPayrollPayments({
      schoolId,
      payPeriod,
      paymentMethod,
      processedBy: _staff.id,
      notes
    });

    console.log('Payroll processing result:', result);

    return NextResponse.json({
      success: true,
      message: `Successfully processed payroll for ${result.processedCount} staff members`,
      ...result
    }, { status: 200 });

  } catch (error) {
    console.error("Error processing payroll:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process payroll" 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const payPeriod = searchParams.get("payPeriod");
    
    if (!schoolId || !payPeriod) {
      return NextResponse.json({ 
        error: "School ID and pay period are required" 
      }, { status: 400 });
    }

    // Get pending salaries for the period
    const result = await getPendingSalariesForPeriod(schoolId, payPeriod);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching pending salaries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
