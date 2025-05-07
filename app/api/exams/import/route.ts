// app/api/exams/scores/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { examScores, examStudents, students } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { scores } = data;

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { error: "No scores provided" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      scores.map(async (scoreData) => {
        try {
          const { examId, indexNumber, score, remarks } = scoreData;

          // Find the student by index number
          const student = await db.query.students.findFirst({
            where: eq(students.studentId, indexNumber),
          });

          if (!student) {
            return {
              success: false,
              examId,
              indexNumber,
              error: "Student not found",
            };
          }

          // Check if student is enrolled in the exam
          const enrollment = await db.query.examStudents.findFirst({
            where: and(
              eq(examStudents.examId, examId),
              eq(examStudents.studentId, student.id)
            ),
          });

          if (!enrollment) {
            return {
              success: false,
              examId,
              indexNumber,
              error: "Student is not enrolled in this exam",
            };
          }

          // Update student attendance status if needed
          if (enrollment.status !== "present") {
            await db
              .update(examStudents)
              .set({ status: "present" })
              .where(eq(examStudents.id, enrollment.id));
          }

          // Check if a score already exists
          const existingScore = await db.query.examScores.findFirst({
            where: and(
              eq(examScores.examId, examId),
              eq(examScores.studentId, student.id)
            ),
          });

          if (existingScore) {
            // Update existing score
            await db
              .update(examScores)
              .set({
                rawScore: score,
                remarks: remarks || null,
                gradedBy: session.user.id,
                gradedAt: new Date(),
              })
              .where(eq(examScores.id, existingScore.id));
          } else {
            // Create new score
            await db.insert(examScores).values({
              examId,
              studentId: student.id,
              rawScore: score,
              remarks: remarks || null,
              gradedBy: session.user.id,
              gradedAt: new Date(),
            });
          }

          return {
            success: true,
            examId,
            indexNumber,
          };
        } catch (error) {
          console.error("Error processing score:", error);
          return {
            success: false,
            examId: scoreData.examId,
            indexNumber: scoreData.indexNumber,
            error: "Failed to process score",
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${successCount} scores. Failed to process ${failureCount} scores.`,
      results,
    });
  } catch (error) {
    console.error("Error importing exam scores:", error);
    return NextResponse.json(
      { error: "Failed to import exam scores" },
      { status: 500 }
    );
  }
}