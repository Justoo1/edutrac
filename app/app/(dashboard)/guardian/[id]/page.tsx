import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { guardians, guardianStudents, students, schools } from '@/lib/schema';
import { eq } from 'drizzle-orm';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PhoneCall,
  Mail,
  Pencil,
  Users,
  Clock,
  Briefcase,
  Home,
  AlertCircle,
  UserCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export const metadata = {
  title: 'Guardian Details',
  description: 'View and manage guardian information',
};

async function getGuardianData(id: string) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  // Fetch guardian data
  const guardian = await db.query.guardians.findFirst({
    where: eq(guardians.id, id),
  });

  if (!guardian) {
    redirect('/guardian');
  }

  // Get associated students
  const relations = await db.query.guardianStudents.findMany({
    where: eq(guardianStudents.guardianId, id),
    with: {
      student: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          studentId: true,
          schoolId: true,
          dateOfBirth: true,
          gender: true,
          status: true
        },
        with: {
          batchEnrollments: {
            columns: {
              id: true
            },
            with: {
              batch: {
                columns: {
                  id: true,
                  name: true,
                  gradeLevel: true
                }
              }
            }
          }
        },
      },
    },
  });

  if (relations.length === 0) {
    redirect('/guardian');
  }

  // Get the school ID of the first student to check permissions
  const schoolId = relations[0].student.schoolId;

  if (!schoolId) {
    redirect('/guardian');
  }

  // Verify that the user has permission for this school
  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
  });

  if (!school || school.adminId !== session.user.id) {
    redirect('/dashboard');
  }

  // Extract student information
  const studentsData = relations.map(relation => ({
    ...relation.student,
    isPrimary: relation.isPrimary,
  }));

  // Check if guardian has a user account
  const hasUserAccount = !!guardian.userId;

  return {
    ...guardian,
    students: studentsData,
    hasUserAccount,
    schoolId,
  };
}

const GuardianDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const guardian = await getGuardianData(id);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{guardian.firstName} {guardian.lastName}</h1>
          <p className="text-muted-foreground">
            Guardian details and information
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/guardian/edit/${id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/messages/new?recipient=${id}&type=guardian`}>
              <Mail className="mr-2 h-4 w-4" />
              Message
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primary Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <UserCircle className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{guardian.relationship}</p>
                <p className="text-xs text-muted-foreground">Relationship</p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{guardian.email}</p>
                <p className="text-xs text-muted-foreground">Email</p>
              </div>
            </div>
            <div className="flex items-center">
              <PhoneCall className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{guardian.phone}</p>
                <p className="text-xs text-muted-foreground">Phone</p>
              </div>
            </div>
            {guardian.alternativePhone && (
              <div className="flex items-center">
                <PhoneCall className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{guardian.alternativePhone}</p>
                  <p className="text-xs text-muted-foreground">Alternative Phone</p>
                </div>
              </div>
            )}
            {guardian.address && (
              <div className="flex items-start">
                <Home className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium whitespace-pre-wrap">{guardian.address}</p>
                  <p className="text-xs text-muted-foreground">Address</p>
                </div>
              </div>
            )}
            {guardian.occupation && (
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{guardian.occupation}</p>
                  <p className="text-xs text-muted-foreground">Occupation</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Guardian Details</CardTitle>
            <CardDescription>Additional information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{format(new Date(guardian.createdAt), 'PPP')}</p>
                <p className="text-xs text-muted-foreground">Registered Date</p>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{guardian.students.length} student{guardian.students.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Associated Students</p>
              </div>
            </div>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{guardian.emergencyContact ? 'Yes' : 'No'}</p>
                <p className="text-xs text-muted-foreground">Emergency Contact</p>
              </div>
            </div>
            <div className="flex items-center">
              <UserCircle className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{guardian.hasUserAccount ? 'Yes' : 'No'}</p>
                <p className="text-xs text-muted-foreground">User Account</p>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant={guardian.status === 'active' ? 'default' : 'secondary'}>
                {guardian.status.charAt(0).toUpperCase() + guardian.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional notes about the guardian</CardDescription>
          </CardHeader>
          <CardContent>
            {guardian.notes ? (
              <p className="text-sm whitespace-pre-wrap">{guardian.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students Tab */}
      <Tabs defaultValue="students" className="w-full">
        <TabsList>
          <TabsTrigger value="students">Associated Students</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>Students associated with this guardian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Grade Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Primary</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {guardian.students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-4 py-3 text-sm">{student.studentId}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm">{student.batchEnrollments[0]?.batch?.gradeLevel || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {(student.status || 'unknown').charAt(0).toUpperCase() + (student.status || 'unknown').slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {student.isPrimary ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Primary
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Secondary</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/students/${student.id}`}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuardianDetailPage;