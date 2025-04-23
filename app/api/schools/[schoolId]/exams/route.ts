import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { assessments, examPercentageConfigs, schools, subjects, classes } from "@/lib/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// GET: Fetch all exams for a school
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
    const term = searchParams.get("term");
    const academicYear = searchParams.get("academicYear");
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    // Build where conditions
    let whereConditions = (assessments: any, { and, eq }: any) => {
      const conditions = [eq(assessments.schoolId, schoolId)];
      
      if (term) conditions.push(eq(assessments.term, term));
      if (academicYear) conditions.push(eq(assessments.academicYear, academicYear));
      if (classId) conditions.push(eq(assessments.classId, classId));
      if (subjectId) conditions.push(eq(assessments.subjectId, subjectId));
      if (type) conditions.push(eq(assessments.type, type));
      if (category) conditions.push(eq(assessments.category, category));
      
      return and(...conditions);
    };

    // Fetch all exams with related data
    const exams = await db.query.assessments.findMany({
      where: whereConditions,
      with: {
        subject: true,
        class: true,
        percentageConfig: true,
      },
      orderBy: (assessments, { desc }) => [
        desc(assessments.createdAt)
      ]
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("[EXAMS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new exam
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
      title,
      description,
      type,
      category,
      totalMarks,
      passMark,
      weight,
      date,
      academicYear,
      term,
      classId,
      subjectId,
      percentageConfigId,
    } = body;

    // Validate required fields
    if (!title || !type || !totalMarks || !academicYear || !term || !classId || !subjectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify that the class and subject exist
    const classExists = await db.query.classes.findFirst({
      where: (classes, { and, eq }) => 
        and(eq(classes.id, classId), eq(classes.schoolId, schoolId)),
    });

    const subjectExists = await db.query.subjects.findFirst({
      where: (subjects, { and, eq }) => 
        and(eq(subjects.id, subjectId), eq(subjects.schoolId, schoolId)),
    });

    if (!classExists || !subjectExists) {
      return NextResponse.json(
        { error: "Invalid class or subject" },
        { status: 400 }
      );
    }

    // If percentageConfigId is provided, verify it exists
    if (percentageConfigId) {
      const configExists = await db.query.examPercentageConfigs.findFirst({
        where: (configs, { and, eq }) => 
          and(eq(configs.id, percentageConfigId), eq(configs.schoolId, schoolId)),
      });

      if (!configExists) {
        return NextResponse.json(
          { error: "Invalid percentage configuration" },
          { status: 400 }
        );
      }
    } else {
      // If no config provided, get the default one
      const defaultConfig = await db.query.examPercentageConfigs.findFirst({
        where: (configs, { and, eq }) => 
          and(eq(configs.schoolId, schoolId), eq(configs.isDefault, true)),
      });

      if (defaultConfig) {
        body.percentageConfigId = defaultConfig.id;
      }
    }

    // Create the new exam
    const newExam = await db.insert(assessments).values({
      id: createId(),
      schoolId,
      title,
      description,
      type,
      category: category || (type === 'exam' ? 'final_exam' : 'continuous_assessment'),
      totalMarks,
      passMark,
      weight,
      date: date ? new Date(date) : undefined,
      academicYear,
      term,
      classId,
      subjectId,
      percentageConfigId: body.percentageConfigId,
      createdBy: session.user.id,
    }).returning();

    return NextResponse.json(newExam[0], { status: 201 });
  } catch (error) {
    console.error("[EXAMS_POST]", error);
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
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    // Check if the exam exists and belongs to this school
    const existingExam = await db.query.assessments.findFirst({
      where: (assessments, { and, eq }) => 
        and(eq(assessments.id, id), eq(assessments.schoolId, schoolId)),
    });

    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Don't allow updating an exam if it's already completed
    if (existingExam.status === 'completed' || existingExam.gradingComplete) {
      return NextResponse.json(
        { error: "Cannot update a completed exam" },
        { status: 400 }
      );
    }

    // Update the exam
    const updatedExam = await db.update(assessments)
      .set({
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : existingExam.date,
        updatedAt: new Date(),
      })
      .where(and(eq(assessments.id, id), eq(assessments.schoolId, schoolId)))
      .returning();

    return NextResponse.json(updatedExam[0]);
  } catch (error) {
    console.error("[EXAMS_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete an exam
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
    const examId = searchParams.get("id");

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    // Check if the exam exists and belongs to this school
    const existingExam = await db.query.assessments.findFirst({
      where: (assessments, { and, eq }) => 
        and(eq(assessments.id, examId), eq(assessments.schoolId, schoolId)),
    });

    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Don't allow deleting an exam if it has results
    const hasResults = await db.query.assessmentResults.findFirst({
      where: (results, { eq }) => eq(results.assessmentId, examId),
    });

    if (hasResults) {
      return NextResponse.json(
        { error: "Cannot delete an exam with existing results" },
        { status: 400 }
      );
    }

    // Delete the exam
    await db.delete(assessments)
      .where(and(eq(assessments.id, examId), eq(assessments.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EXAMS_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 