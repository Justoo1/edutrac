// app/api/exams/update-scores/route.ts (Updated for Exams Schema)
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { 
  exams,
  examScores,
  examStudents,
  gradeSystem,
  examConfigurations,
  termReports,
  termReportDetails
} from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { 
  updateExamScoresWithConversion,
  generateTermReports 
} from '@/lib/services/examScoreCalculator';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    console.log('Received exam scores update request:', JSON.stringify(body, null, 2));

    // Handle both single exam and batch exam formats
    let examScoresData;
    if (body.examScores && Array.isArray(body.examScores)) {
      // Batch format: { examScores: [{ examId, scores: [...] }] }
      examScoresData = body.examScores;
    } else if (body.examId && body.scores) {
      // Single exam format: { examId, scores: [...] }
      examScoresData = [{ examId: body.examId, scores: body.scores }];
    } else {
      return NextResponse.json({ 
        message: 'Invalid request format. Expected examId and scores, or examScores array.' 
      }, { status: 400 });
    }

    let totalUpdatedCount = 0;
    let totalFailedCount = 0;
    const processedExams = [];
    const errors = [];

    // Process each exam's scores
    for (const examData of examScoresData) {
      const { examId, scores } = examData;

      if (!examId || !scores || !Array.isArray(scores)) {
        errors.push(`Invalid exam data for examId: ${examId}`);
        continue;
      }

      try {
        console.log(`Processing scores for exam ${examId}: ${scores.length} students`);

        // Get exam information
        const examInfo = await db.query.exams.findFirst({
          where: eq(exams.id, examId),
          with: {
            school: true,
            class: true,
            subject: true
          }
        });

        if (!examInfo) {
          errors.push(`Exam ${examId} not found`);
          continue;
        }

        console.log(`Found exam: ${examInfo.name} for ${examInfo.subject.name} in ${examInfo.class.name}`);

        // Get grading system for this school
        const grades = await db.query.gradeSystem.findMany({
          where: eq(gradeSystem.schoolId, examInfo.schoolId)
        });

        // Get exam configuration
        const examConfig = await db.query.examConfigurations.findFirst({
          where: eq(examConfigurations.school_id, examInfo.schoolId)
        });

        const caPercent = examConfig?.class_score_weight || 30;
        const examPercent = examConfig?.exam_score_weight || 70;

        console.log(`Using exam config: CA=${caPercent}%, Exam=${examPercent}%`);

        let examUpdatedCount = 0;
        let examFailedCount = 0;

        // Process each student's score
        for (const scoreData of scores) {
          const { studentId, rawScore, remarks } = scoreData;

          if (!studentId || rawScore === undefined || isNaN(Number(rawScore))) {
            console.warn(`Invalid score data for student ${studentId}: score=${rawScore}`);
            examFailedCount++;
            continue;
          }

          try {
            // Use the improved score calculation function
            const result = await updateExamScoresWithConversion(
              examId,
              studentId,
              Number(rawScore),
              session.user.id,
              remarks
            );

            console.log(`Updated score for student ${studentId}: ${result.rawScore} → ${result.scaledScore} (${result.grade})`);
            examUpdatedCount++;

          } catch (error) {
            console.error(`Error updating score for student ${studentId}:`, error);
            errors.push(`Failed to update score for student ${studentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            examFailedCount++;
          }
        }

        // Update exam status
        if (examUpdatedCount > 0) {
          await db.update(exams)
            .set({
              status: 'completed',
              updatedAt: new Date()
            })
            .where(eq(exams.id, examId));

          console.log(`Updated exam ${examId} status to completed`);
        }

        processedExams.push({
          examId,
          examTitle: examInfo.name,
          subjectName: examInfo.subject.name,
          className: examInfo.class.name,
          updatedCount: examUpdatedCount,
          failedCount: examFailedCount
        });

        totalUpdatedCount += examUpdatedCount;
        totalFailedCount += examFailedCount;

        // After updating exam scores, regenerate term reports for this class
        try {
          console.log(`Regenerating term reports for class ${examInfo.classId}`);
          
          await generateTermReports(
            examInfo.schoolId,
            examInfo.classId,
            examInfo.academicYear,
            examInfo.term
          );

          console.log(`Successfully regenerated term reports for class ${examInfo.classId}`);
        } catch (reportError) {
          console.error(`Error regenerating term reports for class ${examInfo.classId}:`, reportError);
          errors.push(`Failed to regenerate term reports for class ${examInfo.classId}: ${reportError instanceof Error ? reportError.message : 'Unknown error'}`);
        }

      } catch (error) {
        console.error(`Error processing exam ${examId}:`, error);
        errors.push(`Failed to process exam ${examId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Return comprehensive response
    const response = {
      success: totalUpdatedCount > 0,
      message: `Successfully updated ${totalUpdatedCount} exam scores. ${totalFailedCount} failed.`,
      summary: {
        totalUpdated: totalUpdatedCount,
        totalFailed: totalFailedCount,
        examsProcessed: processedExams.length
      },
      processedExams,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Exam scores update completed:', response);

    return NextResponse.json(response, { 
      status: totalUpdatedCount > 0 ? 200 : 400 
    });

  } catch (error) {
    console.error('Error in exam scores update API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error while updating exam scores',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}