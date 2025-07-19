// components/dashboard/exams/report-templates/BehaviorSection.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from '@react-pdf/renderer';
import { BehaviorRating } from './ReportTypes';

// Create styles
const styles = StyleSheet.create({
  behaviorSection: {
    marginBottom: 15,
  },
  behaviorTable: {
    display: 'table' as any,
    width: '100%',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 10,
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
  behaviorLabel: {
    width: '70%',
  },
  behaviorRating: {
    width: '30%',
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

interface BehaviorSectionProps {
  behaviors: BehaviorRating[];
}

export const BehaviorSection: React.FC<BehaviorSectionProps> = ({ behaviors }) => {
  // Function to get rating color
  const getRatingColor = (rating: string) => {
    switch(rating) {
      case 'Excellent': return '#4CAF50'; // Green
      case 'Very Good': return '#8BC34A'; // Light green
      case 'Good': return '#FFC107'; // Yellow
      case 'Fair': return '#FF9800'; // Orange
      case 'Poor': return '#F44336'; // Red
      default: return '#000000'; // Black
    }
  };
  
  return (
    <View style={styles.behaviorSection}>
      <Text style={styles.sectionTitle}>Conduct and Attitude</Text>
      <View style={styles.behaviorTable}>
        <View style={[styles.tableRow, styles.tableRowHeader]}>
          <View style={[styles.tableCol, styles.behaviorLabel]}>
            <Text>Behavior</Text>
          </View>
          <View style={[styles.tableCol, styles.behaviorRating, styles.tableColLast]}>
            <Text>Rating</Text>
          </View>
        </View>
        {behaviors.map((behavior, index) => (
          <View 
            key={index} 
            style={[
              styles.tableRow, 
              index % 2 === 1 ? styles.tableRowEven : {}
            ]}
          >
            <View style={[styles.tableCol, styles.behaviorLabel]}>
              <Text>{behavior.label}</Text>
            </View>
            <View style={[styles.tableCol, styles.behaviorRating, styles.tableColLast]}>
              <Text style={{ color: getRatingColor(behavior.rating) }}>
                {behavior.rating}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
