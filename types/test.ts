// Test-specific types for mocking database entities

export interface MockStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

export interface MockExamScore {
  id: string;
  studentId: string;
  rawScore: number;
  student: MockStudent;
  scaledScore?: number;
  percentageScore?: number;
  grade?: string;
  remarks?: string;
}

export interface MockClass {
  id: string;
  name: string;
}

export interface MockSubject {
  id: string;
  name: string;
}

export interface MockExamType {
  id: string;
  name: string;
}

export interface MockSchool {
  id: string;
  name: string;
}

export interface MockExam {
  id: string;
  name: string;
  schoolId: string;
  totalMarks: number;
  duration?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  description?: string | null;
  status?: string;
  academicYear?: string;
  createdBy?: string;
  examScores?: MockExamScore[];
  class?: MockClass;
  subject?: MockSubject;
  examType?: MockExamType;
  school?: MockSchool;
}

export interface MockGradeSystem {
  id: string;
  schoolId: string;
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
}

export interface MockExamConfiguration {
  id: string;
  schoolId: string;
  class_score_weight: number;
  exam_score_weight: number;
}
