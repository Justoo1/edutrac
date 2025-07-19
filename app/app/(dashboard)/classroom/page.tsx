import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusCircle, Users, Building2, GraduationCap, UserPlus, UserPlus2 } from 'lucide-react'
import { columns as classroomColumns } from './columns'
import { CreateClassroomDialog } from './create-classroom-dialog'
import { CreateBatchDialog } from './create-batch-dialog'
import { getClasses, getEnrollments, getBatches } from '@/lib/fetchers'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClassroomTable } from './classroom-table'
import { EnrollmentTable } from './enrollment-table'
import { EnrollStudentDialog } from './enroll-student-dialog'
import { BatchTable } from './batch-table'
import { AddStudentsToBatchDialog } from './add-students-to-batch-dialog'
import db from '@/lib/db'
import { eq } from 'drizzle-orm'
import { schools } from '@/lib/schema'

export const dynamic = 'force-dynamic';

const ClassRoomPage = async () => {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const classes = await getClasses()
  const enrollments = await getEnrollments()
  const batches = await getBatches()
  const school = await db.query.schools.findFirst({
    where: eq(schools.adminId, session.user.id),
  })

  if(!school) {
    redirect('/onboarding')
  }

  // Count unique students from enrollments
  const uniqueStudentIds = new Set(enrollments?.map((enrollment: { student: { id: string } }) => enrollment.student.id) || [])
  const totalStudents = uniqueStudentIds.size

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Classroom Management</h2>
        <div className="flex items-center space-x-2">
          <CreateClassroomDialog school={school}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Classroom
            </Button>
          </CreateClassroomDialog>
        </div>
      </div>
      <Tabs defaultValue="classrooms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classrooms">
            <Building2 className="mr-2 h-4 w-4" />
            Classrooms
          </TabsTrigger>
          <TabsTrigger value="enrollments">
            <Users className="mr-2 h-4 w-4" />
            Enrollments
          </TabsTrigger>
          <TabsTrigger value="batches">
            <GraduationCap className="mr-2 h-4 w-4" />
            Batches
          </TabsTrigger>
        </TabsList>
        <TabsContent value="classrooms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classes?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active classrooms in the system
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Enrolled students across all classrooms
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Classrooms</CardTitle>
              <CardDescription>
                Manage your school&apos;s classrooms and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClassroomTable data={classes || []} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="enrollments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Student Enrollments</h3>
            <EnrollStudentDialog school={school}>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll Student
              </Button>
            </EnrollStudentDialog>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollments</CardTitle>
              <CardDescription>
                Manage student enrollments across different classrooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnrollmentTable data={enrollments || []} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="batches" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Grade Level Batches</h3>
            <div className="flex space-x-2">
              <AddStudentsToBatchDialog school={school}>
                <Button variant="outline">
                  <UserPlus2 className="mr-2 h-4 w-4" />
                  Add Students to Batch
                </Button>
              </AddStudentsToBatchDialog>
              {/* <CreateBatchDialog school={school}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Batch
                </Button>
              </CreateBatchDialog> */}
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Grade Level Batches</CardTitle>
              <CardDescription>
                Add and manage students in grade level batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batches && batches.length > 0 ? (
                <BatchTable data={batches} school={school} />
              ) : (
                <p className="text-muted-foreground">No batches found. Create batches to manage students by grade level.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ClassRoomPage