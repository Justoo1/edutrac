import { NextResponse } from "next/server";
import { getSession } from "next-auth/react";
import db from "@/lib/db";
import { examConfigurations } from "@/lib/schema";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const body = await req.json();
      // Expect snake_case from the updated component
      const { schoolId, class_score_weight, exam_score_weight } = body;
  
      // The component still sends schoolId as camelCase, handle it
      const school_id = schoolId;
  
      if (!school_id || class_score_weight === undefined || exam_score_weight === undefined) {
        return NextResponse.json(
          { error: "Missing required fields (schoolId, class_score_weight, exam_score_weight)" },
          { status: 400 }
        );
      }
  
      // Validate weights sum to 100
      if (class_score_weight + exam_score_weight !== 100) {
        return NextResponse.json(
          { error: "Weights must sum to 100%" },
          { status: 400 }
        );
      }
  
      // Update or create configuration using schema names
      const [config] = await db
        .insert(examConfigurations)
        .values({
          school_id: school_id,
          class_score_weight: class_score_weight,
          exam_score_weight: exam_score_weight,
        })
        .onConflictDoUpdate({
          target: examConfigurations.school_id, // Use schema name for target
          set: {
            class_score_weight: class_score_weight,
            exam_score_weight: exam_score_weight,
            updated_at: new Date(), // Use schema name
          },
        })
        .returning();
  
      // Return the updated config (already snake_case)
      return NextResponse.json(config);
    } catch (error) {
      console.error("[EXAM_CONFIG_PUT]", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  } 