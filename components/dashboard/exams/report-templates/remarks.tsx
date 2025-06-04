// components/dashboard/exams/report-templates/RemarksSection.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  remarksSection: {
    marginTop: 5,
    paddingTop: 2,
  },
  remarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  remarkLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 140,
    minWidth: 140,
    marginRight: 10,
  },
  remarkLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    flex: 1,
    height: 15,
    marginRight: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    textDecoration: 'underline',
  },
});

interface RemarksSectionProps {
  schoolType?: 'BASIC' | 'HIGH' | 'SHS';
  classTeacherRemark?: string;
  headmasterRemark?: string;
  houseMasterRemark?: string;
  showSectionTitle?: boolean;
}

export const RemarksSection: React.FC<RemarksSectionProps> = ({ 
  schoolType = 'BASIC',
  classTeacherRemark = '',
  headmasterRemark = '',
  houseMasterRemark = '',
  showSectionTitle = true
}) => {
  const isHighSchool = schoolType === 'HIGH' || schoolType === 'SHS';
  
  return (
    <View style={styles.remarksSection}>
      {showSectionTitle && (
        <Text style={styles.sectionTitle}>REMARKS</Text>
      )}
      
      {/* Class Teacher's Remark */}
      <View style={styles.remarkRow}>
        <Text style={styles.remarkLabel}>Class Teacher&apos;s Remark:</Text>
        <View style={styles.remarkLine}>
          {classTeacherRemark && (
            <Text style={{ fontSize: 9, paddingTop: 2, paddingLeft: 3 }}>
              {classTeacherRemark}
            </Text>
          )}
        </View>
      </View>

      {/* House Master/Mistress Remark (only for SHS/HIGH schools) */}
      {isHighSchool && (
        <View style={styles.remarkRow}>
          <Text style={styles.remarkLabel}>House Master&apos;s Remark:</Text>
          <View style={styles.remarkLine}>
            {houseMasterRemark && (
              <Text style={{ fontSize: 9, paddingTop: 2, paddingLeft: 3 }}>
                {houseMasterRemark}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Headmaster's/Headmistress's Remark */}
      <View style={styles.remarkRow}>
        <Text style={styles.remarkLabel}>
          {schoolType === 'BASIC' ? "Headmaster's Remark:" : "Headmaster's Remark:"}
        </Text>
        <View style={styles.remarkLine}>
          {headmasterRemark && (
            <Text style={{ fontSize: 9, paddingTop: 2, paddingLeft: 3 }}>
              {headmasterRemark}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};