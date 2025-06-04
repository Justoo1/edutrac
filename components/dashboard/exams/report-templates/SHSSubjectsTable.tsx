// components/dashboard/exams/report-templates/SHSSubjectsTable.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from '@react-pdf/renderer';
import { SubjectResult } from './ReportTypes';

// Create styles
const styles = StyleSheet.create({
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    minHeight: 25,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#f2f2f2',
  },
  tableRowHeader: {
    backgroundColor: '#e6e6e6',
    fontWeight: 'bold',
  },
  tableCol: {
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  tableColLast: {
    borderRightWidth: 0,
  },
  // SHS column widths
  subjectCol: {
    width: '20%',
  },
  scoreCol: {
    width: '12%',
    textAlign: 'center',
  },
  gradeCol: {
    width: '8%',
    textAlign: 'center',
  },
  positionCol: {
    width: '8%',
    textAlign: 'center',
  },
  programCol: {
    width: '8%',
    textAlign: 'center',
  },
  remarkCol: {
    width: '16%',
  },
});

interface SHSSubjectsTableProps {
  subjects: SubjectResult[];
  showClassScores?: boolean;
  showExamScores?: boolean;
  showPositions?: boolean;
  showProgramPosition?: boolean;
  classScoreWeight?: number;
  examScoreWeight?: number;
}

export const SHSSubjectsTable: React.FC<SHSSubjectsTableProps> = ({ 
  subjects,
  showClassScores = true,
  showExamScores = true,
  showPositions = true,
  showProgramPosition = true,
  classScoreWeight = 30,
  examScoreWeight = 70,
}) => {
  return (
    <View style={styles.table}>
      {/* Table Header */}
      <View style={[styles.tableRow, styles.tableRowHeader]}>
        <View style={[styles.tableCol, styles.subjectCol]}>
          <Text>Subject</Text>
        </View>
        {showClassScores && (
          <View style={[styles.tableCol, styles.scoreCol]}>
            <Text>Class ({classScoreWeight}%)</Text>
          </View>
        )}
        {showExamScores && (
          <View style={[styles.tableCol, styles.scoreCol]}>
            <Text>Exam ({examScoreWeight}%)</Text>
          </View>
        )}
        <View style={[styles.tableCol, styles.scoreCol]}>
          <Text>Total (100%)</Text>
        </View>
        <View style={[styles.tableCol, styles.gradeCol]}>
          <Text>Grade</Text>
        </View>
        {showPositions && (
          <View style={[styles.tableCol, styles.positionCol]}>
            <Text>Position</Text>
          </View>
        )}
        {showProgramPosition && (
          <View style={[styles.tableCol, styles.programCol]}>
            <Text>Program</Text>
          </View>
        )}
        <View 
          style={[
            styles.tableCol, 
            styles.remarkCol, 
            !(showPositions || showProgramPosition) ? styles.tableColLast : {}
          ]}
        >
          <Text>Remark</Text>
        </View>
      </View>

      {/* Table Content */}
      {subjects.map((subject, index) => (
        <View 
          key={subject.id} 
          style={[
            styles.tableRow, 
            index % 2 === 1 ? styles.tableRowEven : {}
          ]}
        >
          <View style={[styles.tableCol, styles.subjectCol]}>
            <Text>{subject.subjectName}</Text>
          </View>
          {showClassScores && (
            <View style={[styles.tableCol, styles.scoreCol]}>
              <Text>{subject.classScore.toFixed(1)}</Text>
            </View>
          )}
          {showExamScores && (
            <View style={[styles.tableCol, styles.scoreCol]}>
              <Text>{subject.examScore.toFixed(1)}</Text>
            </View>
          )}
          <View style={[styles.tableCol, styles.scoreCol]}>
            <Text>{subject.totalScore.toFixed(1)}</Text>
          </View>
          <View style={[styles.tableCol, styles.gradeCol]}>
            <Text>{subject.grade}</Text>
          </View>
          {showPositions && (
            <View style={[styles.tableCol, styles.positionCol]}>
              <Text>{subject.classPosition || "-"}</Text>
            </View>
          )}
          {showProgramPosition && (
            <View style={[styles.tableCol, styles.programCol]}>
              <Text>{subject.coursePosition || "-"}</Text>
            </View>
          )}
          <View 
            style={[
              styles.tableCol, 
              styles.remarkCol, 
              !(showPositions || showProgramPosition) ? styles.tableColLast : {}
            ]}
          >
            <Text>{subject.remark}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};
