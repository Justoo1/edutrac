// app/api/debug/exam-system/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { 
  schools,
  students,
  classes,
  classEnrollments,
  subjects,
  exams,
  examScores,
  termReports,
  termReportDetails,
  examTypes,
  gradeSystem,
  examConfigurations
} from '@/lib/schema';
import { eq, and, count, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const classId = searchParams.get('classId');
    const academicYearId = searchParams.get('academicYearId');
    const academicTermId = searchParams.get('academicTermId');

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId is required' }, { status: 400 });
    }

    console.log(`Debugging exam system for school: ${schoolId}`);

    const debug = {
      timestamp: new Date().toISOString(),
      schoolId,
      classId,
      academicYearId,
      academicTermId,
      issues: [] as string[],
      warnings: [] as string[],
      statistics: {} as any,
      recommendations: [] as string[]
    };

    // 1. Check school exists
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId)
    });

    if (!school) {
      debug.issues.push('School not found');
      return NextResponse.json(debug);
    }

    debug.statistics.schoolName = school.name;
    debug.statistics.schoolType = school.schoolType;

    // 2. Check exam types
    const schoolExamTypes = await db.query.examTypes.findMany({
      where: eq(examTypes.schoolId, schoolId)
    });

    debug.statistics.examTypesCount = schoolExamTypes.length;

    if (schoolExamTypes.length === 0) {
      debug.issues.push('No exam types configured');
      debug.recommendations.push('Create exam types: Continuous Assessment, End of Term, etc.');
    }

    const endOfTermType = schoolExamTypes.find(type => 
      type.isSystem && 
      (type.name.toLowerCase().includes("end of term") || 
       type.name.toLowerCase().includes("final"))
    );

    if (!endOfTermType) {
      debug.warnings.push('No "End of Term" exam type found');
      debug.recommendations.push('Create a system exam type for "End of Term" exams');
    }

    // 3. Check grading system
    const schoolGrades = await db.query.gradeSystem.findMany({
      where: eq(gradeSystem.schoolId, schoolId)
    });

    debug.statistics.gradesCount = schoolGrades.length;

    if (schoolGrades.length === 0) {
      debug.issues.push('No grading system configured');
      debug.recommendations.push('Set up grading system (A1-F9 for Ghana)');
    }

    // 4. Check exam configuration
    const examConfig = await db.query.examConfigurations.findFirst({
      where: eq(examConfigurations.school_id, schoolId)
    });

    if (!examConfig) {
      debug.warnings.push('No exam configuration found');
      debug.recommendations.push('Set up exam configuration (CA/Exam percentage split)');
    } else {
      debug.statistics.caPercent = examConfig.class_score_weight;
      debug.statistics.examPercent = examConfig.exam_score_weight;
    }

    // 5. Check subjects
    const schoolSubjects = await db.query.subjects.findMany({
      where: eq(subjects.schoolId, schoolId)
    });

    debug.statistics.subjectsCount = schoolSubjects.length;

    if (schoolSubjects.length === 0) {
      debug.issues.push('No subjects configured');
      debug.recommendations.push('Add subjects for your curriculum');
    }

    // 6. Check classes and students
    const schoolClasses = await db.query.classes.findMany({
      where: eq(classes.schoolId, schoolId)
    });

    debug.statistics.classesCount = schoolClasses.length;

    if (schoolClasses.length === 0) {
      debug.issues.push('No classes configured');
      debug.recommendations.push('Create classes for your school');
    }

    // If specific class provided, get detailed analysis
    if (classId) {
      const classInfo = await db.query.classes.findFirst({
        where: and(
          eq(classes.id, classId),
          eq(classes.schoolId, schoolId)
        )
      });

      if (!classInfo) {
        debug.issues.push(`Class ${classId} not found in school`);
      } else {
        debug.statistics.className = classInfo.name;

        // Check students in class
        const enrollments = await db.query.classEnrollments.findMany({
          where: and(
            eq(classEnrollments.classId, classId),
            eq(classEnrollments.status, "active")
          ),
          with: {
            student: true
          }
        });

        debug.statistics.studentsInClass = enrollments.length;

        if (enrollments.length === 0) {
          debug.warnings.push('No students enrolled in this class');
        }

        // Check exams for this class
        const classExams = await db.query.exams.findMany({
          where: and(
            eq(exams.classId, classId),
            academicYearId ? eq(exams.academicYear, academicYearId) : undefined,
            academicTermId ? eq(exams.term, academicTermId) : undefined
          )
        });

        debug.statistics.examsInClass = classExams.length;

        if (classExams.length === 0) {
          debug.warnings.push('No exams found for this class');
          debug.recommendations.push('Create exams for subjects in this class');
        }

        // Check exam scores
        const examScoresCount = await db.select({ count: count() })
          .from(examScores)
          .where(
            inArray(examScores.examId, classExams.map(e => e.id))
          );

        debug.statistics.examScoresCount = examScoresCount[0]?.count || 0;

        // Check term reports
        if (academicYearId && academicTermId) {
          const termReportsCount = await db.query.termReports.findMany({
            where: and(
              eq(termReports.academicYearId, academicYearId),
              eq(termReports.academicTermId, academicTermId),
              inArray(termReports.studentId, enrollments.map(e => e.studentId))
            ),
            with: {
              details: true
            }
          });

          debug.statistics.termReportsCount = termReportsCount.length;
          debug.statistics.termReportDetailsCount = termReportsCount.reduce(
            (sum, report) => sum + (report.details?.length || 0), 0
          );

          if (termReportsCount.length < enrollments.length) {
            debug.warnings.push(`Only ${termReportsCount.length} of ${enrollments.length} students have term reports`);
            debug.recommendations.push('Regenerate term reports for all students');
          }

          // Check for empty scores
          const emptyScores = termReportsCount.filter(report => 
            report.details.every(detail => parseInt(detail.totalScore) === 0)
          );

          if (emptyScores.length > 0) {
            debug.warnings.push(`${emptyScores.length} students have all zero scores`);
            debug.recommendations.push('Check if exam scores are being calculated correctly');
          }
        }

        // Detailed exam analysis
        debug.statistics.examDetails = await Promise.all(
          classExams.slice(0, 5).map(async (exam) => {
            const scoresForExam = await db.query.examScores.findMany({
              where: eq(examScores.examId, exam.id)
            });

            return {
              examId: exam.id,
              examName: exam.name,
              subjectId: exam.subjectId,
              totalMarks: exam.totalMarks,
              scoresCount: scoresForExam.length,
              averageScore: scoresForExam.length > 0 
                ? scoresForExam.reduce((sum, s) => sum + Number(s.rawScore), 0) / scoresForExam.length 
                : 0
            };
          })
        );
      }
    }

    // Overall health score
    let healthScore = 100;
    if (debug.issues.length > 0) healthScore -= debug.issues.length * 20;
    if (debug.warnings.length > 0) healthScore -= debug.warnings.length * 10;
    
    debug.statistics.healthScore = Math.max(0, healthScore);
    debug.statistics.status = healthScore >= 80 ? 'Good' : healthScore >= 60 ? 'Warning' : 'Critical';

    return NextResponse.json(debug);

  } catch (error) {
    console.error('Error in exam system debug:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { action, schoolId, classId, academicYearId, academicTermId } = body;

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId is required' }, { status: 400 });
    }

    switch (action) {
      case 'createDefaultExamTypes':
        // Create default exam types for Ghana
        const defaultExamTypes = [
          { name: 'Class Test 1', shortName: 'CT1', category: 'Class Score', weight: 5, isDefault: true },
          { name: 'Class Test 2', shortName: 'CT2', category: 'Class Score', weight: 5, isDefault: true },
          { name: 'Class Test 3', shortName: 'CT3', category: 'Class Score', weight: 5, isDefault: true },
          { name: 'Assignment', shortName: 'ASS', category: 'Class Score', weight: 10, isDefault: true },
          { name: 'Project Work', shortName: 'PW', category: 'Class Score', weight: 5, isDefault: true },
          { name: 'End of Term Exam', shortName: 'ETE', category: 'Exam Score', weight: 70, isDefault: true, isSystem: true }
        ];

        for (const examType of defaultExamTypes) {
          await db.insert(examTypes).values({
            schoolId,
            ...examType,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: `Created ${defaultExamTypes.length} default exam types` 
        });

      case 'createDefaultGradeSystem':
        // Create Ghana grading system
        const ghanaGrades = [
          { gradeName: '1', minScore: 80, maxScore: 100, interpretation: 'Excellent', gradePoint: '1.0' },
          { gradeName: '2', minScore: 70, maxScore: 79, interpretation: 'Very Good', gradePoint: '2.0' },
          { gradeName: '3', minScore: 60, maxScore: 69, interpretation: 'Good', gradePoint: '3.0' },
          { gradeName: '4', minScore: 50, maxScore: 59, interpretation: 'Credit', gradePoint: '4.0' },
          { gradeName: '5', minScore: 40, maxScore: 49, interpretation: 'Pass', gradePoint: '5.0' },
          { gradeName: '6', minScore: 35, maxScore: 39, interpretation: 'Fail', gradePoint: '6.0' },
          { gradeName: '7', minScore: 30, maxScore: 34, interpretation: 'Fail', gradePoint: '7.0' },
          { gradeName: '8', minScore: 25, maxScore: 29, interpretation: 'Fail', gradePoint: '8.0' },
          { gradeName: '9', minScore: 0, maxScore: 24, interpretation: 'Fail', gradePoint: '9.0' }
        ];

        for (const grade of ghanaGrades) {
          await db.insert(gradeSystem).values({
            schoolId,
            ...grade,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: `Created ${ghanaGrades.length} grade levels` 
        });

      case 'createDefaultExamConfig':
        // Create default exam configuration
        await db.insert(examConfigurations).values({
          school_id: schoolId,
          class_score_weight: 30,
          exam_score_weight: 70,
          pass_mark: 50,
          highest_mark: 100,
          use_grade_system: true,
          created_at: new Date(),
          updated_at: new Date()
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Created default exam configuration (30% CA, 70% Exam)' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in exam system setup:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}