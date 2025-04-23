import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { examPercentageConfigs, schools } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// GET: Fetch all exam configurations for a school
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    
    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all configurations for this school
    const configs = await db.query.examPercentageConfigs.findMany({
      where: (configs, { eq }) => eq(configs.schoolId, schoolId),
      orderBy: (configs, { desc }) => [desc(configs.isDefault), desc(configs.createdAt)],
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("[EXAM_CONFIGS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new exam configuration
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    
    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const {
      name,
      isDefault,
      continuousAssessmentPercent,
      examPercent,
    } = body;

    // Validate required fields
    if (!name || continuousAssessmentPercent === undefined || examPercent === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that percentages add up to 100
    if (continuousAssessmentPercent + examPercent !== 100) {
      return NextResponse.json(
        { error: "Percentages must add up to 100%" },
        { status: 400 }
      );
    }

    // Handle case where new config is set as default
    if (isDefault) {
      // Update existing default configs to non-default
      await db.update(examPercentageConfigs)
        .set({ isDefault: false })
        .where(and(
          eq(examPercentageConfigs.schoolId, schoolId),
          eq(examPercentageConfigs.isDefault, true)
        ));
    }

    // Create the new config
    const newConfig = await db.insert(examPercentageConfigs).values({
      id: createId(),
      schoolId,
      name,
      isDefault: isDefault || false,
      continuousAssessmentPercent,
      examPercent,
    }).returning();

    return NextResponse.json(newConfig[0], { status: 201 });
  } catch (error) {
    console.error("[EXAM_CONFIGS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update an existing exam configuration
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    
    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Config ID is required" }, { status: 400 });
    }

    // Validate percentages if they are being updated
    if (
      updateData.continuousAssessmentPercent !== undefined &&
      updateData.examPercent !== undefined &&
      updateData.continuousAssessmentPercent + updateData.examPercent !== 100
    ) {
      return NextResponse.json(
        { error: "Percentages must add up to 100%" },
        { status: 400 }
      );
    }

    // Check if the config exists and belongs to this school
    const existingConfig = await db.query.examPercentageConfigs.findFirst({
      where: (configs, { and, eq }) => 
        and(eq(configs.id, id), eq(configs.schoolId, schoolId)),
    });

    if (!existingConfig) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    // If setting as default, update other configs to non-default
    if (updateData.isDefault) {
      await db.update(examPercentageConfigs)
        .set({ isDefault: false })
        .where(and(
          eq(examPercentageConfigs.schoolId, schoolId),
          eq(examPercentageConfigs.isDefault, true)
        ));
    }

    // Update the config
    const updatedConfig = await db.update(examPercentageConfigs)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(examPercentageConfigs.id, id), eq(examPercentageConfigs.schoolId, schoolId)))
      .returning();

    return NextResponse.json(updatedConfig[0]);
  } catch (error) {
    console.error("[EXAM_CONFIGS_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete an exam configuration
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    
    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const configId = searchParams.get("id");

    if (!configId) {
      return NextResponse.json({ error: "Config ID is required" }, { status: 400 });
    }

    // Check if the config exists and belongs to this school
    const existingConfig = await db.query.examPercentageConfigs.findFirst({
      where: (configs, { and, eq }) => 
        and(eq(configs.id, configId), eq(configs.schoolId, schoolId)),
    });

    if (!existingConfig) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    // Don't allow deleting the default config
    if (existingConfig.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default configuration" },
        { status: 400 }
      );
    }

    // Check if the config is in use by any assessments
    const usedByAssessment = await db.query.assessments.findFirst({
      where: (assessments, { eq }) => eq(assessments.percentageConfigId, configId),
    });

    if (usedByAssessment) {
      return NextResponse.json(
        { error: "Cannot delete a configuration that is in use by exams" },
        { status: 400 }
      );
    }

    // Delete the config
    await db.delete(examPercentageConfigs)
      .where(and(eq(examPercentageConfigs.id, configId), eq(examPercentageConfigs.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EXAM_CONFIGS_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 