import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { schools, studentClassHistory, students, classes, academicYears } from "@/lib/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// POST: Process student promotions from one academic year to another
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
      fromAcademicYearId,
      toAcademicYearId,
      promotions,
      promotionDate
    } = body;

    // Validate required fields
    if (!fromAcademicYearId || !toAcademicYearId || !promotions || !Array.isArray(promotions)) {
      return NextResponse.json(
        { error: "Missing required fields or invalid format" },
        { status: 400 }
      );
    }

    // Check if the academic years exist and belong to this school
    const academicYears = await db.query.academicYears.findMany({
      where: (years, { and, eq, inArray }) => 
        and(
          eq(years.schoolId, schoolId),
          inArray(years.id, [fromAcademicYearId, toAcademicYearId])
        ),
    });

    if (academicYears.length !== 2) {
      return NextResponse.json(
        { error: "One or both academic years not found or don't belong to this school" },
        { status: 404 }
      );
    }

    const fromYear = academicYears.find(year => year.id === fromAcademicYearId);
    const toYear = academicYears.find(year => year.id === toAcademicYearId);

    // Ensure fromYear is before toYear
    if (fromYear && toYear && fromYear.startDate >= toYear.startDate) {
      return NextResponse.json(
        { error: "The 'from' academic year must be before the 'to' academic year" },
        { status: 400 }
      );
    }

    // Validate promotion data format
    for (const promotion of promotions) {
      if (!promotion.studentId || !promotion.toClassId) {
        return NextResponse.json(
          { error: "Each promotion must include studentId and toClassId" },
          { status: 400 }
        );
      }
    }

    // Extract lists of students and classes to validate
    const studentIds = promotions.map(p => p.studentId);
    const classIds = promotions.map(p => p.toClassId);

    // Verify all students belong to the school
    const studentsData = await db.query.students.findMany({
      where: (students, { and, eq, inArray }) => 
        and(
          eq(students.schoolId, schoolId),
          inArray(students.id, studentIds)
        ),
    });

    if (studentsData.length !== studentIds.length) {
      return NextResponse.json(
        { error: "Some students not found or don't belong to this school" },
        { status: 404 }
      );
    }

    // Verify all destination classes belong to the school
    const classesData = await db.query.classes.findMany({
      where: (classes, { and, eq, inArray }) => 
        and(
          eq(classes.schoolId, schoolId),
          inArray(classes.id, classIds)
        ),
    });

    if (classesData.length !== [...new Set(classIds)].length) {
      return NextResponse.json(
        { error: "Some classes not found or don't belong to this school" },
        { status: 404 }
      );
    }

    // Verify all students are currently enrolled in the fromAcademicYear
    const currentEnrollments = await db.query.studentClassHistory.findMany({
      where: (history, { and, inArray, eq, isNull }) => 
        and(
          eq(history.schoolId, schoolId),
          inArray(history.studentId, studentIds),
          eq(history.academicYearId, fromAcademicYearId),
          isNull(history.endDate)
        ),
      with: {
        class: true
      }
    });

    const enrolledStudentIds = currentEnrollments.map(e => e.studentId);
    const notEnrolledStudents = studentIds.filter(id => !enrolledStudentIds.includes(id));

    if (notEnrolledStudents.length > 0) {
      return NextResponse.json(
        { 
          error: "Some students are not currently enrolled in the source academic year",
          notEnrolledStudents
        },
        { status: 400 }
      );
    }

    // Check if any students are already enrolled in the destination academic year
    const existingToYearEnrollments = await db.query.studentClassHistory.findMany({
      where: (history, { and, inArray, eq }) => 
        and(
          eq(history.schoolId, schoolId),
          inArray(history.studentId, studentIds),
          eq(history.academicYearId, toAcademicYearId)
        ),
    });

    if (existingToYearEnrollments.length > 0) {
      const alreadyEnrolledStudentIds = existingToYearEnrollments.map(e => e.studentId);
      return NextResponse.json(
        { 
          error: "Some students are already enrolled in the destination academic year",
          alreadyEnrolledStudentIds
        },
        { status: 400 }
      );
    }

    // Process promotions
    const promotionDate = new Date();
    const results = {
      closedEnrollments: [],
      newEnrollments: []
    };

    // 1. Close current enrollments
    for (const enrollment of currentEnrollments) {
      const closedEnrollment = await db.update(studentClassHistory)
        .set({ 
          endDate: promotionDate,
          status: "completed",
          comments: `Promoted to new academic year: ${toYear?.name}`,
          updatedAt: new Date()
        })
        .where(eq(studentClassHistory.id, enrollment.id))
        .returning();
      
      results.closedEnrollments.push(closedEnrollment[0]);
    }

    // 2. Create new enrollments for the next academic year
    const newEnrollmentRecords = promotions.map(promotion => {
      const currentEnrollment = currentEnrollments.find(e => e.studentId === promotion.studentId);
      
      return {
        id: createId(),
        studentId: promotion.studentId,
        classId: promotion.toClassId,
        academicYearId: toAcademicYearId,
        schoolId,
        enrollmentDate: body.promotionDate ? new Date(body.promotionDate) : new Date(),
        status: "active",
        comments: promotion.comments || `Promoted from ${currentEnrollment?.class.name || 'previous class'}`,
        performanceSummary: promotion.performanceSummary || null,
        recordedBy: session.user.id,
      };
    });

    const newEnrollments = await db.insert(studentClassHistory)
      .values(newEnrollmentRecords)
      .returning();
    
    results.newEnrollments = newEnrollments;

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error("[STUDENT_PROMOTIONS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Get promotion recommendations based on academic performance
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
    const fromAcademicYearId = searchParams.get("fromAcademicYearId");
    const classId = searchParams.get("classId");

    if (!fromAcademicYearId) {
      return NextResponse.json(
        { error: "Source academic year ID is required" },
        { status: 400 }
      );
    }

    // Verify the academic year exists and belongs to this school
    const academicYear = await db.query.academicYears.findFirst({
      where: (years, { and, eq }) => 
        and(eq(years.id, fromAcademicYearId), eq(years.schoolId, schoolId)),
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Academic year not found or doesn't belong to this school" },
        { status: 404 }
      );
    }

    // Find the next academic year if exists
    const nextAcademicYear = await db.query.academicYears.findFirst({
      where: (years, { and, eq, gt }) => 
        and(
          eq(years.schoolId, schoolId),
          gt(years.startDate, academicYear.startDate)
        ),
      orderBy: (years, { asc }) => [asc(years.startDate)]
    });

    // Build query for student enrollments
    let baseQuery: any = {
      where: (history: any, { and, eq, isNull }: any) => {
        const conditions = [
          eq(history.schoolId, schoolId),
          eq(history.academicYearId, fromAcademicYearId),
          isNull(history.endDate)
        ];
        
        if (classId) {
          conditions.push(eq(history.classId, classId));
        }
        
        return and(...conditions);
      },
      with: {
        student: true,
        class: true,
        academicYear: true
      }
    };

    const currentEnrollments = await db.query.studentClassHistory.findMany(baseQuery);

    // Get terminal results for these students to analyze performance
    const studentIds = currentEnrollments.map(e => e.studentId);
    
    // Get term results for the final term of the academic year
    const termResults = await db.query.termResults.findMany({
      where: (results, { and, eq, inArray }) => 
        and(
          eq(results.schoolId, schoolId),
          inArray(results.studentId, studentIds),
          eq(results.academicYearId, fromAcademicYearId)
        ),
      orderBy: (results, { desc }) => [desc(results.createdAt)]
    });

    // Get next level classes
    const currentClassIds = [...new Set(currentEnrollments.map(e => e.classId))];
    const currentClasses = await db.query.classes.findMany({
      where: (classes, { inArray }) => inArray(classes.id, currentClassIds),
    });

    // Get potential next classes
    const allClasses = await db.query.classes.findMany({
      where: (classes, { eq }) => eq(classes.schoolId, schoolId),
      orderBy: (classes, { asc }) => [asc(classes.name)]
    });

    // Generate recommendations for each student
    const promotionRecommendations = currentEnrollments.map(enrollment => {
      // Get student's term results
      const studentResults = termResults.filter(r => r.studentId === enrollment.studentId);
      
      // Calculate average score
      let averageScore = 0;
      if (studentResults.length > 0) {
        const totalScore = studentResults.reduce((sum, result) => sum + result.totalScore, 0);
        averageScore = totalScore / studentResults.length;
      }
      
      // Determine current class level
      const currentClass = currentClasses.find(c => c.id === enrollment.classId);
      
      // Determine next class recommendation
      let recommendedClassId = null;
      let recommendationReason = "";
      
      if (averageScore >= 40) { // Passing score for promotion
        // Find the next level class
        const potentialNextClasses = allClasses.filter(c => 
          c.level === (currentClass?.level ?? 0) + 1
        );
        
        if (potentialNextClasses.length > 0) {
          recommendedClassId = potentialNextClasses[0].id;
          recommendationReason = `Recommended for promotion based on average score of ${averageScore.toFixed(1)}%`;
        } else {
          recommendationReason = "Student has completed the highest level available.";
        }
      } else {
        // Recommend staying in the same class
        recommendedClassId = enrollment.classId;
        recommendationReason = `Recommended to repeat current class due to low average score of ${averageScore.toFixed(1)}%`;
      }
      
      return {
        studentId: enrollment.studentId,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        currentClassId: enrollment.classId,
        currentClassName: currentClass?.name || "Unknown",
        fromAcademicYearId: enrollment.academicYearId,
        fromAcademicYear: enrollment.academicYear.name,
        toAcademicYearId: nextAcademicYear?.id || null,
        toAcademicYear: nextAcademicYear?.name || "Not available",
        recommendedClassId,
        averageScore,
        recommendationReason
      };
    });

    return NextResponse.json({
      recommendations: promotionRecommendations,
      nextAcademicYear,
      possibleClasses: allClasses
    });
  } catch (error) {
    console.error("[STUDENT_PROMOTIONS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 