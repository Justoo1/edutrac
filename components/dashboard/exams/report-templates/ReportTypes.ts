// components/dashboard/exams/report-templates/ReportTypes.ts

// Common types for report templates

export interface SchoolInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  region?: string;
  district?: string;
  schoolCode?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface StudentInfo {
  id: string;
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string | Date;
  guardianName?: string;
  className?: string;
  classPosition?: string;
  totalStudents?: number;
}

export interface AcademicInfo {
  academicYear: string;
  term: string;
  startDate?: string | Date;
  endDate?: string | Date;
  nextTermBegins?: string | Date;
}

export interface SubjectResult {
  id: string;
  subjectId?: string;
  subjectName: string;
  classScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
  classAverage?: number;
  classPosition?: number;
  coursePosition?: number;
  batchPosition?: number;
  teacherComment?: string;
}

export interface AttendanceInfo {
  daysPresent: number;
  daysAbsent: number;
  totalDays: number;
  percentage: number;
}

export interface BehaviorRating {
  label: string;
  rating: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
}

export interface CommentsSection {
  teacherComment?: string;
  headComment?: string;
  additionalComments?: string;
}

export interface ReportCardProps {
  schoolInfo: SchoolInfo;
  studentInfo: StudentInfo;
  academicInfo: AcademicInfo;
  subjects: SubjectResult[];
  attendance?: AttendanceInfo;
  behaviors?: BehaviorRating[];
  comments?: CommentsSection;
  totalAverage: number;
  showLogo?: boolean;
}

export interface ReportContext {
  schoolType: 'basic' | 'high';
  reportView: 'preview' | 'print';
  showComments: boolean;
  showAttendance: boolean;
  showBehavior: boolean;
}

export interface CompleteReportData {
  schoolInfo: SchoolInfo;
  studentInfo: StudentInfo;
  academicInfo: AcademicInfo;
  subjects: SubjectResult[];
  attendance?: AttendanceInfo;
  behaviors?: BehaviorRating[];
  comments?: CommentsSection;
  totalAverage: number;
  reportId: string;
}
