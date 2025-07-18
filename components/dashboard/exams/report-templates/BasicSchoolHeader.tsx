// components/dashboard/exams/report-templates/BasicSchoolHeader.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image 
} from '@react-pdf/renderer';
import { SchoolInfo } from './ReportTypes';

// Create styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottom: '2px solid #000',
    paddingBottom: 10,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    marginRight: 20,
  },
  logo: {
    width: '100%',
    height: 80,
    objectFit: 'contain',
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  schoolAddress: {
    fontSize: 10,
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    textDecoration: 'underline',
    textTransform: 'uppercase',
  },
});

interface BasicSchoolHeaderProps {
  schoolInfo: SchoolInfo;
  showLogo?: boolean;
  title?: string;
}

export const BasicSchoolHeader: React.FC<BasicSchoolHeaderProps> = ({ 
  schoolInfo, 
  showLogo = true,
  title = "Terminal Report Card"
}) => {
  return (
    <>
      <View style={styles.header}>
        {showLogo && schoolInfo.logo && (
          <View style={styles.logoContainer}>
            {/* eslint-disable-next-line  */}
            <Image src={schoolInfo.logo} style={styles.logo} />
          </View>
        )}
        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{schoolInfo.name}</Text>
          {schoolInfo.address && <Text style={styles.schoolAddress}>{schoolInfo.address}</Text>}
          {schoolInfo.phone && <Text style={styles.schoolAddress}>Tel: {schoolInfo.phone}</Text>}
          {schoolInfo.email && <Text style={styles.schoolAddress}>Email: {schoolInfo.email}</Text>}
          {schoolInfo.region && schoolInfo.district && (
            <Text style={styles.schoolAddress}>
              {schoolInfo.region} Region, {schoolInfo.district} District
            </Text>
          )}
          {schoolInfo.schoolCode && <Text style={styles.schoolAddress}>School Code: {schoolInfo.schoolCode}</Text>}
        </View>
      </View>
      <Text style={styles.reportTitle}>{title}</Text>
    </>
  );
};
