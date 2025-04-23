/**
 * Exam utility functions for calculating and processing student scores
 */

type GradeInfo = {
  grade: string;
  remark: string;
};

/**
 * Converts a score from one total to another using the formula:
 * Converted Score = (Student's Score / Total Score) × New Total
 * 
 * @param studentScore The student's actual score
 * @param totalScore The total possible score of the original test
 * @param newTotal The new total to convert to (e.g., 30 for 30% weight)
 * @returns The converted score
 */
export function convertScore(
  studentScore: number,
  totalScore: number,
  newTotal: number
): number {
  if (totalScore === 0) return 0;
  
  // Apply the conversion formula
  const convertedScore = (studentScore / totalScore) * newTotal;
  
  // Round to 2 decimal places
  return parseFloat(convertedScore.toFixed(2));
}

/**
 * Calculates the final score by combining continuous assessment and exam scores
 * based on their configured percentage weights
 * 
 * @param continuousAssessmentScore The combined score from class tests, assignments, etc.
 * @param examScore The final exam score
 * @param continuousAssessmentPercent The percentage weight for continuous assessment (e.g., 30)
 * @param examPercent The percentage weight for the exam (e.g., 70)
 * @returns The final calculated score
 */
export function calculateFinalScore(
  continuousAssessmentScore: number,
  examScore: number,
  continuousAssessmentPercent: number = 30,
  examPercent: number = 70
): number {
  // Ensure the percentages add up to 100
  const normalizedCAPercent = continuousAssessmentPercent;
  const normalizedExamPercent = examPercent;
  
  // Calculate the weighted scores
  const weightedCA = (continuousAssessmentScore * normalizedCAPercent) / 100;
  const weightedExam = (examScore * normalizedExamPercent) / 100;
  
  // Return the total rounded to 2 decimal places
  return parseFloat((weightedCA + weightedExam).toFixed(2));
}

/**
 * Combines multiple continuous assessment scores into a single score
 * and converts it to the specified percentage
 * 
 * @param scores Array of assessment scores
 * @param totalScores Array of total possible scores for each assessment
 * @param targetPercent The percentage to convert the combined score to (e.g., 30%)
 * @returns The converted combined score
 */
export function combineAndConvertContinuousAssessments(
  scores: number[],
  totalScores: number[],
  targetPercent: number = 30
): number {
  if (scores.length === 0 || scores.length !== totalScores.length) {
    return 0;
  }
  
  let totalStudentScore = 0;
  let totalPossibleScore = 0;
  
  // Sum up all scores
  for (let i = 0; i < scores.length; i++) {
    totalStudentScore += scores[i];
    totalPossibleScore += totalScores[i];
  }
  
  // Convert to target percentage
  return convertScore(totalStudentScore, totalPossibleScore, targetPercent);
}

/**
 * Gets the Ghanaian grade and remark based on a percentage score
 * 
 * @param score The percentage score (0-100)
 * @returns An object containing the grade and remark
 */
export function getGhanaianGrade(score: number): GradeInfo {
  // Ensure score is within valid range
  const validScore = Math.max(0, Math.min(100, score));
  
  if (validScore >= 80) {
    return { grade: "1", remark: "Excellent" };
  } else if (validScore >= 70) {
    return { grade: "2", remark: "Very Good" };
  } else if (validScore >= 60) {
    return { grade: "3", remark: "Good" };
  } else if (validScore >= 50) {
    return { grade: "4", remark: "Credit" };
  } else if (validScore >= 40) {
    return { grade: "5", remark: "Pass" };
  } else {
    return { grade: "6", remark: "Fail" };
  }
}

/**
 * Calculates class statistics for a set of scores
 * 
 * @param scores Array of student scores
 * @returns Object with class average, highest and lowest scores
 */
export function calculateClassStatistics(scores: number[]) {
  if (scores.length === 0) {
    return {
      average: 0,
      highest: 0,
      lowest: 0,
      passed: 0,
      failed: 0,
      passRate: 0
    };
  }
  
  const validScores = scores.filter(score => !isNaN(score));
  
  if (validScores.length === 0) {
    return {
      average: 0,
      highest: 0,
      lowest: 0,
      passed: 0,
      failed: 0,
      passRate: 0
    };
  }
  
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  const average = parseFloat((sum / validScores.length).toFixed(2));
  const highest = Math.max(...validScores);
  const lowest = Math.min(...validScores);
  
  // Count passed students (score >= 40)
  const passed = validScores.filter(score => score >= 40).length;
  const failed = validScores.length - passed;
  const passRate = parseFloat(((passed / validScores.length) * 100).toFixed(2));
  
  return {
    average,
    highest,
    lowest,
    passed,
    failed,
    passRate
  };
}

/**
 * Determines a student's position in class based on scores
 * 
 * @param studentScore The student's score
 * @param allScores Array of all student scores in the class
 * @returns The student's position (e.g., "1st", "2nd", "3rd", etc.)
 */
export function calculateStudentPosition(
  studentScore: number,
  allScores: number[]
): string {
  // Sort scores in descending order
  const sortedScores = [...allScores].sort((a, b) => b - a);
  
  // Find the position (index + 1 because position starts at 1 not 0)
  const position = sortedScores.indexOf(studentScore) + 1;
  
  // Get total number of students
  const totalStudents = allScores.length;
  
  // Format the position with the appropriate suffix
  let suffix;
  if (position % 10 === 1 && position % 100 !== 11) {
    suffix = "st";
  } else if (position % 10 === 2 && position % 100 !== 12) {
    suffix = "nd";
  } else if (position % 10 === 3 && position % 100 !== 13) {
    suffix = "rd";
  } else {
    suffix = "th";
  }
  
  return `${position}${suffix} out of ${totalStudents}`;
} 