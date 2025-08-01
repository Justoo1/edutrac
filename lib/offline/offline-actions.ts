// lib/offline/offline-actions.ts
// Example of how to modify your existing actions to work with offline mode

import { offlineApi, isOfflineData } from './api-wrapper';
import { offlineStorage } from './storage';
import { syncManager } from './sync-manager';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Student Actions with Offline Support
export async function createStudentOffline(
  schoolId: string,
  studentData: any
) {
  try {
    // Validate data first
    const validation = offlineApi.validateStudentData(studentData);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Add school context
    const dataWithSchool = { ...studentData, schoolId };

    // Use offline-aware API
    const result = await offlineApi.createStudent(dataWithSchool);

    if (result.success) {
      // Revalidate the students page
      revalidatePath(`/app/${schoolId}/students`);
      
      if (result.queued) {
        return {
          success: true,
          message: 'Student data saved offline. Will sync when online.',
          offline: true,
          requestId: result.requestId
        };
      } else {
        return {
          success: true,
          message: 'Student created successfully!',
          data: result.data
        };
      }
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error creating student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create student'
    };
  }
}

export async function updateStudentOffline(
  schoolId: string,
  studentId: string,
  studentData: any
) {
  try {
    const validation = offlineApi.validateStudentData(studentData);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const result = await offlineApi.updateStudent(studentId, studentData);

    if (result.success) {
      revalidatePath(`/app/${schoolId}/students`);
      revalidatePath(`/app/${schoolId}/students/${studentId}`);
      
      return {
        success: true,
        message: result.queued 
          ? 'Student updated offline. Will sync when online.'
          : 'Student updated successfully!',
        offline: result.queued,
        data: result.data
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error updating student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update student'
    };
  }
}

export async function deleteStudentOffline(
  schoolId: string,
  studentId: string
) {
  try {
    const result = await offlineApi.deleteStudent(studentId);

    if (result.success) {
      revalidatePath(`/app/${schoolId}/students`);
      
      return {
        success: true,
        message: result.queued 
          ? 'Student deletion queued. Will sync when online.'
          : 'Student deleted successfully!',
        offline: result.queued
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete student'
    };
  }
}

// Enhanced student fetching with offline support
export async function getStudentsOffline(schoolId: string) {
  try {
    // Try to get fresh data first
    const onlineResult = await offlineApi.getStudents(schoolId);
    
    if (onlineResult.success && !onlineResult.offline) {
      // We have fresh online data
      return {
        success: true,
        data: onlineResult.data,
        source: 'online'
      };
    }

    // Fallback to offline data or use cached data
    const offlineStudents = await offlineApi.getOfflineStudents();
    const schoolStudents = offlineStudents.filter(s => s.schoolId === schoolId);

    return {
      success: true,
      data: schoolStudents,
      source: 'offline',
      message: onlineResult.offline ? 'Using offline data' : undefined
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch students'
    };
  }
}

// Staff Actions with Offline Support
export async function createStaffOffline(
  schoolId: string,
  staffData: any
) {
  try {
    // Add school context
    const dataWithSchool = { ...staffData, schoolId };

    const result = await offlineApi.createStaff(dataWithSchool);

    if (result.success) {
      revalidatePath(`/app/${schoolId}/staff`);
      
      return {
        success: true,
        message: result.queued 
          ? 'Staff data saved offline. Will sync when online.'
          : 'Staff member created successfully!',
        offline: result.queued,
        requestId: result.requestId,
        data: result.data
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error creating staff:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create staff member'
    };
  }
}

export async function updateStaffOffline(
  schoolId: string,
  staffId: string,
  staffData: any
) {
  try {
    const result = await offlineApi.updateStaff(staffId, staffData);

    if (result.success) {
      revalidatePath(`/app/${schoolId}/staff`);
      revalidatePath(`/app/${schoolId}/staff/${staffId}`);
      
      return {
        success: true,
        message: result.queued 
          ? 'Staff updated offline. Will sync when online.'
          : 'Staff member updated successfully!',
        offline: result.queued,
        data: result.data
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error updating staff:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update staff member'
    };
  }
}

export async function getStaffOffline(schoolId: string) {
  try {
    const onlineResult = await offlineApi.getStaff(schoolId);
    
    if (onlineResult.success && !onlineResult.offline) {
      return {
        success: true,
        data: onlineResult.data,
        source: 'online'
      };
    }

    const offlineStaff = await offlineApi.getOfflineStaff();
    const schoolStaff = offlineStaff.filter(s => s.schoolId === schoolId);

    return {
      success: true,
      data: schoolStaff,
      source: 'offline',
      message: onlineResult.offline ? 'Using offline data' : undefined
    };
  } catch (error) {
    console.error('Error fetching staff:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch staff'
    };
  }
}

// Attendance Actions with Offline Support
export async function recordAttendanceOffline(
  schoolId: string,
  attendanceData: any
) {
  try {
    // Validate attendance data
    const validation = offlineApi.validateAttendanceData(attendanceData);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Add additional context
    const dataWithContext = {
      ...attendanceData,
      schoolId,
      recordedAt: new Date().toISOString(),
      recordedBy: attendanceData.recordedBy || 'system'
    };

    const result = await offlineApi.recordAttendance(dataWithContext);

    if (result.success) {
      revalidatePath(`/app/${schoolId}/attendance`);
      
      return {
        success: true,
        message: result.queued 
          ? 'Attendance recorded offline. Will sync when online.'
          : 'Attendance recorded successfully!',
        offline: result.queued,
        data: result.data
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error recording attendance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record attendance'
    };
  }
}

export async function getAttendanceOffline(
  schoolId: string,
  classId: string,
  date: string
) {
  try {
    // Try online first
    const result = await offlineApi.getAttendance(classId, date);
    
    if (result.success && !result.offline) {
      return {
        success: true,
        data: result.data,
        source: 'online'
      };
    }

    // Fallback to offline data
    const offlineAttendance = await offlineApi.getOfflineAttendance();
    const filteredAttendance = offlineAttendance.filter(
      a => a.classId === classId && a.date.startsWith(date) && a.schoolId === schoolId
    );

    return {
      success: true,
      data: filteredAttendance,
      source: 'offline',
      message: 'Using offline attendance data'
    };
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch attendance'
    };
  }
}

// Bulk Attendance Recording (optimized for offline)
export async function recordBulkAttendanceOffline(
  schoolId: string,
  classId: string,
  date: string,
  attendanceRecords: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'excused' | 'late';
    notes?: string;
  }>
) {
  try {
    const results = [];
    const errors = [];

    // Process each attendance record
    for (const record of attendanceRecords) {
      const attendanceData = {
        ...record,
        classId,
        date,
        schoolId
      };

      const result = await recordAttendanceOffline(schoolId, attendanceData);
      
      if (result.success) {
        results.push(result);
      } else {
        errors.push({ studentId: record.studentId, error: result.error });
      }
    }

    return {
      success: errors.length === 0,
      processed: results.length,
      errors: errors.length,
      message: `Processed ${results.length} attendance records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
      details: { results, errors }
    };
  } catch (error) {
    console.error('Error recording bulk attendance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record bulk attendance'
    };
  }
}

// Exam and Grades Actions
export async function submitGradesOffline(
  schoolId: string,
  examId: string,
  grades: Array<{
    studentId: string;
    score: number;
    remarks?: string;
  }>
) {
  try {
    // Validate each grade
    const validationErrors = [];
    
    for (const grade of grades) {
      if (!grade.studentId) {
        validationErrors.push(`Missing student ID for grade entry`);
      }
      if (typeof grade.score !== 'number' || grade.score < 0 || grade.score > 100) {
        validationErrors.push(`Invalid score for student ${grade.studentId}: ${grade.score}`);
      }
    }

    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors };
    }

    const result = await offlineApi.submitGrades(examId, grades);

    if (result.success) {
      revalidatePath(`/app/${schoolId}/exams/${examId}`);
      revalidatePath(`/app/${schoolId}/grades`);
      
      return {
        success: true,
        message: result.queued 
          ? 'Grades submitted offline. Will sync when online.'
          : 'Grades submitted successfully!',
        offline: result.queued,
        data: result.data
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error submitting grades:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit grades'
    };
  }
}

export async function createExamOffline(
  schoolId: string,
  examData: any
) {
  try {
    // Add school context
    const dataWithSchool = { ...examData, schoolId };

    const result = await offlineApi.createExam(dataWithSchool);

    if (result.success) {
      revalidatePath(`/app/${schoolId}/exams`);
      
      return {
        success: true,
        message: result.queued 
          ? 'Exam created offline. Will sync when online.'
          : 'Exam created successfully!',
        offline: result.queued,
        requestId: result.requestId,
        data: result.data
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error creating exam:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create exam'
    };
  }
}

export async function getExamResultsOffline(
  schoolId: string,
  examId: string
) {
  try {
    const result = await offlineApi.getExamResults(examId);
    
    if (result.success && !result.offline) {
      return {
        success: true,
        data: result.data,
        source: 'online'
      };
    }

    // Fallback to offline exam results
    const offlineGrades = await offlineStorage.getAllData('grades');
    const examResults = offlineGrades.filter(g => g.examId === examId);

    return {
      success: true,
      data: examResults,
      source: 'offline',
      message: 'Using offline exam results'
    };
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch exam results'
    };
  }
}

// Data Synchronization Utilities
export async function syncSchoolDataOffline(schoolId: string) {
  try {
    if (!navigator.onLine) {
      return {
        success: false,
        error: 'Cannot sync while offline'
      };
    }

    // Trigger comprehensive sync
    const result = await offlineApi.syncAllData(schoolId);
    
    // Store synced data locally
    if (result.students.success) {
      const studentItems = result.students.data!.map(student => ({
        key: student.id,
        data: student
      }));
      await offlineStorage.bulkStoreData('students', studentItems);
    }

    if (result.staff.success) {
      const staffItems = result.staff.data!.map(staff => ({
        key: staff.id,
        data: staff
      }));
      await offlineStorage.bulkStoreData('staff', staffItems);
    }

    if (result.classes.success) {
      const classItems = result.classes.data!.map(cls => ({
        key: cls.id,
        data: cls
      }));
      await offlineStorage.bulkStoreData('classes', classItems);
    }

    if (result.subjects.success) {
      const subjectItems = result.subjects.data!.map(subject => ({
        key: subject.id,
        data: subject
      }));
      await offlineStorage.bulkStoreData('subjects', subjectItems);
    }

    // Update last sync timestamp
    await offlineStorage.setSetting('lastFullSync', Date.now());
    await offlineStorage.setSetting('schoolId', schoolId);

    return {
      success: true,
      message: 'School data synchronized successfully',
      stats: {
        students: result.students.success ? result.students.data?.length : 0,
        staff: result.staff.success ? result.staff.data?.length : 0,
        classes: result.classes.success ? result.classes.data?.length : 0,
        subjects: result.subjects.success ? result.subjects.data?.length : 0
      }
    };
  } catch (error) {
    console.error('Error syncing school data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync school data'
    };
  }
}

// Search functionality with offline support
export async function searchStudentsOffline(
  schoolId: string,
  query: string
) {
  try {
    if (navigator.onLine) {
      // Try online search first
      const result = await offlineApi.request(`/students/search?schoolId=${schoolId}&q=${encodeURIComponent(query)}`);
      if (result.success) {
        return {
          success: true,
          data: result.data,
          source: 'online'
        };
      }
    }

    // Fallback to offline search
    const results = await offlineApi.searchOfflineStudents(query);
    const schoolResults = results.filter(student => student.schoolId === schoolId);

    return {
      success: true,
      data: schoolResults,
      source: 'offline',
      message: 'Search results from offline data'
    };
  } catch (error) {
    console.error('Error searching students:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search students'
    };
  }
}

export async function searchStaffOffline(
  schoolId: string,
  query: string
) {
  try {
    if (navigator.onLine) {
      const result = await offlineApi.request(`/staff/search?schoolId=${schoolId}&q=${encodeURIComponent(query)}`);
      if (result.success) {
        return {
          success: true,
          data: result.data,
          source: 'online'
        };
      }
    }

    // Fallback to offline search
    const results = await offlineApi.searchOfflineStaff(query);
    const schoolResults = results.filter(staff => staff.schoolId === schoolId);

    return {
      success: true,
      data: schoolResults,
      source: 'offline',
      message: 'Search results from offline data'
    };
  } catch (error) {
    console.error('Error searching staff:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search staff'
    };
  }
}

// Classes and Subjects Actions
export async function getClassesOffline(schoolId: string) {
  try {
    const onlineResult = await offlineApi.getClasses(schoolId);
    
    if (onlineResult.success && !onlineResult.offline) {
      return {
        success: true,
        data: onlineResult.data,
        source: 'online'
      };
    }

    const offlineClasses = await offlineApi.getOfflineClasses();
    const schoolClasses = offlineClasses.filter(c => c.schoolId === schoolId);

    return {
      success: true,
      data: schoolClasses,
      source: 'offline',
      message: onlineResult.offline ? 'Using offline data' : undefined
    };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch classes'
    };
  }
}

export async function createClassOffline(
  schoolId: string,
  classData: any
) {
  try {
    const dataWithSchool = { ...classData, schoolId };
    const result = await offlineApi.createClass(dataWithSchool);

    if (result.success) {
      revalidatePath(`/app/${schoolId}/classes`);
      
      return {
        success: true,
        message: result.queued 
          ? 'Class created offline. Will sync when online.'
          : 'Class created successfully!',
        offline: result.queued,
        requestId: result.requestId,
        data: result.data
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error creating class:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create class'
    };
  }
}

// Report Generation with Offline Data
export async function generateAttendanceReportOffline(
  schoolId: string,
  classId: string,
  startDate: string,
  endDate: string
) {
  try {
    // Get offline attendance data
    const attendanceData = await offlineApi.getOfflineAttendance();
    const classAttendance = attendanceData.filter(
      a => a.classId === classId && 
           a.schoolId === schoolId &&
           a.date >= startDate && 
           a.date <= endDate
    );

    // Get student data
    const students = await offlineApi.getOfflineStudents();
    const classStudents = students.filter(s => s.schoolId === schoolId);

    // Calculate attendance statistics
    const report = {
      classId,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      offline: true,
      students: classStudents.map(student => {
        const studentAttendance = classAttendance.filter(a => a.studentId === student.id);
        const totalDays = studentAttendance.length;
        const presentDays = studentAttendance.filter(a => a.status === 'present').length;
        const absentDays = studentAttendance.filter(a => a.status === 'absent').length;
        const lateDays = studentAttendance.filter(a => a.status === 'late').length;
        const excusedDays = studentAttendance.filter(a => a.status === 'excused').length;

        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
        };
      }),
      summary: {
        totalStudents: classStudents.length,
        averageAttendanceRate: 0 // Will be calculated below
      }
    };

    // Calculate average attendance rate
    if (report.students.length > 0) {
      const totalRate = report.students.reduce((sum, s) => sum + s.attendanceRate, 0);
      report.summary.averageAttendanceRate = totalRate / report.students.length;
    }

    return {
      success: true,
      data: report,
      message: 'Attendance report generated from offline data'
    };
  } catch (error) {
    console.error('Error generating attendance report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate attendance report'
    };
  }
}

export async function generateGradesReportOffline(
  schoolId: string,
  classId: string,
  subjectId?: string,
  academicYear?: string,
  term?: string
) {
  try {
    // Get offline grades data
    const gradesData = await offlineStorage.getAllData('grades');
    let filteredGrades = gradesData.filter(g => g.schoolId === schoolId);

    if (classId) {
      filteredGrades = filteredGrades.filter(g => g.classId === classId);
    }
    if (subjectId) {
      filteredGrades = filteredGrades.filter(g => g.subjectId === subjectId);
    }
    if (academicYear) {
      filteredGrades = filteredGrades.filter(g => g.academicYear === academicYear);
    }
    if (term) {
      filteredGrades = filteredGrades.filter(g => g.term === term);
    }

    // Get students and subjects data
    const students = await offlineApi.getOfflineStudents();
    const subjects = await offlineStorage.getAllData('subjects');

    const report = {
      classId,
      subjectId,
      academicYear,
      term,
      generatedAt: new Date().toISOString(),
      offline: true,
      grades: filteredGrades.map(grade => {
        const student = students.find(s => s.id === grade.studentId);
        const subject = subjects.find(s => s.id === grade.subjectId);
        
        return {
          ...grade,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
          subjectName: subject ? subject.name : 'Unknown Subject'
        };
      }),
      summary: {
        totalGrades: filteredGrades.length,
        averageScore: filteredGrades.length > 0 ? 
          filteredGrades.reduce((sum, g) => sum + g.totalScore, 0) / filteredGrades.length : 0,
        highestScore: filteredGrades.length > 0 ? 
          Math.max(...filteredGrades.map(g => g.totalScore)) : 0,
        lowestScore: filteredGrades.length > 0 ? 
          Math.min(...filteredGrades.map(g => g.totalScore)) : 0
      }
    };

    return {
      success: true,
      data: report,
      message: 'Grades report generated from offline data'
    };
  } catch (error) {
    console.error('Error generating grades report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate grades report'
    };
  }
}

// Offline Status and Utilities
export async function getOfflineStatusOffline(schoolId: string) {
  try {
    const storageStats = await offlineStorage.getStorageStats();
    const syncStats = await offlineApi.getSyncStats();
    const lastSync = await offlineStorage.getSetting('lastFullSync');
    
    return {
      success: true,
      data: {
        isOnline: navigator.onLine,
        isSyncing: syncStats.pendingSync > 0,
        lastFullSync: lastSync,
        storage: storageStats,
        sync: syncStats,
        capabilities: {
          canViewStudents: storageStats.students > 0,
          canViewStaff: storageStats.staff > 0,
          canRecordAttendance: true,
          canEnterGrades: true,
          canGenerateReports: storageStats.students > 0 && storageStats.attendance > 0
        }
      }
    };
  } catch (error) {
    console.error('Error getting offline status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get offline status'
    };
  }
}

export async function clearOfflineDataOffline(schoolId: string) {
  try {
    await offlineApi.clearAllOfflineData();
    await offlineStorage.setSetting('lastFullSync', null);
    await offlineStorage.setSetting('schoolId', null);
    
    return {
      success: true,
      message: 'All offline data cleared successfully'
    };
  } catch (error) {
    console.error('Error clearing offline data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear offline data'
    };
  }
}

// Helper function to check if we have sufficient offline data
export async function hasOfflineDataOffline(schoolId: string) {
  try {
    const stats = await offlineStorage.getStorageStats();
    const storedSchoolId = await offlineStorage.getSetting('schoolId');
    
    return {
      hasData: storedSchoolId === schoolId && stats.students > 0,
      stats,
      schoolId: storedSchoolId
    };
  } catch (error) {
    console.error('Error checking offline data:', error);
    return { hasData: false, stats: {}, schoolId: null };
  }
}

// Sync Management Actions
export async function forceSyncOffline(schoolId: string) {
  try {
    if (!navigator.onLine) {
      return {
        success: false,
        error: 'Cannot sync while offline'
      };
    }

    // Force sync all pending requests
    const syncResult = await syncManager.syncPendingRequests();
    
    // Then sync fresh data
    const dataResult = await syncSchoolDataOffline(schoolId);
    
    return {
      success: syncResult.success && dataResult.success,
      message: 'Forced sync completed',
      syncStats: {
        pendingRequestsSynced: syncResult.synced || 0,
        failedRequests: syncResult.failed || 0,
        dataRefreshed: dataResult.success
      }
    };
  } catch (error) {
    console.error('Error forcing sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to force sync'
    };
  }
}

export async function exportOfflineDataOffline(schoolId: string) {
  try {
    const students = await offlineApi.getOfflineStudents();
    const staff = await offlineApi.getOfflineStaff();
    const classes = await offlineApi.getOfflineClasses();
    const attendance = await offlineApi.getOfflineAttendance();
    const grades = await offlineStorage.getAllData('grades');
    
    // Filter by school
    const schoolData = {
      schoolId,
      exportedAt: new Date().toISOString(),
      students: students.filter(s => s.schoolId === schoolId),
      staff: staff.filter(s => s.schoolId === schoolId),
      classes: classes.filter(c => c.schoolId === schoolId),
      attendance: attendance.filter(a => a.schoolId === schoolId),
      grades: grades.filter(g => g.schoolId === schoolId)
    };
    
    return {
      success: true,
      data: schoolData,
      message: 'Offline data export completed'
    };
  } catch (error) {
    console.error('Error exporting offline data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export offline data'
    };
  }
}

// Example usage in a Next.js Server Action
export async function handleFormSubmissionOffline(
  formData: FormData,
  actionType: 'create' | 'update' | 'delete',
  entityType: 'student' | 'staff' | 'attendance' | 'grade' | 'class' | 'exam'
) {
  const schoolId = formData.get('schoolId') as string;
  
  try {
    switch (`${actionType}-${entityType}`) {
      case 'create-student':
        const studentData = {
          firstName: formData.get('firstName') as string,
          lastName: formData.get('lastName') as string,
          middleName: formData.get('middleName') as string,
          studentId: formData.get('studentId') as string,
          email: formData.get('email') as string,
          dateOfBirth: formData.get('dateOfBirth') as string,
          gender: formData.get('gender') as string,
          address: formData.get('address') as string,
          guardian: formData.get('guardian') ? JSON.parse(formData.get('guardian') as string) : null,
          contactInfo: formData.get('contactInfo') ? JSON.parse(formData.get('contactInfo') as string) : null,
        };
        return await createStudentOffline(schoolId, studentData);
        
      case 'update-student':
        const studentId = formData.get('studentId') as string;
        const updateStudentData = {
          firstName: formData.get('firstName') as string,
          lastName: formData.get('lastName') as string,
          middleName: formData.get('middleName') as string,
          email: formData.get('email') as string,
          dateOfBirth: formData.get('dateOfBirth') as string,
          gender: formData.get('gender') as string,
          address: formData.get('address') as string,
          guardian: formData.get('guardian') ? JSON.parse(formData.get('guardian') as string) : null,
          contactInfo: formData.get('contactInfo') ? JSON.parse(formData.get('contactInfo') as string) : null,
        };
        return await updateStudentOffline(schoolId, studentId, updateStudentData);
        
      case 'delete-student':
        const deleteStudentId = formData.get('studentId') as string;
        return await deleteStudentOffline(schoolId, deleteStudentId);
        
      case 'create-staff':
        const staffData = {
          name: formData.get('name') as string,
          staffId: formData.get('staffId') as string,
          email: formData.get('email') as string,
          position: formData.get('position') as string,
          department: formData.get('department') as string,
          qualification: formData.get('qualification') as string,
          joinedDate: formData.get('joinedDate') as string,
          gender: formData.get('gender') as string,
          contactInfo: formData.get('contactInfo') ? JSON.parse(formData.get('contactInfo') as string) : null,
        };
        return await createStaffOffline(schoolId, staffData);
        
      case 'update-staff':
        const staffUpdateId = formData.get('staffId') as string;
        const updateStaffData = {
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          position: formData.get('position') as string,
          department: formData.get('department') as string,
          qualification: formData.get('qualification') as string,
          joinedDate: formData.get('joinedDate') as string,
          gender: formData.get('gender') as string,
          contactInfo: formData.get('contactInfo') ? JSON.parse(formData.get('contactInfo') as string) : null,
        };
        return await updateStaffOffline(schoolId, staffUpdateId, updateStaffData);
        
      case 'create-attendance':
        const attendanceData = {
          studentId: formData.get('studentId') as string,
          classId: formData.get('classId') as string,
          date: formData.get('date') as string,
          status: formData.get('status') as string,
          notes: formData.get('notes') as string,
          recordedBy: formData.get('recordedBy') as string,
        };
        return await recordAttendanceOffline(schoolId, attendanceData);
        
      case 'create-class':
        const classData = {
          name: formData.get('name') as string,
          gradeLevel: formData.get('gradeLevel') as string,
          academicYear: formData.get('academicYear') as string,
          classTeacherId: formData.get('classTeacherId') as string,
          capacity: parseInt(formData.get('capacity') as string) || null,
          room: formData.get('room') as string,
          schedule: formData.get('schedule') ? JSON.parse(formData.get('schedule') as string) : null,
        };
        return await createClassOffline(schoolId, classData);
        
      case 'create-exam':
        const examData = {
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          subjectId: formData.get('subjectId') as string,
          classId: formData.get('classId') as string,
          examDate: formData.get('examDate') as string,
          duration: parseInt(formData.get('duration') as string) || null,
          totalMarks: parseInt(formData.get('totalMarks') as string) || 100,
          academicYear: formData.get('academicYear') as string,
          term: formData.get('term') as string,
        };
        return await createExamOffline(schoolId, examData);
        
      case 'create-grade':
        const examId = formData.get('examId') as string;
        const grades = JSON.parse(formData.get('grades') as string);
        return await submitGradesOffline(schoolId, examId, grades);
        
      // Add more cases as needed
      default:
        return {
          success: false,
          error: `Unsupported action: ${actionType}-${entityType}`
        };
    }
  } catch (error) {
    console.error('Error handling form submission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Form submission failed'
    };
  }
}

// Utility function for batch operations
export async function performBatchOperationOffline(
  schoolId: string,
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    entity: 'student' | 'staff' | 'attendance' | 'grade';
    data: any;
    id?: string;
  }>
) {
  try {
    const results = [];
    const errors = [];

    for (const operation of operations) {
      let result;
      
      switch (`${operation.type}-${operation.entity}`) {
        case 'create-student':
          result = await createStudentOffline(schoolId, operation.data);
          break;
        case 'update-student':
          result = await updateStudentOffline(schoolId, operation.id!, operation.data);
          break;
        case 'delete-student':
          result = await deleteStudentOffline(schoolId, operation.id!);
          break;
        case 'create-staff':
          result = await createStaffOffline(schoolId, operation.data);
          break;
        case 'update-staff':
          result = await updateStaffOffline(schoolId, operation.id!, operation.data);
          break;
        case 'create-attendance':
          result = await recordAttendanceOffline(schoolId, operation.data);
          break;
        default:
          result = { success: false, error: `Unsupported operation: ${operation.type}-${operation.entity}` };
      }
      
      if (result.success) {
        results.push({ operation, result });
      } else {
        errors.push({ operation, error: result.error });
      }
    }

    return {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
      message: `Batch operation completed: ${results.length} successful, ${errors.length} failed`
    };
  } catch (error) {
    console.error('Error performing batch operation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch operation failed'
    };
  }
}

// Data validation utilities
export function validateOfflineData(entityType: string, data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (entityType) {
    case 'student':
      if (!data.firstName) errors.push('First name is required');
      if (!data.lastName) errors.push('Last name is required');
      if (!data.studentId) errors.push('Student ID is required');
      if (!data.schoolId) errors.push('School ID is required');
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
      }
      break;
      
    case 'staff':
      if (!data.name) errors.push('Name is required');
      if (!data.staffId) errors.push('Staff ID is required');
      if (!data.schoolId) errors.push('School ID is required');
      if (!data.position) errors.push('Position is required');
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
      }
      break;
      
    case 'attendance':
      if (!data.studentId) errors.push('Student ID is required');
      if (!data.classId) errors.push('Class ID is required');
      if (!data.date) errors.push('Date is required');
      if (!data.status) errors.push('Attendance status is required');
      if (!['present', 'absent', 'excused', 'late'].includes(data.status)) {
        errors.push('Invalid attendance status');
      }
      break;
      
    case 'class':
      if (!data.name) errors.push('Class name is required');
      if (!data.gradeLevel) errors.push('Grade level is required');
      if (!data.academicYear) errors.push('Academic year is required');
      if (!data.schoolId) errors.push('School ID is required');
      break;
      
    case 'exam':
      if (!data.title) errors.push('Exam title is required');
      if (!data.subjectId) errors.push('Subject ID is required');
      if (!data.classId) errors.push('Class ID is required');
      if (!data.examDate) errors.push('Exam date is required');
      if (!data.schoolId) errors.push('School ID is required');
      break;
      
    default:
      errors.push(`Unknown entity type: ${entityType}`);
  }
  
  return { valid: errors.length === 0, errors };
}

// Connection status monitoring
export function monitorConnectionStatus(callback: (isOnline: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Auto-sync when connection is restored
export async function initializeAutoSync(schoolId: string) {
  const cleanup = monitorConnectionStatus(async (isOnline) => {
    if (isOnline) {
      console.log('Connection restored, attempting auto-sync...');
      try {
        const syncResult = await forceSyncOffline(schoolId);
        if (syncResult.success) {
          console.log('Auto-sync completed successfully');
        } else {
          console.warn('Auto-sync failed:', syncResult.error);
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    } else {
      console.log('Connection lost, switching to offline mode');
    }
  });
  
  // Return cleanup function for component unmounting
  return cleanup;
}