// components/dashboard/exams/report-templates/AttendanceSection.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from '@react-pdf/renderer';
import { AttendanceInfo } from './ReportTypes';

// Create styles
const styles = StyleSheet.create({
  attendanceSection: {
    border: '1px solid #000',
    padding: 8,
    marginBottom: 15,
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
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#f0f0f0',
    marginTop: 4,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

interface AttendanceSectionProps {
  attendance: AttendanceInfo;
}

export const AttendanceSection: React.FC<AttendanceSectionProps> = ({ attendance }) => {
  // Determine color based on attendance percentage
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return '#4CAF50'; // Green for excellent
    if (percentage >= 75) return '#8BC34A'; // Light green for good
    if (percentage >= 60) return '#FFC107'; // Amber for acceptable
    if (percentage >= 50) return '#FF9800'; // Orange for concerning
    return '#F44336'; // Red for poor
  };

  // Determine attendance comment based on percentage
  const getAttendanceComment = (percentage: number) => {
    if (percentage >= 95) return 'Excellent attendance record!';
    if (percentage >= 90) return 'Very good attendance';
    if (percentage >= 80) return 'Good attendance';
    if (percentage >= 70) return 'Satisfactory attendance';
    if (percentage >= 60) return 'Needs improvement';
    return 'Attendance is a serious concern';
  };

  const attendanceColor = getAttendanceColor(attendance.percentage);
  const attendanceComment = getAttendanceComment(attendance.percentage);

  return (
    <View style={styles.attendanceSection}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Attendance:</Text>
        <Text style={styles.infoValue}>
          {attendance.daysPresent} days out of {attendance.totalDays} ({attendance.percentage}%)
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Days Absent:</Text>
        <Text style={styles.infoValue}>{attendance.daysAbsent} days</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Comment:</Text>
        <Text style={styles.infoValue}>{attendanceComment}</Text>
      </View>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${attendance.percentage}%`, backgroundColor: attendanceColor }
          ]} 
        />
      </View>
    </View>
  );
};
