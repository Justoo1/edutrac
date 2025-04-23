import React from 'react'
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import GuardianEditForm from '@/components/guardian/guardian-edit-form';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { eq } from 'drizzle-orm';
import { schools, guardians } from '@/lib/schema';

export const metadata = {
  title: 'Edit Guardian',
  description: 'Edit guardian information',
};

async function getSchoolId() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  // For admin users, we need to get their associated school
  if (session.user.role === 'admin') {
    // Query the school where adminId equals the current user's id
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id)
    });
    
    if (school) {
      return school.id;
    }
  }
  
  // If we can't determine the school, redirect to dashboard
  redirect('/dashboard');
}

async function getGuardian(id: string, schoolId: string) {
  try {
    // Make a direct database query instead of using fetch
    const guardian = await db.query.guardians.findFirst({
      where: eq(guardians.id, id),
      with: {
        guardianStudents: {
          with: {
            student: true
          }
        }
      }
    });
    
    if (!guardian) {
      return null;
    }
    
    // Check if any of the guardian's students belong to this school
    const studentBelongsToSchool = guardian.guardianStudents.some(
      gs => gs.student.schoolId === schoolId
    );
    
    if (!studentBelongsToSchool) {
      console.warn(`Guardian (${id}) does not have students in school (${schoolId})`);
      return null;
    }
    
    // Format the guardian data to match the expected structure
    const formattedGuardian = {
      ...guardian,
      studentIds: guardian.guardianStudents.map(gs => gs.student.id),
      primaryStudentIds: guardian.guardianStudents
        .filter(gs => gs.isPrimary)
        .map(gs => gs.student.id),
      schoolId // Add schoolId for convenience
    };
    
    return formattedGuardian;
  } catch (error) {
    console.error("Error fetching guardian:", error);
    return null;
  }
}

const GuardianEditPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const schoolId = await getSchoolId();
  const guardian = await getGuardian(id, schoolId);
  
  if (!guardian) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Edit Guardian</h1>
      </div>
      
      <p className="text-muted-foreground">
        Update information for {guardian.firstName} {guardian.lastName}.
      </p>
      
      <GuardianEditForm 
        guardianId={id} 
        schoolId={schoolId} 
        initialData={guardian} 
      />
    </div>
  )
}

export default GuardianEditPage