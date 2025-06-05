import { NextRequest, NextResponse } from "next/server";
import { getFinancialOverview, getMonthlyFinancialData } from "@/lib/finance/queries";
import { getServerSession } from "next-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const type = searchParams.get("type");
    const year = searchParams.get("year");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    if (type === "monthly" && year) {
      const monthlyData = await getMonthlyFinancialData(schoolId, parseInt(year));
      return NextResponse.json(monthlyData);
    }

    const period = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : undefined;

    const overview = await getFinancialOverview(schoolId, period);
    return NextResponse.json(overview);

  } catch (error) {
    console.error("Error in financial overview API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
