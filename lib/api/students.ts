/**
 * Get all students that are not enrolled in any batch for a specific school
 */
export async function getUnenrolledStudentsBySchool(schoolId: string): Promise<any> {
  const response = await fetch(`/api/schools/${schoolId}/unenrolled-students`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch unenrolled students");
  }

  return response.json();
} 