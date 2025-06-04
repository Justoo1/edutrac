// components/dashboard/exams/report-templates/SummarySection.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from '@react-pdf/renderer';
import { StudentInfo, SubjectResult } from './ReportTypes';

// Create styles
const styles = StyleSheet.create({
  summarySection: {
    marginTop: 10,
    marginBottom: 15,
    border: '1px solid #000',
    padding: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  summaryLabel: {
    width: 150,
    fontWeight: 'bold',
  },
  summaryValue: {
    width: 150,
  },
});

interface SummarySectionProps {
  studentInfo: StudentInfo;
  subjects: SubjectResult[];
  totalAverage: number;
  passMarkPercentage?: number;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ 
  studentInfo, 
  subjects, 
  totalAverage,
  passMarkPercentage = 40 
}) => {
  // Calculate total score from subjects
  const totalScore = subjects.reduce((sum, subject) => sum + subject.totalScore, 0);
  
  // Determine promotion status based on average
  const getPromotionStatus = (average: number) => {
    if (average >= passMarkPercentage) return "Promoted";
    return "Must Repeat"; 
  };
  
  // Get recommendation based on performance
  const getRecommendation = (average: number) => {
    if (average >= 80) return "Excellent performance! Keep up the good work!";
    if (average >= 70) return "Very good performance. Keep striving for excellence!";
    if (average >= 60) return "Good performance. Continue to work hard!";
    if (average >= 50) return "Satisfactory performance. More effort is needed in weak subjects.";
    if (average >= passMarkPercentage) return "Passed, but needs significant improvement in multiple subjects.";
    return "Failed to meet promotion requirements. Student needs intensive support.";
  };
  
  return (
    <View style={styles.summarySection}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Score:</Text>
        <Text style={styles.summaryValue}>
          {totalScore.toFixed(1)}
        </Text>
        <Text style={styles.summaryLabel}>Class Position:</Text>
        <Text style={styles.summaryValue}>
          {studentInfo.classPosition} out of {studentInfo.totalStudents}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Overall Average:</Text>
        <Text style={styles.summaryValue}>{totalAverage.toFixed(2)}%</Text>
        <Text style={styles.summaryLabel}>Promotion Status:</Text>
        <Text style={styles.summaryValue}>
          {getPromotionStatus(totalAverage)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Recommendation:</Text>
        <Text style={[styles.summaryValue, { width: 350 }]}>
          {getRecommendation(totalAverage)}
        </Text>
      </View>
    </View>
  );
};

// SHS version with GPA calculation
export const SHSSummarySection: React.FC<SummarySectionProps> = ({ 
  studentInfo, 
  subjects, 
  totalAverage,
  passMarkPercentage = 40 
}) => {
  // Calculate total score from subjects
  const totalScore = subjects.reduce((sum, subject) => sum + subject.totalScore, 0);
  
  // Calculate GPA using Ghana SHS grading system
  const calculateGPA = (subjects: SubjectResult[]) => {
    // Ghana WAEC SHS grade points
    const gradePoints: Record<string, number> = {
      'A1': 1.0,
      'B2': 2.0,
      'B3': 3.0,
      'C4': 4.0,
      'C5': 5.0,
      'C6': 6.0,
      'D7': 7.0,
      'E8': 8.0,
      'F9': 9.0
    };
    
    let totalPoints = 0;
    let validSubjects = 0;
    
    subjects.forEach(subject => {
      if (gradePoints[subject.grade]) {
        totalPoints += gradePoints[subject.grade];
        validSubjects++;
      }
    });
    
    if (validSubjects === 0) return 0;
    
    // In Ghana's SHS system, lower numbers are better (1 is best, 9 is worst)
    return (totalPoints / validSubjects).toFixed(2);
  };
  
  const gpa = calculateGPA(subjects);
  
  // Determine promotion status based on average and GPA
  const getPromotionStatus = (average: number) => {
    if (average >= passMarkPercentage) return "Promoted";
    return "Must Repeat"; 
  };
  
  return (
    <View style={styles.summarySection}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Score:</Text>
        <Text style={styles.summaryValue}>
          {totalScore.toFixed(1)}
        </Text>
        <Text style={styles.summaryLabel}>Class Position:</Text>
        <Text style={styles.summaryValue}>
          {studentInfo.classPosition} out of {studentInfo.totalStudents}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Overall Average:</Text>
        <Text style={styles.summaryValue}>{totalAverage.toFixed(2)}%</Text>
        <Text style={styles.summaryLabel}>Grade Point Average:</Text>
        <Text style={styles.summaryValue}>{gpa}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Promotion Status:</Text>
        <Text style={styles.summaryValue}>{getPromotionStatus(totalAverage)}</Text>
      </View>
    </View>
  );
};
