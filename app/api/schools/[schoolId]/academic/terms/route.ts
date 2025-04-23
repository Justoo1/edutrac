import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { academicTerms, academicYears, schools } from "@/lib/schema";
import { and, eq, not } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// GET: Fetch all academic terms for a school
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
    const yearId = searchParams.get("yearId");
    const currentOnly = searchParams.get("current") === "true";

    // Build query based on parameters
    let terms;
    
    if (currentOnly) {
      terms = await db.query.academicTerms.findMany({
        where: (terms, { and, eq }) => 
          and(
            eq(terms.schoolId, schoolId), 
            eq(terms.isCurrent, true)
          ),
        with: {
          academicYear: true
        },
        orderBy: (terms, { asc }) => [asc(terms.startDate)]
      });
    } else if (yearId) {
      terms = await db.query.academicTerms.findMany({
        where: (terms, { and, eq }) => 
          and(
            eq(terms.schoolId, schoolId),
            eq(terms.academicYearId, yearId)
          ),
        with: {
          academicYear: true
        },
        orderBy: (terms, { asc }) => [asc(terms.termNumber)]
      });
    } else {
      terms = await db.query.academicTerms.findMany({
        where: (terms, { eq }) => eq(terms.schoolId, schoolId),
        with: {
          academicYear: true
        },
        orderBy: (terms, { desc, asc }) => [
          desc(terms.isCurrent),
          desc(terms.startDate),
          asc(terms.termNumber)
        ]
      });
    }

    return NextResponse.json(terms);
  } catch (error) {
    console.error("[ACADEMIC_TERMS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new academic term
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
      academicYearId,
      name,
      termNumber,
      startDate,
      endDate,
      status,
    } = body;

    // Validate required fields
    if (!academicYearId || !name || !termNumber || !startDate || !endDate) {
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

    // Check if the academic year exists and belongs to this school
    const academicYear = await db.query.academicYears.findFirst({
      where: (years, { and, eq }) => 
        and(eq(years.id, academicYearId), eq(years.schoolId, schoolId)),
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Academic year not found" },
        { status: 404 }
      );
    }

    // Ensure term dates are within the academic year range
    if (start < academicYear.startDate || end > academicYear.endDate) {
      return NextResponse.json(
        { error: "Term dates must be within the academic year range" },
        { status: 400 }
      );
    }

    // Check for duplicate term number in the same academic year
    const existingTerm = await db.query.academicTerms.findFirst({
      where: (terms, { and, eq }) => 
        and(
          eq(terms.academicYearId, academicYearId),
          eq(terms.termNumber, termNumber)
        ),
    });

    if (existingTerm) {
      return NextResponse.json(
        { error: `Term ${termNumber} already exists for this academic year` },
        { status: 400 }
      );
    }

    // Create the new academic term
    const newTerm = await db.insert(academicTerms).values({
      id: createId(),
      academicYearId,
      schoolId,
      name,
      termNumber,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: academicYear.isCurrent,
      status: status || "upcoming",
    }).returning();

    return NextResponse.json(newTerm[0], { status: 201 });
  } catch (error) {
    console.error("[ACADEMIC_TERMS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update an existing academic term
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
    const { id, academicYearId, termNumber, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Term ID is required" }, { status: 400 });
    }

    // Check if the term exists and belongs to this school
    const existingTerm = await db.query.academicTerms.findFirst({
      where: (terms, { and, eq }) => 
        and(eq(terms.id, id), eq(terms.schoolId, schoolId)),
      with: {
        academicYear: true
      }
    });

    if (!existingTerm) {
      return NextResponse.json({ error: "Academic term not found" }, { status: 404 });
    }

    let updatedYearId = existingTerm.academicYearId;
    let updatedTermNumber = existingTerm.termNumber;

    // Validate academic year if changing
    if (academicYearId && academicYearId !== existingTerm.academicYearId) {
      // Check if the new academic year exists and belongs to this school
      const newAcademicYear = await db.query.academicYears.findFirst({
        where: (years, { and, eq }) => 
          and(eq(years.id, academicYearId), eq(years.schoolId, schoolId)),
      });

      if (!newAcademicYear) {
        return NextResponse.json(
          { error: "New academic year not found" },
          { status: 404 }
        );
      }

      updatedYearId = academicYearId;
    }

    // Check for duplicate term number if changing academic year or term number
    if ((updatedYearId !== existingTerm.academicYearId) || 
        (termNumber && termNumber !== existingTerm.termNumber)) {
      
      updatedTermNumber = termNumber || existingTerm.termNumber;
      
      // Check for duplicate term number in the same academic year
      const duplicateTerm = await db.query.academicTerms.findFirst({
        where: (terms, { and, eq, not }) => 
          and(
            eq(terms.academicYearId, updatedYearId),
            eq(terms.termNumber, updatedTermNumber),
            not(eq(terms.id, id))
          ),
      });

      if (duplicateTerm) {
        return NextResponse.json(
          { error: `Term ${updatedTermNumber} already exists for this academic year` },
          { status: 400 }
        );
      }
    }

    // Validate dates if they're being updated
    let start = existingTerm.startDate;
    let end = existingTerm.endDate;
    
    if (updateData.startDate) {
      start = new Date(updateData.startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date format" },
          { status: 400 }
        );
      }
    }
    
    if (updateData.endDate) {
      end = new Date(updateData.endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date format" },
          { status: 400 }
        );
      }
    }
    
    if (start >= end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Ensure term dates are within the academic year range
    const relevantAcademicYear = await db.query.academicYears.findFirst({
      where: (years, { eq }) => eq(years.id, updatedYearId),
    });

    if (relevantAcademicYear && 
        (start < relevantAcademicYear.startDate || end > relevantAcademicYear.endDate)) {
      return NextResponse.json(
        { error: "Term dates must be within the academic year range" },
        { status: 400 }
      );
    }

    // Check for overlapping terms
    const overlappingTerms = await db.query.academicTerms.findMany({
      where: (terms, { and, eq, or, lt, gt, not }) => 
        and(
          eq(terms.academicYearId, updatedYearId),
          not(eq(terms.id, id)),
          or(
            and(
              lt(terms.startDate, end),
              gt(terms.endDate, start)
            ),
            and(
              lt(terms.startDate, end),
              gt(terms.startDate, start)
            ),
            and(
              lt(terms.endDate, end),
              gt(terms.endDate, start)
            )
          )
        ),
    });

    if (overlappingTerms.length > 0) {
      return NextResponse.json(
        { error: "This term would overlap with existing terms" },
        { status: 400 }
      );
    }

    // If setting this term as current, update other terms
    if (updateData.isCurrent) {
      await db.update(academicTerms)
        .set({ isCurrent: false })
        .where(and(
          eq(academicTerms.schoolId, schoolId),
          eq(academicTerms.isCurrent, true),
          not(eq(academicTerms.id, id))
        ));
      
      // Also set the parent academic year as current
      await db.update(academicYears)
        .set({ isCurrent: true })
        .where(eq(academicYears.id, updatedYearId));
    }

    // Format dates for update
    if (updateData.startDate) {
      updateData.startDate = start;
    }
    
    if (updateData.endDate) {
      updateData.endDate = end;
    }

    // Update the academic term
    const updatedTerm = await db.update(academicTerms)
      .set({
        ...updateData,
        academicYearId: updatedYearId,
        termNumber: updatedTermNumber,
        updatedAt: new Date(),
      })
      .where(and(eq(academicTerms.id, id), eq(academicTerms.schoolId, schoolId)))
      .returning();

    return NextResponse.json(updatedTerm[0]);
  } catch (error) {
    console.error("[ACADEMIC_TERMS_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete an academic term
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
    const termId = searchParams.get("id");

    if (!termId) {
      return NextResponse.json({ error: "Term ID is required" }, { status: 400 });
    }

    // Check if the term exists and belongs to this school
    const existingTerm = await db.query.academicTerms.findFirst({
      where: (terms, { and, eq }) => 
        and(eq(terms.id, termId), eq(terms.schoolId, schoolId)),
    });

    if (!existingTerm) {
      return NextResponse.json({ error: "Academic term not found" }, { status: 404 });
    }

    // Don't allow deleting the current term
    if (existingTerm.isCurrent) {
      return NextResponse.json(
        { error: "Cannot delete the current academic term" },
        { status: 400 }
      );
    }

    // Check if there are any assessments linked to this term
    const linkedAssessments = await db.query.assessments.findFirst({
      where: (assessments, { eq }) => eq(assessments.academicTermId, termId),
    });

    if (linkedAssessments) {
      return NextResponse.json(
        { error: "Cannot delete a term that has assessments" },
        { status: 400 }
      );
    }

    // Check if there are any term results linked to this term
    const linkedResults = await db.query.termResults.findFirst({
      where: (results, { eq }) => eq(results.academicTermId, termId),
    });

    if (linkedResults) {
      return NextResponse.json(
        { error: "Cannot delete a term that has student results" },
        { status: 400 }
      );
    }

    // Delete the academic term
    await db.delete(academicTerms)
      .where(and(eq(academicTerms.id, termId), eq(academicTerms.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ACADEMIC_TERMS_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 