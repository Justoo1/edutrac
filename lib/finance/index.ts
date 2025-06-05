// Test file to verify the queries work correctly
import { getStudentsWithFees, getStudentFeeDetails } from './queries';

// This is just a type check - don't run this in production
export const testQueries = async () => {
  try {
    // These functions should now compile without TypeScript errors
    const schoolId = "test-school-id";
    const studentId = "test-student-id";
    
    // Test function signatures
    const studentsWithFees = await getStudentsWithFees(schoolId);
    const studentDetails = await getStudentFeeDetails(studentId);
    
    console.log("Queries compiled successfully!");
    return { studentsWithFees, studentDetails };
  } catch (error) {
    console.error("Query test failed:", error);
    throw error;
  }
};

// Export the functions for use in your application
export * from './queries';
