// components/dashboard/exams/report-templates/GradingKey.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  gradingKey: {
    marginBottom: 15,
    fontSize: 8,
  },
  gradingKeyTitle: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  gradingKeyRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  gradingKeyLabel: {
    width: 100,
  },
  gradingKeyValue: {
    flex: 1,
  },
});

// Define the grade interface based on the schema
interface Grade {
  id: number;
  schoolId: string;
  gradeName: string;
  minScore: number;
  maxScore: number;
  interpretation: string;
  gradePoint?: number;
}

interface GradingKeyProps {
  schoolType: 'basic' | 'high';
  grades?: Grade[];
}

export const GradingKey: React.FC<GradingKeyProps> = ({ 
  schoolType, 
  grades = [] 
}) => {
  // If grades are provided, use them. Otherwise, use default grades based on school type
  const useGrades = grades.length > 0 ? grades : getDefaultGrades(schoolType);
  
  // Group grades into rows of 3 for display
  const gradeGroups: Grade[][] = [];
  for (let i = 0; i < useGrades.length; i += 3) {
    gradeGroups.push(useGrades.slice(i, i + 3));
  }
  
  return (
    <View style={styles.gradingKey}>
      <Text style={styles.gradingKeyTitle}>Grading System:</Text>
      {gradeGroups.map((group, index) => (
        <View key={index} style={styles.gradingKeyRow}>
          {group.map((grade, i) => (
            <Text key={i} style={styles.gradingKeyLabel}>
              {grade.minScore}-{grade.maxScore}: {grade.gradeName} ({grade.interpretation})
            </Text>
          ))}
        </View>
      ))}
      {schoolType === 'high' && (
        <Text style={[styles.gradingKeyTitle, { marginTop: 5 }]}>
          Note: Lower grade points indicate better performance (1 is highest, 9 is lowest)
        </Text>
      )}
    </View>
  );
};

/**
 * Function to get default grades based on school type
 */
function getDefaultGrades(schoolType: 'basic' | 'high'): Grade[] {
  if (schoolType === 'basic') {
    // Default Basic School Grading
    return [
      { id: 1, schoolId: '', gradeName: 'A', minScore: 80, maxScore: 100, interpretation: 'Excellent' },
      { id: 2, schoolId: '', gradeName: 'B', minScore: 70, maxScore: 79, interpretation: 'Very Good' },
      { id: 3, schoolId: '', gradeName: 'C', minScore: 60, maxScore: 69, interpretation: 'Good' },
      { id: 4, schoolId: '', gradeName: 'D', minScore: 50, maxScore: 59, interpretation: 'Credit' },
      { id: 5, schoolId: '', gradeName: 'E', minScore: 40, maxScore: 49, interpretation: 'Pass' },
      { id: 6, schoolId: '', gradeName: 'F', minScore: 0, maxScore: 39, interpretation: 'Fail' }
    ];
  } else {
    // Default SHS/WAEC Grading
    return [
      { id: 1, schoolId: '', gradeName: 'A1', minScore: 80, maxScore: 100, interpretation: 'Excellent', gradePoint: 1.0 },
      { id: 2, schoolId: '', gradeName: 'B2', minScore: 70, maxScore: 79, interpretation: 'Very Good', gradePoint: 2.0 },
      { id: 3, schoolId: '', gradeName: 'B3', minScore: 65, maxScore: 69, interpretation: 'Good', gradePoint: 3.0 },
      { id: 4, schoolId: '', gradeName: 'C4', minScore: 60, maxScore: 64, interpretation: 'Credit', gradePoint: 4.0 },
      { id: 5, schoolId: '', gradeName: 'C5', minScore: 55, maxScore: 59, interpretation: 'Credit', gradePoint: 5.0 },
      { id: 6, schoolId: '', gradeName: 'C6', minScore: 50, maxScore: 54, interpretation: 'Credit', gradePoint: 6.0 },
      { id: 7, schoolId: '', gradeName: 'D7', minScore: 45, maxScore: 49, interpretation: 'Pass', gradePoint: 7.0 },
      { id: 8, schoolId: '', gradeName: 'E8', minScore: 40, maxScore: 44, interpretation: 'Pass', gradePoint: 8.0 },
      { id: 9, schoolId: '', gradeName: 'F9', minScore: 0, maxScore: 39, interpretation: 'Fail', gradePoint: 9.0 }
    ];
  }
}
