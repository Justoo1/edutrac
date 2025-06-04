// components/dashboard/exams/report-templates/SignatureSection.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  signatureSection: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signatureColumn: {
    flex: 1,
    alignItems: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    width: 150,
    marginBottom: 5,
  },
});

interface SignatureSectionProps {
  showParentSignature?: boolean;
  teacherName?: string;
  headmasterName?: string;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({ 
  showParentSignature = true,
  teacherName,
  headmasterName
}) => {
  return (
    <View style={styles.signatureSection}>
      <View style={styles.signatureColumn}>
        <View style={styles.signatureLine}></View>
        <Text>Class Teacher's Signature</Text>
        {teacherName && <Text style={{ fontSize: 8 }}>({teacherName})</Text>}
      </View>
      <View style={styles.signatureColumn}>
        <View style={styles.signatureLine}></View>
        <Text>Headmaster's Signature</Text>
        {headmasterName && <Text style={{ fontSize: 8 }}>({headmasterName})</Text>}
      </View>
      {showParentSignature && (
        <View style={styles.signatureColumn}>
          <View style={styles.signatureLine}></View>
          <Text>Parent's Signature</Text>
        </View>
      )}
    </View>
  );
};
