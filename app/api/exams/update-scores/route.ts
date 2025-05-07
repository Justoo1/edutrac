// pages/api/exams/batch-update-scores.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { examScores, examStudents, exams, gradeSystem } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';

export async function POST(req: Request) {
  // Check if method is POST
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed'} ,{ status: 405 });
  }

  try {
    // Get user session
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, {status:401});
    }

    // Get exam scores from request body
    const body = await req.json()
    const { examScores: batchExamScores } = body;

    if (!Array.isArray(batchExamScores) || batchExamScores.length === 0) {
      return NextResponse.json({ message: 'Invalid exam scores data' }, {status:400});
    }

    let totalUpdatedCount = 0;
    let examCount = 0;

    // Process each exam's scores
    for (const examData of batchExamScores) {
      const { examId, scores } = examData;

      if (!examId || !scores || !Array.isArray(scores) || scores.length === 0) {
        continue;
      }

      examCount++;

      // Fetch the exam to get details like totalMarks
      const examInfo = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        with: {
          school: true
        }
      });

      if (!examInfo) {
        continue; // Skip if exam doesn't exist
      }

      // Fetch the grade system for this school
      const grades = await db.query.gradeSystem.findMany({
        where: eq(gradeSystem.schoolId, examInfo.schoolId)
      });

      // Process scores for this exam
      for (const score of scores) {
        const { studentId, rawScore, remarks } = score;

        if (!studentId || rawScore === undefined || isNaN(Number(rawScore))) {
          continue;
        }

        // Calculate scaled score if needed (as a percentage)
        const scaledScore = examInfo.totalMarks > 0 
          ? (Number(rawScore) / examInfo.totalMarks) * 100 
          : Number(rawScore);

        // Determine grade
        let gradeId = null;
        if (grades.length > 0) {
          const grade = grades.find(g => 
            scaledScore >= g.minScore && scaledScore <= g.maxScore
          );
          if (grade) {
            gradeId = grade.id;
          }
        }

        // Check if student is enrolled in the exam
        let studentEnrolled = await db.query.examStudents.findFirst({
          where: and(
            eq(examStudents.examId, examId),
            eq(examStudents.studentId, studentId)
          )
        });

        // If not enrolled, create enrollment
        if (!studentEnrolled) {
          await db.insert(examStudents).values({
            id: createId(),
            examId,
            studentId,
            status: 'present',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        // Check if score already exists
        const existingScore = await db.query.examScores.findFirst({
          where: and(
            eq(examScores.examId, examId),
            eq(examScores.studentId, studentId)
          )
        });

        if (existingScore) {
          // Update existing score
          await db
            .update(examScores)
            .set({
              rawScore: rawScore,
              scaledScore: JSON.stringify(scaledScore),
              gradeId,
              remarks: remarks || null,
              updatedAt: new Date(),
              gradedBy: session.user.id,
              gradedAt: new Date()
            })
            .where(
              and(
                eq(examScores.examId, examId),
                eq(examScores.studentId, studentId)
              )
            );
        } else {
          // Insert new score
          await db.insert(examScores).values({
            id: createId(),
            examId,
            studentId,
            rawScore: Number(rawScore),
            scaledScore,
            gradeId,
            remarks: remarks || null,
            gradedBy: session.user.id,
            gradedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          } as any);
        }

        totalUpdatedCount++;
      }

      // Update the exam status to "graded" if not already
      if (examInfo.status !== 'completed' && examInfo.status !== 'published') {
        await db
          .update(exams)
          .set({
            status: 'completed',
            updatedAt: new Date()
          })
          .where(eq(exams.id, examId));
      }
    }

    return NextResponse.json({
      message: 'Exam scores updated successfully',
      updatedCount: totalUpdatedCount,
      examCount: examCount
    },{status:200});
  } catch (error) {
    console.error('Error updating exam scores:', error);
    return NextResponse.json({ 
      message: 'An error occurred while updating exam scores',
      error: error instanceof Error ? error.message : 'Unknown error' 
    },{status:500});
  }
}