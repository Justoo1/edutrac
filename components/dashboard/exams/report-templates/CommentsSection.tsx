// components/dashboard/exams/report-templates/CommentsSection.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from '@react-pdf/renderer';
import { CommentsSection as CommentsType } from './ReportTypes';

// Create styles
const styles = StyleSheet.create({
  commentSection: {
    marginBottom: 15,
    border: '1px solid #000',
    padding: 8,
  },
  commentLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  commentText: {
    marginBottom: 10,
    paddingLeft: 5,
    fontStyle: 'italic',
  },
});

interface CommentsSectionProps {
  comments: CommentsType;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ comments }) => {
  return (
    <View style={styles.commentSection}>
      {comments.teacherComment && (
        <>
          <Text style={styles.commentLabel}>Class Teacher's Comment:</Text>
          <Text style={styles.commentText}>{comments.teacherComment}</Text>
        </>
      )}
      {comments.headComment && (
        <>
          <Text style={styles.commentLabel}>Headmaster's Comment:</Text>
          <Text style={styles.commentText}>{comments.headComment}</Text>
        </>
      )}
      {comments.additionalComments && (
        <>
          <Text style={styles.commentLabel}>Additional Comments:</Text>
          <Text style={styles.commentText}>{comments.additionalComments}</Text>
        </>
      )}
    </View>
  );
};
