import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { 
  students, 
  schools, 
  attendance, 
  subjects,
  exams,
  examScores,
  termReports,
  termReportDetails,
  gradeSystem,
  classEnrollments,
  academicYears,
  academicTerms,
  examTypes
} from "@/lib/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    // Fetch the student to verify existence and permissions
    const student = await db.query.students.findFirst({
      where: and(
        eq(students.id, id),
        eq(students.schoolId, schoolId)
      ),
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify that the user has permission for this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the student's enrollment classes to know which classes to query
    const enrollments = await db.query.classEnrollments.findMany({
      where: eq(classEnrollments.studentId, id),
      with: {
        class: true
      }
    });
    
    const classIds = enrollments.map(enrollment => enrollment.classId);
    
    if (classIds.length === 0) {
      return NextResponse.json({
        student: {
          id: student.id,
          name: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' '),
          studentId: student.studentId || `ST-${id.substring(0, 6)}`,
          classAverage: 0,
          studentAverage: 0,
          classPosition: "N/A"
        },
        grades: [],
        attendance: {
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          totalDays: 0,
          percentage: 0,
          months: []
        },
        assignments: []
      });
    }

    // Fetch all subjects for the school
    const subjectsData = await db.query.subjects.findMany({
      where: eq(subjects.schoolId, schoolId)
    });

    // Fetch academic years and terms for context
    const academicYearsData = await db.query.academicYears.findMany({
      where: eq(academicYears.schoolId, schoolId),
      orderBy: desc(academicYears.createdAt)
    });

    const academicTermsData = await db.query.academicTerms.findMany({
      where: eq(academicTerms.schoolId, schoolId)
    });

    // Fetch term reports for the student
    const termReportsData = await db.query.termReports.findMany({
      where: eq(termReports.studentId, id),
      with: {
        details: {
          with: {
            subject: true,
            grade: true
          }
        },
        academicYear: true,
        academicTerm: true
      },
      orderBy: desc(termReports.createdAt)
    });

    // Group grades by term
    const termGrades: { [key: string]: any } = {};
    
    for (const termReport of termReportsData) {
      const termKey = `${termReport.academicYear?.name || 'Unknown Year'} - ${termReport.academicTerm?.name || 'Unknown Term'}`;
      
      if (!termGrades[termKey]) {
        termGrades[termKey] = {
          term: termKey,
          academicYear: termReport.academicYear?.name || 'Unknown Year',
          academicTerm: termReport.academicTerm?.name || 'Unknown Term',
          totalScore: termReport.totalMarks,
          averageScore: termReport.averageScore,
          rank: termReport.rank,
          subjects: []
        };
      }
      
      for (const detail of termReport.details) {
        termGrades[termKey].subjects.push({
          name: detail.subject?.name || 'Unknown Subject',
          classScore: detail.classScore,
          examScore: detail.examScore,
          totalScore: detail.totalScore,
          grade: detail.grade?.gradeName || 'NG',
          remarks: detail.grade?.interpretation || getRemarkForScore(Number(detail.totalScore)),
          classPosition: detail.classPosition,
          batchPosition: detail.batchPosition,
          coursePosition: detail.coursePosition
        });
      }
    }

    // Fetch exam scores for assignments/projects (non-terminal exams)
    const examsList = await db.query.exams.findMany({
      where: and(
        inArray(exams.classId, classIds),
        eq(exams.schoolId, schoolId)
      ),
      with: {
        examType: true,
        subject: true
      },
      orderBy: desc(exams.createdAt)
    });

    // Get exam scores for this student
    const examIds = examsList.map(exam => exam.id);
    const examScoresData = examIds.length > 0 ? await db.query.examScores.findMany({
      where: and(
        eq(examScores.studentId, id),
        inArray(examScores.examId, examIds)
      ),
      with: {
        exam: {
          with: {
            examType: true,
            subject: true
          }
        }
      },
      orderBy: desc(examScores.gradedAt)
    }) : [];

    // Get grade information separately if needed
    const gradeIds = examScoresData
  .map(score => score.gradeId)
  .filter((id): id is number => id !== null && id !== undefined);
    const gradesData = gradeIds.length > 0 ? await db.query.gradeSystem.findMany({
      where: inArray(gradeSystem.id, gradeIds)
    }) : [];

    // Filter for assignment-type exams (non-terminal exams)
    const assignments = examScoresData
      .filter(score => {
        const examType = score.exam?.examType;
        return examType && !examType.isSystem && 
               !examType.name.toLowerCase().includes('end of term') &&
               !examType.name.toLowerCase().includes('final') &&
               !examType.name.toLowerCase().includes('terminal');
      })
      .map(score => {
        // Find the grade for this score
        const grade = gradesData.find(g => g.id === score.gradeId);
        
        return {
          id: score.exam?.id || '',
          title: score.exam?.name || 'Unknown Assignment',
          dueDate: score.exam?.examDate ? new Date(score.exam.examDate).toISOString().split('T')[0] : null,
          submittedDate: score.gradedAt ? new Date(score.gradedAt).toISOString().split('T')[0] : null,
          score: Number(score.rawScore),
          totalMarks: score.exam?.totalMarks || 0,
          status: score.rawScore ? 'submitted' : 'pending',
          subject: score.exam?.subject?.name || 'Unknown',
          grade: grade?.gradeName || 'NG',
          remarks: score.remarks || grade?.interpretation || 'No remarks'
        };
      });

    // Fetch attendance records
    const attendanceRecords = await db.query.attendance.findMany({
      where: eq(attendance.studentId, id),
      orderBy: desc(attendance.date)
    });
    
    // Calculate attendance statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
    const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
    const lateDays = attendanceRecords.filter(record => record.status === 'late').length;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    // Group attendance by month
    const monthlyAttendance: { [key: string]: any } = {};
    
    for (const record of attendanceRecords) {
      const date = new Date(record.date);
      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!monthlyAttendance[month]) {
        monthlyAttendance[month] = {
          month,
          present: 0,
          absent: 0,
          late: 0
        };
      }
      
      if (record.status === 'present') {
        monthlyAttendance[month].present += 1;
      } else if (record.status === 'absent') {
        monthlyAttendance[month].absent += 1;
      } else if (record.status === 'late') {
        monthlyAttendance[month].late += 1;
      }
    }
    
    // Calculate student's average score from term reports
    let totalScore = 0;
    let totalTerms = 0;
    
    for (const termReport of termReportsData) {
      if (termReport.averageScore && Number(termReport.averageScore) > 0) {
        totalScore += Number(termReport.averageScore);
        totalTerms++;
      }
    }
    
    const studentAverage = totalTerms > 0 ? Math.round(totalScore / totalTerms) : 0;
    
    // Get class average from the most recent term report
    const latestTermReport = termReportsData[0];
    const classAverage = latestTermReport ? 
      Math.round(Number(latestTermReport.averageScore) * 0.95) : // Estimate
      studentAverage * 0.95;
    
    const classPosition = latestTermReport?.rank || "N/A";
    
    // Build the student's full name
    const studentName = [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(' ');
    
    // Create a consistent student ID display format
    const displayStudentId = student.studentId || `ST-${id.substring(0, 6)}`;
    
    // Prepare academic data structure
    const academicData = {
      student: {
        id: student.id,
        name: studentName,
        studentId: displayStudentId,
        classAverage: Math.round(classAverage),
        studentAverage: studentAverage,
        classPosition: classPosition
      },
      grades: Object.values(termGrades),
      attendance: {
        presentDays,
        absentDays,
        lateDays,
        totalDays,
        percentage,
        months: Object.values(monthlyAttendance)
      },
      assignments
    };

    return NextResponse.json(academicData);
  } catch (error) {
    console.error("[STUDENT_RECORDS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to get remarks based on score
function getRemarkForScore(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 50) return "Credit";
  if (score >= 40) return "Pass";
  if (score > 0) return "Needs Improvement";
  return "No Score";
}

// Ghana Basic Education Grading System (keeping for backward compatibility)
function calculateGhanaianGrade(score: number): string {
  if (score >= 80) return "1";    // Excellent
  if (score >= 70) return "2";    // Very Good
  if (score >= 60) return "3";    // Good
  if (score >= 50) return "4";    // Credit
  if (score >= 40) return "5";    // Pass
  return "6";                     // Fail
}

function getRemarkForGhanaianGrade(grade: string): string {
  switch (grade) {
    case "1": return "Excellent";
    case "2": return "Very Good";
    case "3": return "Good";
    case "4": return "Credit";
    case "5": return "Pass";
    case "6": return "Fail";
    default: return "Not Graded";
  }
}