export type SchoolType = 'basic' | 'shs';

export interface Subject {
  id: string;
  name: string;
  code: string;
  isCore: boolean;
  schoolType: SchoolType;
}

export interface Exam {
  id: string;
  name: string;
  type: 'midterm' | 'endterm' | 'mock' | 'custom';
  startDate: Date;
  endDate: Date;
  instructions: string;
  schoolId: string;
  subjects: Subject[];
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  examId: string;
  subjectId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  score: number;
  grade: string;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamSchedule {
  id: string;
  examId: string;
  subjectId: string;
  date: Date;
  startTime: string;
  endTime: string;
  venue: string;
  createdAt: Date;
  updatedAt: Date;
} 