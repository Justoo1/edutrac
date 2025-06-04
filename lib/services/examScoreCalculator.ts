// lib/services/examScoreCalculator.ts (Updated for Exams Schema)
import db from '@/lib/db';
import { 
  exams,
  examScores,
  examTypes,
  termReports,
  termReportDetails,
  gradeSystem,
  examConfigurations,
  subjects,
  classEnrollments
} from '@/lib/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

/**
 * Calculate and update exam scores with proper conversion using the exams schema
 */
export async function calculateExamScores(
  studentId: string,
  subjectId: string,
  classId: string,
  academicYearId: string,
  academicTermId: string,
  schoolId: string
) {
  try {
    console.log(`Calculating exam scores for student ${studentId}, subject ${subjectId}`);

    // Get exam configuration for the school (CA/Exam percentage split)
    const examConfig = await db.query.examConfigurations.findFirst({
      where: eq(examConfigurations.school_id, schoolId)
    });

    const caPercent = examConfig?.class_score_weight || 30;
    const examPercent = examConfig?.exam_score_weight || 70;

    console.log(`Using exam config: CA=${caPercent}%, Exam=${examPercent}%`);

    // Get all exams for this subject, class, and academic period
    const subjectExams = await db.query.exams.findMany({
      where: and(
        eq(exams.subjectId, subjectId),
        eq(exams.classId, classId),
        eq(exams.academicYear, academicYearId),
        eq(exams.term, academicTermId),
        eq(exams.schoolId, schoolId)
      )
    });

    console.log(`Found ${subjectExams.length} exams for subject`);

    if (subjectExams.length === 0) {
      console.warn(`No exams found for subject ${subjectId}`);
      return {
        classScore: 0,
        examScore: 0,
        totalScore: 0,
        convertedClassScore: 0,
        convertedExamScore: 0
      };
    }

    // Get exam types to properly categorize exams
    const examTypesList = await db.query.examTypes.findMany({
      where: eq(examTypes.schoolId, schoolId)
    });

    // Find the End of Term exam type
    const endOfTermType = examTypesList.find(type => 
      type.isSystem && 
      (type.name.toLowerCase().includes("end of term") || 
       type.name.toLowerCase().includes("final") || 
       type.name.toLowerCase().includes("terminal"))
    );

    // Separate exams into CA and End of Term
    let caExams = [];
    let endTermExams = [];

    if (endOfTermType) {
      caExams = subjectExams.filter(exam => exam.examType !== endOfTermType.id);
      endTermExams = subjectExams.filter(exam => exam.examType === endOfTermType.id);
    } else {
      // Fallback: look for exams with "end of term" in the name
      endTermExams = subjectExams.filter(exam => 
        exam.name.toLowerCase().includes("end of term") || 
        exam.name.toLowerCase().includes("final") || 
        exam.name.toLowerCase().includes("terminal")
      );
      
      // Everything else is CA
      const endTermIds = endTermExams.map(e => e.id);
      caExams = subjectExams.filter(e => !endTermIds.includes(e.id));
    }

    console.log(`CA Exams: ${caExams.length}, End Term Exams: ${endTermExams.length}`);

    // Calculate CA scores
    let totalCaScore = 0;
    let totalCaMarks = 0;

    if (caExams.length > 0) {
      for (const exam of caExams) {
        const score = await db.query.examScores.findFirst({
          where: and(
            eq(examScores.examId, exam.id),
            eq(examScores.studentId, studentId)
          )
        });

        if (score) {
          console.log(`CA Score: ${score.rawScore}/${exam.totalMarks} for exam ${exam.name}`);
          totalCaScore += Number(score.rawScore);
          totalCaMarks += exam.totalMarks;
        } else {
          console.log(`No score found for CA exam ${exam.name}`);
          // Still count the total marks even if student didn't take the exam
          totalCaMarks += exam.totalMarks;
        }
      }
    }

    // Calculate End of Term scores
    let totalExamScore = 0;
    let totalExamMarks = 0;

    if (endTermExams.length > 0) {
      for (const exam of endTermExams) {
        const score = await db.query.examScores.findFirst({
          where: and(
            eq(examScores.examId, exam.id),
            eq(examScores.studentId, studentId)
          )
        });

        if (score) {
          console.log(`Exam Score: ${score.rawScore}/${exam.totalMarks} for exam ${exam.name}`);
          totalExamScore += Number(score.rawScore);
          totalExamMarks += exam.totalMarks;
        } else {
          console.log(`No score found for end term exam ${exam.name}`);
          // Still count the total marks even if student didn't take the exam
          totalExamMarks += exam.totalMarks;
        }
      }
    }

    // Convert scores to percentages, then to configured weights
    const caPercentage = totalCaMarks > 0 ? (totalCaScore / totalCaMarks) * 100 : 0;
    const examPercentage = totalExamMarks > 0 ? (totalExamScore / totalExamMarks) * 100 : 0;

    // Apply weight percentages
    const convertedClassScore = (caPercentage * caPercent) / 100;
    const convertedExamScore = (examPercentage * examPercent) / 100;
    const totalScore = convertedClassScore + convertedExamScore;

    console.log(`Score calculation results:`);
    console.log(`- CA: ${totalCaScore}/${totalCaMarks} = ${caPercentage.toFixed(2)}% → ${convertedClassScore.toFixed(2)}`);
    console.log(`- Exam: ${totalExamScore}/${totalExamMarks} = ${examPercentage.toFixed(2)}% → ${convertedExamScore.toFixed(2)}`);
    console.log(`- Total: ${totalScore.toFixed(2)}`);

    return {
      classScore: totalCaScore,
      examScore: totalExamScore,
      totalScore: parseFloat(totalScore.toFixed(2)),
      convertedClassScore: parseFloat(convertedClassScore.toFixed(2)),
      convertedExamScore: parseFloat(convertedExamScore.toFixed(2)),
      caPercentage: parseFloat(caPercentage.toFixed(2)),
      examPercentage: parseFloat(examPercentage.toFixed(2))
    };

  } catch (error) {
    console.error('Error calculating exam scores:', error);
    throw error;
  }
}

/**
 * Update exam scores with proper converted scores
 */
export async function updateExamScoresWithConversion(
  examId: string,
  studentId: string,
  rawScore: number,
  gradedBy: string,
  remarks?: string
) {
  try {
    console.log(`Updating exam score: Exam ${examId}, Student ${studentId}, Score ${rawScore}`);

    // Get the exam details
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId)
    });

    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }

    // Get exam configuration
    const examConfig = await db.query.examConfigurations.findFirst({
      where: eq(examConfigurations.school_id, exam.schoolId)
    });

    const caPercent = examConfig?.class_score_weight || 30;
    const examPercent = examConfig?.exam_score_weight || 70;

    // Calculate percentage score
    const percentageScore = exam.totalMarks > 0 ? (rawScore / exam.totalMarks) * 100 : 0;

    // Determine if this is a CA or final exam
    const examTypesList = await db.query.examTypes.findMany({
      where: eq(examTypes.schoolId, exam.schoolId)
    });

    const endOfTermType = examTypesList.find(type => 
      type.isSystem && 
      (type.name.toLowerCase().includes("end of term") || 
       type.name.toLowerCase().includes("final") || 
       type.name.toLowerCase().includes("terminal"))
    );

    // Determine the scaled score based on exam type
    let scaledScore = 0;
    
    if (endOfTermType && exam.examType === endOfTermType.id) {
      // This is a final exam
      scaledScore = (percentageScore * examPercent) / 100;
    } else if (exam.name.toLowerCase().includes("end of term") || 
               exam.name.toLowerCase().includes("final")) {
      // Fallback: check exam name
      scaledScore = (percentageScore * examPercent) / 100;
    } else {
      // This is a CA exam
      scaledScore = (percentageScore * caPercent) / 100;
    }

    // Get grade information
    const grades = await db.query.gradeSystem.findMany({
      where: eq(gradeSystem.schoolId, exam.schoolId)
    });

    const grade = getGradeInfoWithValidation(percentageScore, grades, `Exam ${examId} - Student ${studentId}`);

    // Check if score already exists
    const existingScore = await db.query.examScores.findFirst({
      where: and(
        eq(examScores.examId, examId),
        eq(examScores.studentId, studentId)
      )
    });

    if (existingScore) {
      // Update existing score
      await db.update(examScores)
        .set({
          rawScore: rawScore.toString(),
          scaledScore: scaledScore.toString(),
          gradeId: grade.gradeId,
          remarks: remarks || null,
          gradedBy: gradedBy,
          gradedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(examScores.id, existingScore.id));

      console.log(`Updated exam score: Raw=${rawScore}, Scaled=${scaledScore.toFixed(2)}, Grade=${grade.grade}`);
    } else {
      // Create new score
      await db.insert(examScores).values({
        id: createId(),
        examId,
        studentId,
        rawScore: rawScore.toString(),
        scaledScore: scaledScore.toString(),
        gradeId: grade.gradeId,
        remarks: remarks || null,
        gradedBy: gradedBy,
        gradedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`Created exam score: Raw=${rawScore}, Scaled=${scaledScore.toFixed(2)}, Grade=${grade.grade}`);
    }

    return {
      success: true,
      rawScore,
      scaledScore: parseFloat(scaledScore.toFixed(2)),
      percentageScore: parseFloat(percentageScore.toFixed(2)),
      grade: grade.grade,
      remark: grade.remark
    };

  } catch (error) {
    console.error('Error updating exam score:', error);
    throw error;
  }
}

/**
 * Generate or update term reports for all students in a class
 */
export async function generateTermReports(
  schoolId: string,
  classId: string,
  academicYearId: string,
  academicTermId: string
) {
  try {
    console.log(`Generating term reports for class ${classId}`);

    // Get all active students in the class
    const enrollments = await db.query.classEnrollments.findMany({
      where: and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.status, "active")
      ),
      with: {
        student: true
      }
    });

    if (enrollments.length === 0) {
      throw new Error('No active students found in this class');
    }

    // Get all subjects for the school
    const schoolSubjects = await db.query.subjects.findMany({
      where: eq(subjects.schoolId, schoolId)
    });

    if (schoolSubjects.length === 0) {
      throw new Error('No subjects found for this school');
    }

    // Get grading system
    const grades = await db.query.gradeSystem.findMany({
      where: eq(gradeSystem.schoolId, schoolId)
    });

    const updatedReports = [];

    // Process each student
    for (const enrollment of enrollments) {
      const student = enrollment.student;
      
      console.log(`Processing student: ${student.firstName} ${student.lastName}`);

      // Check if term report exists
      let termReport = await db.query.termReports.findFirst({
        where: and(
          eq(termReports.studentId, student.id),
          eq(termReports.academicYearId, academicYearId),
          eq(termReports.academicTermId, academicTermId)
        )
      });

      // Create term report if it doesn't exist
      if (!termReport) {
        const termReportId = createId();
        
        await db.insert(termReports).values({
          id: termReportId,
          studentId: student.id,
          academicYearId,
          academicTermId,
          totalMarks: 0,
          averageScore: 0,
          rank: 'N/A',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        termReport = await db.query.termReports.findFirst({
          where: eq(termReports.id, termReportId)
        });

        if (!termReport) {
          console.error(`Failed to create term report for student ${student.id}`);
          continue;
        }
      }

      // Process each subject
      let totalScore = 0;
      let subjectsProcessed = 0;

      for (const subject of schoolSubjects) {
        console.log(`Processing subject: ${subject.name} for student ${student.id}`);

        // Calculate exam scores for this subject
        const scoreData = await calculateExamScores(
          student.id,
          subject.id,
          classId,
          academicYearId,
          academicTermId,
          schoolId
        );

        // Get grade for total score
        const gradeInfo = getGradeInfoWithValidation(scoreData.totalScore, grades, `${student.firstName} ${student.lastName} - ${subject.name}`);

        // Check if term report detail exists
        let existingDetail = await db.query.termReportDetails.findFirst({
          where: and(
            eq(termReportDetails.termReportId, termReport.id),
            eq(termReportDetails.subjectId, subject.id)
          )
        });

        if (existingDetail) {
          // Update existing detail
          await db.update(termReportDetails)
            .set({
              classScore: scoreData.convertedClassScore.toString(),
              examScore: scoreData.convertedExamScore.toString(),
              totalScore: scoreData.totalScore.toString(),
              gradeId: gradeInfo.gradeId,
              updatedAt: new Date()
            })
            .where(eq(termReportDetails.id, existingDetail.id));
        } else {
          // Create new detail
          await db.insert(termReportDetails).values({
            id: createId(),
            termReportId: termReport.id,
            subjectId: subject.id,
            classScore: scoreData.convertedClassScore.toString(),
            examScore: scoreData.convertedExamScore.toString(),
            totalScore: scoreData.totalScore.toString(),
            gradeId: gradeInfo.gradeId,
            classPosition: 0, // Will be calculated later
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        if (scoreData.totalScore > 0) {
          totalScore += scoreData.totalScore;
          subjectsProcessed++;
        }

        console.log(`Subject ${subject.name}: Class=${scoreData.convertedClassScore}, Exam=${scoreData.convertedExamScore}, Total=${scoreData.totalScore}`);
      }

      // Update term report totals
      const averageScore = subjectsProcessed > 0 ? totalScore / subjectsProcessed : 0;

      await db.update(termReports)
        .set({
          totalMarks: totalScore,
          averageScore: parseFloat(averageScore.toFixed(2)),
          updatedAt: new Date()
        })
        .where(eq(termReports.id, termReport.id));

      updatedReports.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        totalScore,
        averageScore: parseFloat(averageScore.toFixed(2)),
        subjectsProcessed
      });

      console.log(`Updated term report for ${student.firstName} ${student.lastName}: Total=${totalScore}, Average=${averageScore.toFixed(2)}`);
    }

    // Calculate rankings
    await calculateClassRankings(classId, academicYearId, academicTermId);
    await calculateSubjectRankings(schoolId, classId, academicYearId, academicTermId);

    return {
      success: true,
      message: `Generated term reports for ${updatedReports.length} students`,
      reports: updatedReports
    };

  } catch (error) {
    console.error('Error generating term reports:', error);
    throw error;
  }
}

/**
 * Calculate class rankings based on average scores
 */
async function calculateClassRankings(
  classId: string,
  academicYearId: string,
  academicTermId: string
) {
  try {
    console.log('Calculating class rankings...');

    // Get all term reports for this class
    const reports = await db.query.termReports.findMany({
      where: and(
        eq(termReports.academicYearId, academicYearId),
        eq(termReports.academicTermId, academicTermId),
        sql`"student_id" IN (
          SELECT "student_id" FROM "classEnrollments" 
          WHERE "classId" = ${classId} AND status = 'active'
        )`
      )
    });

    // Sort by average score (descending)
    reports.sort((a, b) => {
      const scoreA = typeof a.averageScore === 'string' ? parseFloat(a.averageScore) : Number(a.averageScore);
      const scoreB = typeof b.averageScore === 'string' ? parseFloat(b.averageScore) : Number(b.averageScore);
      return scoreB - scoreA;
    });

    // Update rankings
    for (let i = 0; i < reports.length; i++) {
      const rank = i + 1;
      const rankStr = getOrdinalRank(rank);

      await db.update(termReports)
        .set({ rank: rankStr })
        .where(eq(termReports.id, reports[i].id));
    }

    console.log(`Updated rankings for ${reports.length} students`);
  } catch (error) {
    console.error('Error calculating class rankings:', error);
    throw error;
  }
}

/**
 * Calculate subject rankings for all subjects
 */
async function calculateSubjectRankings(
  schoolId: string,
  classId: string,
  academicYearId: string,
  academicTermId: string
) {
  try {
    console.log('Calculating subject rankings...');

    // Get all subjects
    const _subjects = await db.query.subjects.findMany({
      where: eq(subjects.schoolId, schoolId)
    });

    for (const subject of _subjects) {
      // Get all term report details for this subject
      const details = await db.query.termReportDetails.findMany({
        where: and(
          eq(termReportDetails.subjectId, subject.id),
          sql`"term_report_id" IN (
            SELECT id FROM term_reports 
            WHERE "academic_year_id" = ${academicYearId} 
            AND "academic_term_id" = ${academicTermId}
            AND "student_id" IN (
              SELECT "student_id" FROM "classEnrollments" 
              WHERE "classId" = ${classId} AND status = 'active'
            )
          )`
        )
      });

      // Sort by total score (descending)
      details.sort((a, b) => {
        const scoreA = typeof a.totalScore === 'string' ? parseFloat(a.totalScore) : Number(a.totalScore);
        const scoreB = typeof b.totalScore === 'string' ? parseFloat(b.totalScore) : Number(b.totalScore);
        return scoreB - scoreA;
      });

      // Update positions
      for (let i = 0; i < details.length; i++) {
        const position = i + 1;

        await db.update(termReportDetails)
          .set({ classPosition: position })
          .where(eq(termReportDetails.id, details[i].id));
      }
    }

    console.log(`Updated subject rankings for ${_subjects.length} subjects`);
  } catch (error) {
    console.error('Error calculating subject rankings:', error);
    throw error;
  }
}

/**
 * Helper function to get grade info with improved decimal and boundary handling
 */
function getGradeInfo(score: number, grades: any[]) {
  // Handle edge cases
  if (!grades || grades.length === 0) {
    console.warn('No grades available for scoring');
    return {
      gradeId: null,
      grade: 'NG',
      remark: 'No Grades Available'
    };
  }
  
  // Round score to 1 decimal place to avoid floating point precision issues
  const roundedScore = Math.round(score * 10) / 10;
  
  console.log(`Finding grade for score: ${roundedScore}`);
  console.log('Available grades:', grades.map(g => `${g.gradeName}: ${g.minScore}-${g.maxScore}`));
  
  // Sort grades by minScore ascending to check from lowest to highest
  const sortedGrades = [...grades].sort((a, b) => {
    const aMin = Number(a.minScore) || 0;
    const bMin = Number(b.minScore) || 0;
    return aMin - bMin;
  });
  
  // Find the appropriate grade range
  let matchedGrade = null;
  
  for (const g of sortedGrades) {
    const minScore = Number(g.minScore) || 0;
    const maxScore = Number(g.maxScore) || 100;
    
    console.log(`Checking grade ${g.gradeName}: ${minScore}-${maxScore}, score: ${roundedScore}`);
    
    // Use inclusive bounds with small tolerance for floating point errors
    const tolerance = 0.01; // Allow for small rounding differences
    const isInRange = (roundedScore >= (minScore - tolerance)) && (roundedScore <= (maxScore + tolerance));
    
    console.log(`  → Range check: ${roundedScore} >= ${minScore - tolerance} && ${roundedScore} <= ${maxScore + tolerance} = ${isInRange}`);
    
    if (isInRange) {
      matchedGrade = g;
      console.log(`  → MATCH! Using grade: ${g.gradeName}`);
      break; // Use first match
    }
  }
  
  // If exact match found, return it
  if (matchedGrade) {
    return {
      gradeId: matchedGrade.id,
      grade: matchedGrade.gradeName,
      remark: matchedGrade.interpretation || matchedGrade.gradeName
    };
  }
  
  console.warn(`No exact grade found for score ${roundedScore}. Attempting fallback matching...`);
  
  // Enhanced fallback: find closest grade by calculating distance to ranges
  let closestGrade = null;
  let smallestDistance = Infinity;
  
  for (const g of sortedGrades) {
    const minScore = Number(g.minScore) || 0;
    const maxScore = Number(g.maxScore) || 100;
    
    let distance;
    if (roundedScore < minScore) {
      distance = minScore - roundedScore;
    } else if (roundedScore > maxScore) {
      distance = roundedScore - maxScore;
    } else {
      // Score is within range but wasn't matched above (shouldn't happen)
      distance = 0;
    }
    
    console.log(`Distance to grade ${g.gradeName} (${minScore}-${maxScore}): ${distance}`);
    
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestGrade = g;
    }
  }
  
  if (closestGrade) {
    console.log(`Using closest grade: ${closestGrade.gradeName} (distance: ${smallestDistance})`);
    return {
      gradeId: closestGrade.id,
      grade: closestGrade.gradeName,
      remark: closestGrade.interpretation || closestGrade.gradeName
    };
  }
  
  // Ultimate fallback - should rarely happen
  console.error(`Could not determine grade for score ${roundedScore}`);
  return {
    gradeId: null,
    grade: 'NG',
    remark: 'Grade Not Determined'
  };
}

/**
 * Validate grade ranges and log any issues
 */
function validateGradeRanges(grades: any[]) {
  if (!grades || grades.length === 0) {
    console.warn('No grades to validate');
    return false;
  }
  
  console.log('Validating grade ranges:');
  
  const sortedGrades = [...grades].sort((a, b) => {
    const aMin = Number(a.minScore) || 0;
    const bMin = Number(b.minScore) || 0;
    return aMin - bMin;
  });
  
  let hasIssues = false;
  
  for (let i = 0; i < sortedGrades.length; i++) {
    const grade = sortedGrades[i];
    const minScore = Number(grade.minScore) || 0;
    const maxScore = Number(grade.maxScore) || 100;
    
    // Check if min > max
    if (minScore > maxScore) {
      console.error(`Grade ${grade.gradeName}: Invalid range ${minScore}-${maxScore} (min > max)`);
      hasIssues = true;
    }
    
    // Check for gaps with next grade
    if (i < sortedGrades.length - 1) {
      const nextGrade = sortedGrades[i + 1];
      const nextMinScore = Number(nextGrade.minScore) || 0;
      
      if (maxScore + 1 < nextMinScore) {
        console.warn(`Gap between ${grade.gradeName} (${minScore}-${maxScore}) and ${nextGrade.gradeName} (${nextMinScore}-${Number(nextGrade.maxScore)})`);
      }
      
      if (maxScore >= nextMinScore) {
        console.warn(`Overlap between ${grade.gradeName} (${minScore}-${maxScore}) and ${nextGrade.gradeName} (${nextMinScore}-${Number(nextGrade.maxScore)})`);
      }
    }
    
    console.log(`Grade ${grade.gradeName}: ${minScore}-${maxScore} ✓`);
  }
  
  return !hasIssues;
}

/**
 * Enhanced grade info function with validation
 */
function getGradeInfoWithValidation(score: number, grades: any[], context: string = '') {
  const result = getGradeInfo(score, grades);
  
  if (context) {
    console.log(`Grade calculation for ${context}: Score=${score} → Grade=${result.grade} (${result.remark})`);
  }
  
  return result;
}

/**
 * Export the enhanced grading function for external use
 */
export { getGradeInfoWithValidation, validateGradeRanges };

/**
 * Helper function to get ordinal rank
 */
function getOrdinalRank(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}