import React from 'react'
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import GuardianList from '@/components/guardian/guardian-list';
import db from '@/lib/db';
import { eq } from 'drizzle-orm';
import { schools } from '@/lib/schema';

export const metadata = {
  title: 'Guardians',
  description: 'Manage guardians for your school',
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

const GuardianPage = async () => {
  const schoolId = await getSchoolId();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Guardians</h1>
      </div>
      
      <p className="text-muted-foreground">
        Manage guardians for students in your school.
      </p>
      
      <GuardianList schoolId={schoolId} />
    </div>
  )
}

export default GuardianPage;