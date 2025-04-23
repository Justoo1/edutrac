import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { batches, schools } from "@/lib/schema";
import { and, eq, not } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { nanoid } from "nanoid";

// GET: Fetch all batches for a school
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
    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this school" },
        { status: 403 }
      );
    }

    // Get all batches for the school
    const schoolBatches = await db.query.batches.findMany({
      where: eq(batches.schoolId, schoolId),
    });

    return NextResponse.json(schoolBatches);
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Fetch a single school for school type checking
export async function HEAD(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    
    // Fetch the school details
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error("[SCHOOL_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new batch
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
    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this school" },
        { status: 403 }
      );
    }

    // Get batch data from the request
    const { name, gradeLevel, capacity } = await req.json();

    if (!name || !gradeLevel) {
      return NextResponse.json(
        { error: "Name and grade level are required" },
        { status: 400 }
      );
    }

    // Check if a batch with same name already exists
    const existingBatch = await db.query.batches.findFirst({
      where: (batches, { and, eq }) => 
        and(
          eq(batches.schoolId, schoolId),
          eq(batches.name, name)
        )
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: `A batch with the name "${name}" already exists` },
        { status: 400 }
      );
    }

    // Create the new batch
    const newBatch = {
      id: nanoid(),
      name,
      gradeLevel,
      capacity: capacity || null,
      schoolId,
      academicYearId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(batches).values(newBatch).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error creating batch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing batch
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
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Check if the batch exists and belongs to this school
    const existingBatch = await db.query.batches.findFirst({
      where: and(
        eq(batches.id, id),
        eq(batches.schoolId, schoolId)
      ),
    });

    if (!existingBatch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // If changing grade level or academic year, check for duplicates
    if ((updateData.gradeLevel && updateData.gradeLevel !== existingBatch.gradeLevel) ||
        (updateData.academicYearId && updateData.academicYearId !== existingBatch.academicYearId)) {
      const gradeLevel = updateData.gradeLevel || existingBatch.gradeLevel;
      const academicYearId = updateData.academicYearId || existingBatch.academicYearId;
      
      const duplicateBatch = await db.query.batches.findFirst({
        where: and(
          eq(batches.schoolId, schoolId),
          eq(batches.gradeLevel, gradeLevel),
          eq(batches.academicYearId, academicYearId),
          not(eq(batches.id, id))
        ),
      });

      if (duplicateBatch) {
        return NextResponse.json(
          { error: `A batch for ${gradeLevel} already exists in the selected academic year` },
          { status: 400 }
        );
      }
    }

    // Update the batch
    const updatedBatch = await db.update(batches)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(batches.id, id), eq(batches.schoolId, schoolId)))
      .returning();

    return NextResponse.json(updatedBatch[0]);
  } catch (error) {
    console.error("[BATCHES_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete a batch
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
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("id");

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Check if the batch exists and belongs to this school
    const existingBatch = await db.query.batches.findFirst({
      where: and(
        eq(batches.id, batchId),
        eq(batches.schoolId, schoolId)
      ),
    });

    if (!existingBatch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Delete the batch
    await db.delete(batches)
      .where(and(eq(batches.id, batchId), eq(batches.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BATCHES_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 