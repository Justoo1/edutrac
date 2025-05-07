// app/api/exams/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { 
  exams, classes, subjects, students, examScores, academicYears, 
  academicTerms, classEnrollments
} from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const academicYearId = url.searchParams.get("academicYearId");
    const termId = url.searchParams.get("termId");
    const staffId = url.searchParams.get("staffId");

    if (!classId || !subjectId || !academicYearId || !termId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get class, subject, academic year, and term data
    const [classData, subjectData, academicYearData, termData] = await Promise.all([
      db.query.classes.findFirst({
        where: eq(classes.id, classId),
      }),
      db.query.subjects.findFirst({
        where: eq(subjects.id, subjectId),
      }),
      db.query.academicYears.findFirst({
        where: eq(academicYears.id, academicYearId),
      }),
      db.query.academicTerms.findFirst({
        where: eq(academicTerms.id, termId),
      }),
    ]);

    if (!classData || !subjectData || !academicYearData || !termData) {
      return NextResponse.json(
        { error: "One or more requested resources not found" },
        { status: 404 }
      );
    }

    // Get all enrolled students in the class
    const enrollments = await db.query.classEnrollments.findMany({
      where: and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.status, "active")
      ),
      with: {
        student: true,
      },
    });

    const classStudents = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      indexNumber: enrollment.student.studentId,
    }));

    // Build query for exams
    let examConditions = and(
      eq(exams.classId, classId),
      eq(exams.subjectId, subjectId),
      eq(exams.academicYear, academicYearId),
      eq(exams.term, termId)
    );

    // Add staff filter if provided
    if (staffId) {
      examConditions = and(examConditions, eq(exams.responsibleStaffId, staffId));
    }

    // Get all matching exams
    const examsList = await db.query.exams.findMany({
      where: examConditions,
      orderBy: (exams, { asc }) => [asc(exams.createdAt)],
    });

    // Get scores for all exams
    const examsWithScores = await Promise.all(
      examsList.map(async (exam) => {
        // Get existing scores for this exam
        const scores = await db.query.examScores.findMany({
          where: eq(examScores.examId, exam.id),
        });

        // Return exam with students and their scores
        return {
          id: exam.id,
          name: exam.name,
          totalMarks: exam.totalMarks,
          date: exam.examDate,
          students: classStudents.map(student => {
            const studentScore = scores.find(score => score.studentId === student.id);
            return {
              ...student,
              score: studentScore?.rawScore || null,
            };
          }),
        };
      })
    );

    // Create the response data
    const responseData = {
      exams: examsWithScores,
      className: classData.name,
      subjectName: subjectData.name,
      periodName: `${academicYearData.name} - ${termData.name}`,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error exporting exam data:", error);
    return NextResponse.json(
      { error: "Failed to export exam data" },
      { status: 500 }
    );
  }
}