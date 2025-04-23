import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { gradeSystem } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";

// GET: Fetch all grade settings for a school
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    let grades = await db.query.gradeSystem.findMany({
      where: eq(gradeSystem.schoolId, schoolId),
      orderBy: [asc(gradeSystem.minScore)], // Order by minimum score
    });

    // If no grades exist, create default ones
    if (grades.length === 0) {
      const defaultGrades = [
        { grade_name: 'A1', min_score: 75, max_score: 100, interpretation: 'Excellent' },
        { grade_name: 'B2', min_score: 70, max_score: 74, interpretation: 'Very Good' },
        { grade_name: 'B3', min_score: 65, max_score: 69, interpretation: 'Good' },
        { grade_name: 'C4', min_score: 60, max_score: 64, interpretation: 'Credit' },
        { grade_name: 'C5', min_score: 55, max_score: 59, interpretation: 'Credit' },
        { grade_name: 'C6', min_score: 50, max_score: 54, interpretation: 'Credit' },
        { grade_name: 'D7', min_score: 45, max_score: 49, interpretation: 'Pass' },
        { grade_name: 'E8', min_score: 40, max_score: 44, interpretation: 'Pass' },
        { grade_name: 'F9', min_score: 0, max_score: 39, interpretation: 'Fail' },
      ];

      await db.insert(gradeSystem).values(
        defaultGrades.map(grade => ({
          schoolId: schoolId,
          gradeName: grade.grade_name,
          minScore: grade.min_score,
          maxScore: grade.max_score,
          interpretation: grade.interpretation,
        }))
      );

      // Fetch again to include the newly created defaults
      grades = await db.query.gradeSystem.findMany({
        where: eq(gradeSystem.schoolId, schoolId),
        orderBy: [asc(gradeSystem.minScore)],
      });
    }

    return NextResponse.json(grades);
  } catch (error) {
    console.error("[GRADE_SYSTEM_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new grade setting
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { schoolId, gradeName, minScore, maxScore, interpretation, gradePoint } = body;

    if (!schoolId || !gradeName || minScore === undefined || maxScore === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic validation (can add more complex overlap checks)
    if (minScore > maxScore) {
        return NextResponse.json(
            { error: "Minimum score cannot be greater than maximum score" },
            { status: 400 }
        );
    }

    const [newGrade] = await db
      .insert(gradeSystem)
      .values({
        schoolId: schoolId,
        gradeName: gradeName,
        minScore: minScore,
        maxScore: maxScore,
        interpretation,
        gradePoint: gradePoint ? gradePoint.toString() : null, // Ensure grade_point is string or null
      })
      .returning();

    return NextResponse.json(newGrade, { status: 201 });
  } catch (error) {
    console.error("[GRADE_SYSTEM_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
