"use client";

import { useState } from 'react';
import ExamForm from './ExamForm';
import { SelectClass, SelectExamPeriod, SelectSubject } from '@/lib/schema';
import { Subject } from '@/types/exam';

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

  const examPeriods: SelectExamPeriod[] = []; // Replace with actual data
  const classes: SelectClass[] = []; // Replace with actual data
  const subjects: Subject[] = []; // Replace with actual data
  const assessmentTypes: any[] = []; // Replace with actual data

  return (
    <ExamForm
      schoolType={schoolType}
      schoolId={schoolId}
      examPeriods={examPeriods}
      classes={classes}
      subjects={subjects}
      assessmentTypes={assessmentTypes}
      onSubmit={(data:any) => handleExamSubmit(data)}
    />
  );
};

export default ExamFormWrapper; 