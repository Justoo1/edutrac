import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { schools, studentClassHistory, students, classes } from "@/lib/schema";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// GET: Fetch student class history records
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
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const academicYearId = searchParams.get("academicYearId");
    const currentOnly = searchParams.get("current") === "true";

    // Build the base query
    let baseQuery: any = {
      where: (history: any, { eq, and, isNull, or }: any) => {
        const conditions = [eq(history.schoolId, schoolId)];
        
        if (studentId) {
          conditions.push(eq(history.studentId, studentId));
        }
        
        if (classId) {
          conditions.push(eq(history.classId, classId));
        }
        
        if (academicYearId) {
          conditions.push(eq(history.academicYearId, academicYearId));
        }
        
        if (currentOnly) {
          conditions.push(isNull(history.endDate));
        }
        
        return and(...conditions);
      },
      with: {
        student: true,
        class: true,
        academicYear: true
      },
      orderBy: (history: any, { desc }: any) => [desc(history.enrollmentDate)]
    };

    const historyRecords = await db.query.studentClassHistory.findMany(baseQuery);

    return NextResponse.json(historyRecords);
  } catch (error) {
    console.error("[STUDENT_CLASS_HISTORY_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new student class history record (enroll or promote students)
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
    
    // Check if this is a bulk operation
    if (Array.isArray(body)) {
      return handleBulkEnrollment(body, schoolId, session.user.id);
    }
    
    // Handle single enrollment
    const {
      studentId,
      classId,
      academicYearId,
      enrollmentDate,
      status,
      comments
    } = body;

    // Validate required fields
    if (!studentId || !classId || !academicYearId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify student belongs to the school
    const student = await db.query.students.findFirst({
      where: (students, { and, eq }) => 
        and(eq(students.id, studentId), eq(students.schoolId, schoolId)),
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found or doesn't belong to this school" },
        { status: 404 }
      );
    }

    // Verify class belongs to the school
    const classRecord = await db.query.classes.findFirst({
      where: (classes, { and, eq }) => 
        and(eq(classes.id, classId), eq(classes.schoolId, schoolId)),
    });

    if (!classRecord) {
      return NextResponse.json(
        { error: "Class not found or doesn't belong to this school" },
        { status: 404 }
      );
    }

    // Verify academic year belongs to the school
    const academicYear = await db.query.academicYears.findFirst({
      where: (years, { and, eq }) => 
        and(eq(years.id, academicYearId), eq(years.schoolId, schoolId)),
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Academic year not found or doesn't belong to this school" },
        { status: 404 }
      );
    }

    // Check if the student is already enrolled in a class for this academic year
    const existingEnrollment = await db.query.studentClassHistory.findFirst({
      where: (history, { and, eq, isNull }) => 
        and(
          eq(history.studentId, studentId),
          eq(history.academicYearId, academicYearId),
          isNull(history.endDate)
        ),
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Student is already enrolled in a class for this academic year" },
        { status: 400 }
      );
    }

    // Create the enrollment record
    const newEnrollment = await db.insert(studentClassHistory).values({
      id: createId(),
      studentId,
      classId,
      academicYearId,
      schoolId,
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
      status: status || "active",
      comments,
      recordedBy: session.user.id,
    }).returning();

    return NextResponse.json(newEnrollment[0], { status: 201 });
  } catch (error) {
    console.error("[STUDENT_CLASS_HISTORY_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Utility function to handle bulk enrollment
async function handleBulkEnrollment(
  enrollments: Array<{
    studentId: string;
    classId: string;
    academicYearId: string;
    enrollmentDate?: string;
    status?: string;
    comments?: string;
  }>,
  schoolId: string,
  userId: string
) {
  try {
    // Validate all student IDs, class IDs, and academic year IDs
    const studentIds = [...new Set(enrollments.map(e => e.studentId))];
    const classIds = [...new Set(enrollments.map(e => e.classId))];
    const academicYearIds = [...new Set(enrollments.map(e => e.academicYearId))];

    // Verify all students belong to the school
    const students = await db.query.students.findMany({
      where: (students, { and, eq, inArray }) => 
        and(
          eq(students.schoolId, schoolId),
          inArray(students.id, studentIds)
        ),
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: "Some students not found or don't belong to this school" },
        { status: 404 }
      );
    }

    // Verify all classes belong to the school
    const classes = await db.query.classes.findMany({
      where: (classes, { and, eq, inArray }) => 
        and(
          eq(classes.schoolId, schoolId),
          inArray(classes.id, classIds)
        ),
    });

    if (classes.length !== classIds.length) {
      return NextResponse.json(
        { error: "Some classes not found or don't belong to this school" },
        { status: 404 }
      );
    }

    // Verify all academic years belong to the school
    const academicYears = await db.query.academicYears.findMany({
      where: (years, { and, eq, inArray }) => 
        and(
          eq(years.schoolId, schoolId),
          inArray(years.id, academicYearIds)
        ),
    });

    if (academicYears.length !== academicYearIds.length) {
      return NextResponse.json(
        { error: "Some academic years not found or don't belong to this school" },
        { status: 404 }
      );
    }

    // Check for existing active enrollments and close them
    const existingEnrollments = await db.query.studentClassHistory.findMany({
      where: (history, { and, inArray, isNull }) => 
        and(
          inArray(history.studentId, studentIds),
          inArray(history.academicYearId, academicYearIds),
          isNull(history.endDate)
        ),
    });

    // Close any existing enrollments
    if (existingEnrollments.length > 0) {
      const existingIds = existingEnrollments.map(e => e.id);
      
      await db.update(studentClassHistory)
        .set({ 
          endDate: new Date(),
          status: "completed",
          comments: "Closed due to new enrollment or promotion",
          updatedAt: new Date()
        })
        .where(inArray(studentClassHistory.id, existingIds));
    }

    // Create new enrollment records
    const enrollmentRecords = enrollments.map(enrollment => ({
      id: createId(),
      studentId: enrollment.studentId,
      classId: enrollment.classId,
      academicYearId: enrollment.academicYearId,
      schoolId,
      enrollmentDate: enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate) : new Date(),
      status: enrollment.status || "active",
      comments: enrollment.comments,
      recordedBy: userId,
    }));

    const newEnrollments = await db.insert(studentClassHistory)
      .values(enrollmentRecords)
      .returning();

    return NextResponse.json(newEnrollments, { status: 201 });
  } catch (error) {
    console.error("[STUDENT_BULK_ENROLLMENT]", error);
    throw error;
  }
}

// PUT: Update a student class history record
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
    const { 
      id, 
      endDate, 
      status, 
      performanceSummary, 
      comments 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }

    // Check if the record exists and belongs to this school
    const existingRecord = await db.query.studentClassHistory.findFirst({
      where: (history, { and, eq }) => 
        and(eq(history.id, id), eq(history.schoolId, schoolId)),
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Record not found or doesn't belong to this school" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (performanceSummary !== undefined) {
      updateData.performanceSummary = performanceSummary;
    }
    
    if (comments !== undefined) {
      updateData.comments = comments;
    }

    // Update the record
    const updatedRecord = await db.update(studentClassHistory)
      .set(updateData)
      .where(and(eq(studentClassHistory.id, id), eq(studentClassHistory.schoolId, schoolId)))
      .returning();

    return NextResponse.json(updatedRecord[0]);
  } catch (error) {
    console.error("[STUDENT_CLASS_HISTORY_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete a student class history record
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
    const recordId = searchParams.get("id");

    if (!recordId) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }

    // Check if the record exists and belongs to this school
    const existingRecord = await db.query.studentClassHistory.findFirst({
      where: (history, { and, eq }) => 
        and(eq(history.id, recordId), eq(history.schoolId, schoolId)),
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Record not found or doesn't belong to this school" },
        { status: 404 }
      );
    }

    // Check if the record has any associated assessment results
    const hasResults = await db.query.assessmentResults.findFirst({
      where: (results, { eq }) => eq(results.studentId, existingRecord.studentId),
    });

    if (hasResults) {
      return NextResponse.json(
        { error: "Cannot delete a record with associated assessment results" },
        { status: 400 }
      );
    }

    // Delete the record
    await db.delete(studentClassHistory)
      .where(and(eq(studentClassHistory.id, recordId), eq(studentClassHistory.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[STUDENT_CLASS_HISTORY_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 