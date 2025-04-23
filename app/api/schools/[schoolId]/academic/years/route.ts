import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { academicYears, schools, academicTerms } from "@/lib/schema";
import { and, eq, not } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// GET: Fetch all academic years for a school
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const currentOnly = searchParams.get("current") === "true";

    // Conditionally build query based on currentOnly flag
    let years;
    if (currentOnly) {
      years = await db.query.academicYears.findMany({
        where: (years, { and, eq }) => 
          and(eq(years.schoolId, schoolId), eq(years.isCurrent, true)),
        with: {
          terms: {
            orderBy: (terms, { asc }) => [asc(terms.termNumber)]
          }
        }
      });
    } else {
      years = await db.query.academicYears.findMany({
        where: (years, { eq }) => eq(years.schoolId, schoolId),
        orderBy: (years, { desc }) => [desc(years.isCurrent), desc(years.startDate)],
        with: {
          terms: {
            orderBy: (terms, { asc }) => [asc(terms.termNumber)]
          }
        }
      });
    }

    return NextResponse.json(years);
  } catch (error) {
    console.error("[ACADEMIC_YEARS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new academic year
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
      startDate,
      endDate,
      isCurrent,
      status,
    } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date formats" },
        { status: 400 }
      );
    }
    
    if (start >= end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Check for overlapping academic years
    const overlappingYears = await db.query.academicYears.findMany({
      where: (years, { and, eq, or, lt, gt }) => 
        and(
          eq(years.schoolId, schoolId),
          or(
            and(
              lt(years.startDate, new Date(endDate)),
              gt(years.endDate, new Date(startDate))
            ),
            and(
              lt(years.startDate, new Date(endDate)),
              gt(years.startDate, new Date(startDate))
            ),
            and(
              lt(years.endDate, new Date(endDate)),
              gt(years.endDate, new Date(startDate))
            )
          )
        ),
    });

    if (overlappingYears.length > 0) {
      return NextResponse.json(
        { error: "This academic year overlaps with existing years" },
        { status: 400 }
      );
    }

    // If this year is set as current, update other years
    if (isCurrent) {
      // First, get all current academic years that will be set to past
      const currentYears = await db.query.academicYears.findMany({
        where: (years, { and, eq }) => 
          and(
            eq(years.schoolId, schoolId),
            eq(years.isCurrent, true)
          ),
      });

      // Update all current academic years to past
      await db.update(academicYears)
        .set({ isCurrent: false })
        .where(and(
          eq(academicYears.schoolId, schoolId),
          eq(academicYears.isCurrent, true)
        ));

      // Update all terms associated with the years that were set to past
      for (const year of currentYears) {
        await db.update(academicTerms)
          .set({ isCurrent: false })
          .where(eq(academicTerms.academicYearId, year.id));
      }
    }

    // Create the new academic year
    const newYear = await db.insert(academicYears).values({
      id: createId(),
      schoolId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: isCurrent || false,
      status: status || "upcoming",
    }).returning();

    return NextResponse.json(newYear[0], { status: 201 });
  } catch (error) {
    console.error("[ACADEMIC_YEARS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update an existing academic year
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
      return NextResponse.json({ error: "Academic year ID is required" }, { status: 400 });
    }

    // Check if the academic year exists and belongs to this school
    const existingYear = await db.query.academicYears.findFirst({
      where: (years, { and, eq }) => 
        and(eq(years.id, id), eq(years.schoolId, schoolId)),
    });

    if (!existingYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Validate dates if they're being updated
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid date formats" },
          { status: 400 }
        );
      }
      
      if (start >= end) {
        return NextResponse.json(
          { error: "Start date must be before end date" },
          { status: 400 }
        );
      }

      // Check for overlapping academic years (excluding this one)
      const overlappingYears = await db.query.academicYears.findMany({
        where: (years, { and, eq, or, lt, gt, not }) => 
          and(
            eq(years.schoolId, schoolId),
            not(eq(years.id, id)),
            or(
              and(
                lt(years.startDate, new Date(updateData.endDate)),
                gt(years.endDate, new Date(updateData.startDate))
              ),
              and(
                lt(years.startDate, new Date(updateData.endDate)),
                gt(years.startDate, new Date(updateData.startDate))
              ),
              and(
                lt(years.endDate, new Date(updateData.endDate)),
                gt(years.endDate, new Date(updateData.startDate))
              )
            )
          ),
      });

      if (overlappingYears.length > 0) {
        return NextResponse.json(
          { error: "This academic year would overlap with existing years" },
          { status: 400 }
        );
      }
    }

    // If setting this year as current, update other years
    if (updateData.isCurrent) {
      await db.update(academicYears)
        .set({ isCurrent: false })
        .where(and(
          eq(academicYears.schoolId, schoolId),
          eq(academicYears.isCurrent, true),
          not(eq(academicYears.id, id))
        ));
    }

    // Update dates if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    // Update the academic year
    const updatedYear = await db.update(academicYears)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(academicYears.id, id), eq(academicYears.schoolId, schoolId)))
      .returning();

    return NextResponse.json(updatedYear[0]);
  } catch (error) {
    console.error("[ACADEMIC_YEARS_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete an academic year
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
    const yearId = searchParams.get("id");

    if (!yearId) {
      return NextResponse.json({ error: "Academic year ID is required" }, { status: 400 });
    }

    // Check if the academic year exists and belongs to this school
    const existingYear = await db.query.academicYears.findFirst({
      where: (years, { and, eq }) => 
        and(eq(years.id, yearId), eq(years.schoolId, schoolId)),
      with: {
        terms: true,
      }
    });

    if (!existingYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Don't allow deleting the current academic year
    if (existingYear.isCurrent) {
      return NextResponse.json(
        { error: "Cannot delete the current academic year" },
        { status: 400 }
      );
    }

    // Don't allow deleting if there are terms
    if (existingYear.terms && existingYear.terms.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete an academic year with terms. Delete the terms first." },
        { status: 400 }
      );
    }

    // Check if there are any assessments linked to this academic year
    const linkedAssessments = await db.query.assessments.findFirst({
      where: (assessments, { eq }) => eq(assessments.academicYearId, yearId),
    });

    if (linkedAssessments) {
      return NextResponse.json(
        { error: "Cannot delete an academic year that has assessments" },
        { status: 400 }
      );
    }

    // Check if there are any class enrollments or student records linked to this year
    const linkedClassHistory = await db.query.studentClassHistory.findFirst({
      where: (history, { eq }) => eq(history.academicYearId, yearId),
    });

    if (linkedClassHistory) {
      return NextResponse.json(
        { error: "Cannot delete an academic year that has student enrollment records" },
        { status: 400 }
      );
    }

    // Delete the academic year
    await db.delete(academicYears)
      .where(and(eq(academicYears.id, yearId), eq(academicYears.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ACADEMIC_YEARS_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 