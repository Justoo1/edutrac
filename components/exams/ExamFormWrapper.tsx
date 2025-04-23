"use client";

import { useState } from 'react';
import ExamForm from './ExamForm';
import { SelectSubject } from '@/lib/schema';

interface ExamFormWrapperProps {
  schoolType: 'BASIC' | 'SHS' | null;
  schoolId: string;
}

const ExamFormWrapper: React.FC<ExamFormWrapperProps> = ({ schoolType, schoolId }) => {
  const handleExamSubmit = async (data: {
    examName: string;
    examType: 'midterm' | 'endterm' | 'mock' | 'custom';
    startDate: string;
    endDate: string;
    instructions: string;
    selectedSubjects: SelectSubject[];
  }) => {
    // TODO: Implement exam creation logic
    console.log(data);
  };

  return (
    <ExamForm
      schoolType={schoolType}
      schoolId={schoolId}
      onSubmit={handleExamSubmit}
    />
  );
};

export default ExamFormWrapper; 