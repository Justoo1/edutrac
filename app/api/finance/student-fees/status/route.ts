import { NextRequest, NextResponse } from "next/server";
import { getStudentFeesWithStatus } from "@/lib/finance/queries";
import { getServerSession } from "next-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const academicYear = searchParams.get("academicYear");
    const term = searchParams.get("term");
    
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const fees = await getStudentFeesWithStatus(studentId, academicYear || undefined, term || undefined);
    return NextResponse.json(fees);

  } catch (error) {
    console.error("Error in student fees status API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
