// pages/api/reports/student/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { termReports, termReportDetails, students, gradeSystem, classEnrollments, examPeriods } from '@/lib/schema';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Check authentication
    const session = await getSession();
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    // Get student ID and exam period ID from query parameters
    const { id: studentId, examPeriodId } = req.query;
    
    if (!studentId || !examPeriodId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required parameters missing. Please provide studentId and examPeriodId'
      });
    }
    
    // Check authorization
    // Admin can view any report, teachers can view their students' reports,
    // students/parents can only view their own reports
    // pages/api/reports/student/[id].ts (continued)

    if (session.user.role !== 'admin') {
        if (session.user.role === 'teacher') {
          // Check if teacher is authorized for this student
          const isAuthorized = await isTeacherAuthorizedForStudent(session.user.id, studentId as string);
          
          if (!isAuthorized) {
            return res.status(403).json({ 
              success: false, 
              message: 'You are not authorized to view this student\'s report' 
            });
          }
        } else if (session.user.role === 'student') {
          // Students can only view their own reports
          if (session.user.id !== studentId) {
            return res.status(403).json({ 
              success: false, 
              message: 'You are not authorized to view this report' 
            });
          }
        } else {
          // Other roles not authorized
          return res.status(403).json({ 
            success: false, 
            message: 'Not authorized' 
          });
        }
      }
      
      // Get term report
      const termReport = await db.query.termReports.findFirst({
        where: and(
          eq(termReports.studentId, studentId as string),
          eq(termReports.examPeriodId, examPeriodId as string)
        ),
        with: {
          student: true
        }
      });
      
      if (!termReport) {
        return res.status(404).json({ 
          success: false, 
          message: 'Terminal report not found' 
        });
      }
      
      // Get term report details (subject scores)
      const reportDetails = await db.query.termReportDetails.findMany({
        where: eq(termReportDetails.termReportId, termReport.id),
        with: {
          subject: true
        }
      });
      
      // Get grades for all report details
      const gradeIds = reportDetails.map(detail => detail.gradeId).filter(Boolean);
      const filteredGradeIds = gradeIds.filter(id => id !== null) as number[];
      const grades = filteredGradeIds.length > 0 
        ? await db.query.gradeSystem.findMany({
            where: sql`id IN (${sql.join(filteredGradeIds, sql`, `)})`
            })
        : [];
      
      // Map grades to details
      const detailsWithGrades = reportDetails.map(detail => {
        const grade = grades.find(g => g.id === detail.gradeId);
        return {
          ...detail,
          gradeName: grade?.gradeName || null,
          gradeInterpretation: grade?.interpretation || null,
          gradePoint: grade?.gradePoint || null
        };
      });
      
      // Get student details
      const student = await db.query.students.findFirst({
        where: eq(students.id, studentId as string),
        with: {
          school: true,
          enrollments: {
            where: eq(classEnrollments.status, "active"),
            with: {
              class: true
            }
          }
        }
      });
      
      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found' 
        });
      }
      
      // Get exam period details
      const examPeriod = await db.query.examPeriods.findFirst({
        where: eq(examPeriods.id, parseInt(examPeriodId as string))
      });

      // Get subject names separately
        const subjectIds = detailsWithGrades.map(d => d.subjectId);
        const subjectMap = new Map();

        const subjectData = await db.query.subjects.findMany({
        where: sql`id IN (${sql.join(subjectIds, sql`, `)})`,
        columns: {
            id: true,
            name: true
        }
        });

        // Create lookup map
        for (const subject of subjectData) {
        subjectMap.set(subject.id, subject.name);
        }
      
      // Construct and return the report
      return res.status(200).json({
        success: true,
        report: {
          student: {
            id: student.id,
            name: `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim(),
            studentId: student.studentId, // School-issued ID
            class: student.enrollments[0]?.class?.name || 'Unknown',
            gradeLevel: student.enrollments[0]?.class?.gradeLevel || 'Unknown'
          },
          school: student.school,
          termInfo: {
            examPeriod: examPeriod,
            averageScore: termReport.averageScore,
            position: termReport.rank,
            remarks: termReport.remarks
          },
          subjects: detailsWithGrades.map(detail => {
            /// Type assertion to tell TypeScript that subject has a name property
            // const subject = detail.subject as { name: string } | undefined;
            
            return {
              id: detail.subjectId,
              name: subjectMap.get(detail.subjectId) || 'Unknown Subject',
              classScore: parseFloat(detail.classScore as string),
              examScore: parseFloat(detail.examScore as string),
              totalScore: parseFloat(detail.totalScore as string),
              grade: detail.gradeName,
              gradePoint: detail.gradePoint,
              interpretation: detail.gradeInterpretation,
              position: detail.classPosition || null
            };
          })
        }
      });
    } catch (error) {
      console.error('Error retrieving terminal report:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }
  
  // Helper function to check teacher authorization
  async function isTeacherAuthorizedForStudent(teacherId: string, studentId: string): Promise<boolean> {
    // Implementation depends on your data model
    // A teacher might be authorized if they:
    // 1. Are the class teacher for the student's class
    // 2. Teach at least one subject to the student's class
    
    // For simplicity, we'll allow any teacher to view any student's report
    // In a real implementation, you would check the teacher's relationship to the student
    return true;
  }