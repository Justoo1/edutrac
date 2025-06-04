// components/dashboard/exams/report-templates/StudentInfoSection.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from '@react-pdf/renderer';
import { StudentInfo, AcademicInfo } from './ReportTypes';

// Create styles
const styles = StyleSheet.create({
  infoSection: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  infoColumn: {
    flex: 1,
    padding: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 110,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
  },
});

interface StudentInfoSectionProps {
  studentInfo: StudentInfo;
  academicInfo: AcademicInfo;
  formatDate: (date?: string | Date) => string;
}

export const StudentInfoSection: React.FC<StudentInfoSectionProps> = ({ 
  studentInfo, 
  academicInfo, 
  formatDate 
}) => {
  return (
    <View style={styles.infoSection}>
      <View style={styles.infoColumn}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Student Name:</Text>
          <Text style={styles.infoValue}>
            {studentInfo.firstName} {studentInfo.middleName} {studentInfo.lastName}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Student ID:</Text>
          <Text style={styles.infoValue}>{studentInfo.studentId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Class:</Text>
          <Text style={styles.infoValue}>{studentInfo.className}</Text>
        </View>
        {studentInfo.gender && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender:</Text>
            <Text style={styles.infoValue}>{studentInfo.gender}</Text>
          </View>
        )}
      </View>
      <View style={styles.infoColumn}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Academic Year:</Text>
          <Text style={styles.infoValue}>{academicInfo.academicYear}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Term:</Text>
          <Text style={styles.infoValue}>{academicInfo.term}</Text>
        </View>
        {studentInfo.dateOfBirth && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth:</Text>
            <Text style={styles.infoValue}>{formatDate(studentInfo.dateOfBirth)}</Text>
          </View>
        )}
        {studentInfo.guardianName && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Guardian Name:</Text>
            <Text style={styles.infoValue}>{studentInfo.guardianName}</Text>
          </View>
        )}
      </View>
      <View style={styles.infoColumn}>
        {academicInfo.startDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Term Start Date:</Text>
            <Text style={styles.infoValue}>{formatDate(academicInfo.startDate)}</Text>
          </View>
        )}
        {academicInfo.endDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Term End Date:</Text>
            <Text style={styles.infoValue}>{formatDate(academicInfo.endDate)}</Text>
          </View>
        )}
        {studentInfo.classPosition && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class Position:</Text>
            <Text style={styles.infoValue}>
              {studentInfo.classPosition} out of {studentInfo.totalStudents}
            </Text>
          </View>
        )}
        {academicInfo.nextTermBegins && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Next Term Begins:</Text>
            <Text style={styles.infoValue}>{formatDate(academicInfo.nextTermBegins)}</Text>
          </View>
        )}
      </View>
    </View>
  );
};
