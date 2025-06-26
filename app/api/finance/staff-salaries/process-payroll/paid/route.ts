import { NextRequest, NextResponse } from "next/server";
import { getSalariesForPeriod } from "@/lib/finance/queries";
import { getSession } from "@/lib/auth";


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
    const result = await getSalariesForPeriod(schoolId, payPeriod);
    console.log('Paid salaries for period:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching pending salaries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
