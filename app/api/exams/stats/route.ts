// api/exams/stats.ts or app/api/exams/stats/route.ts (depending on your Next.js version)
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { exams } from "@/lib/schema";
import { eq, and, or, lt, gt } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
   const session = await getSession()
   if (!session?.user){
    return NextResponse.json({message: "Unauthorized", error: "You are not auhorized."}, {status: 401})
   }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Get current date for comparison
    const now = new Date();

    // Count total exams for the school
    const totalExams = await db.query.exams.findMany({
      where: eq(exams.schoolId, session.user.schoolId),
    });

    // Count upcoming exams (status is scheduled or draft, and exam date is in the future)
    const upcomingExams = totalExams.filter(
      (exam) => 
        (exam.status === "scheduled" || exam.status === "draft") && 
        exam.examDate && new Date(exam.examDate) > now
    );

    // Count in-progress exams (status is active or in progress)
    const inProgressExams = totalExams.filter(
      (exam) => exam.status === "active" || exam.status === "in progress"
    );

    // Count completed exams (status is completed, graded, or published)
    const completedExams = totalExams.filter(
      (exam) => 
        exam.status === "completed" || 
        exam.status === "graded" || 
        exam.status === "published"
    );

    // Return the stats
    return NextResponse.json({
      total: totalExams.length,
      upcoming: upcomingExams.length,
      inProgress: inProgressExams.length,
      completed: completedExams.length,
    });
  } catch (error) {
    console.error("Error fetching exam stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam statistics" },
      { status: 500 }
    );
  }
}