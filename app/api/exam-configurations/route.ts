import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { examConfigurations } from "@/lib/schema";
import { eq } from "drizzle-orm";

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

    // Get or create exam configuration using schema names (snake_case)
    let config = await db.query.examConfigurations.findFirst({
      where: eq(examConfigurations.school_id, schoolId),
    });

    if (!config) {
      // Create default configuration using schema names (snake_case)
      const [newConfig] = await db
        .insert(examConfigurations)
        .values({
          school_id: schoolId,
          class_score_weight: 40,
          exam_score_weight: 60,
          // Add other defaults if needed
        })
        .returning();

      config = newConfig;
    }

    // Return the config (already snake_case)
    return NextResponse.json(config);
  } catch (error) {
    console.error("[EXAM_CONFIG_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    // Destructure all possible fields from the body
    const {
      schoolId,
      class_score_weight,
      exam_score_weight,
      pass_mark,
      highest_mark,
      use_grade_system,
    } = body;

    // Handle potential camelCase schoolId from frontend
    const school_id = schoolId;

    if (!school_id) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Construct the data object with only the fields provided in the request
    const updateData: Partial<typeof examConfigurations.$inferInsert> = {
      updated_at: new Date(), // Always update the timestamp
    };

    if (class_score_weight !== undefined && exam_score_weight !== undefined) {
        if (class_score_weight + exam_score_weight !== 100) {
            return NextResponse.json(
                { error: "Weights must sum to 100%" },
                { status: 400 }
            );
        }
        updateData.class_score_weight = class_score_weight;
        updateData.exam_score_weight = exam_score_weight;
    }

    if (pass_mark !== undefined) {
      updateData.pass_mark = pass_mark;
    }
    if (highest_mark !== undefined) {
      updateData.highest_mark = highest_mark;
    }
    if (use_grade_system !== undefined) {
      updateData.use_grade_system = use_grade_system;
    }

    // Update or create configuration using schema names (snake_case)
    const [config] = await db
      .insert(examConfigurations)
      .values({
        school_id: school_id,
        // Provide defaults only on initial insert if not included in updateData
        class_score_weight: updateData.class_score_weight ?? 40,
        exam_score_weight: updateData.exam_score_weight ?? 60,
        pass_mark: updateData.pass_mark ?? 50,
        highest_mark: updateData.highest_mark ?? 100,
        use_grade_system: updateData.use_grade_system ?? true,
      })
      .onConflictDoUpdate({
        target: examConfigurations.school_id, // Use snake_case
        set: updateData, // Use the constructed updateData object
      })
      .returning();

    // Return the updated/created config (already snake_case)
    return NextResponse.json(config);

  } catch (error) {
    console.error("[EXAM_CONFIG_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 