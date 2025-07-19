import { unstable_cache } from "next/cache";
import db from "./db";
import { and, desc, eq, not, count, asc } from "drizzle-orm";
import { schools, schoolContent, staff, students, classes, classEnrollments, batches, batchEnrollments, subjects, academicYears, academicTerms, periods } from "./schema";
import { serialize } from "next-mdx-remote/serialize";
import { getSession } from "@/lib/auth";

// async function getMdxSource(postContents: string) {
//   // transforms links like <link> to [link](link) as MDX doesn't support <link> syntax
//   // https://mdxjs.com/docs/what-is-mdx/#markdown
//   const content =
//     postContents?.replaceAll(/<(https?:\/\/\S+)>/g, "[$1]($1)") ?? "";
//   // Serialize the content string into MDX
//   const mdxSource = await serialize(content, {
//     mdxOptions: {
//       remarkPlugins: [replaceTweets, () => replaceExamples(db)],
//     },
//   });

//   return mdxSource;
// }

export async function getSchoolData(domain: string) {
  // The domain parameter is already the subdomain from the middleware
  // No need to check for .edutrac.com suffix since middleware handles that
  console.log("getSchoolData received domain:", domain);
  
  return await unstable_cache(
    async () => {
      return await db.query.schools.findFirst({
        where: eq(schools.subdomain, domain),
      });
    },
    [`${domain}-metadata`],
    {
      revalidate: 900,
      tags: [`${domain}-metadata`],
    },
  )();
}

export async function getSiteData(domain: string) {
  const subdomain = domain?.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)
    ? domain.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
    : null;

  return await unstable_cache(
    async () => {
      return await db.query.schools.findFirst({
        where: subdomain
          ? eq(schools.subdomain, subdomain)
          : eq(schools.customDomain, domain),
        columns: {
          name: true,
          message404: true,
        },
      });
    },
    [`${domain}-site-data`],
    {
      revalidate: 900,
      tags: [`${domain}-site-data`],
    },
  )();
}

export async function getContentForSchool(domain: string, contentType: string) {
  const subdomain = domain.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)
    ? domain.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
    : null;

  return await unstable_cache(
    async () => {
      return await db
        .select({
          id: schoolContent.id,
          title: schoolContent.title,
          description: schoolContent.description,
          slug: schoolContent.slug,
          image: schoolContent.image,
          imageBlurhash: schoolContent.imageBlurhash,
          publishDate: schoolContent.publishDate,
          createdAt: schoolContent.createdAt,
        })
        .from(schoolContent)
        .leftJoin(schools, eq(schoolContent.schoolId, schools.id))
        .where(
          and(
            eq(schoolContent.published, true),
            eq(schoolContent.contentType, contentType),
            subdomain
              ? eq(schools.subdomain, subdomain)
              : eq(schools.customDomain, domain),
          ),
        )
        .orderBy(desc(schoolContent.publishDate || schoolContent.createdAt));
    },
    [`${domain}-${contentType}`],
    {
      revalidate: 900,
      tags: [`${domain}-${contentType}`],
    },
  )();
}

// export async function getContentBySlug(domain: string, slug: string) {
//   const subdomain = domain.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)
//     ? domain.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
//     : null;

//   return await unstable_cache(
//     async () => {
//       const data = await db
//         .select({
//           content: schoolContent,
//           school: schools,
//           author: {
//             id: staff.id,
//             name: staff.userId,
//             image: staff.userId,
//           },
//         })
//         .from(schoolContent)
//         .leftJoin(schools, eq(schools.id, schoolContent.schoolId))
//         .leftJoin(staff, eq(staff.id, schoolContent.authorId))
//         .where(
//           and(
//             eq(schoolContent.slug, slug),
//             eq(schoolContent.published, true),
//             subdomain
//               ? eq(schools.subdomain, subdomain)
//               : eq(schools.customDomain, domain),
//           ),
//         )
//         .then((res) =>
//           res.length > 0
//             ? {
//                 ...res[0].content,
//                 school: res[0].school,
//                 author: res[0].author,
//               }
//             : null,
//         );

//       if (!data) return null;

//       const [mdxSource, relatedContent] = await Promise.all([
//         getMdxSource(data.content!),
//         db
//           .select({
//             id: schoolContent.id,
//             title: schoolContent.title,
//             description: schoolContent.description,
//             slug: schoolContent.slug,
//             image: schoolContent.image,
//             imageBlurhash: schoolContent.imageBlurhash,
//             contentType: schoolContent.contentType,
//             publishDate: schoolContent.publishDate,
//             createdAt: schoolContent.createdAt,
//           })
//           .from(schoolContent)
//           .leftJoin(schools, eq(schools.id, schoolContent.schoolId))
//           .where(
//             and(
//               eq(schoolContent.published, true),
//               eq(schoolContent.contentType, data.contentType),
//               not(eq(schoolContent.id, data.id)),
//               subdomain
//                 ? eq(schools.subdomain, subdomain)
//                 : eq(schools.customDomain, domain),
//             ),
//           )
//           .limit(3),
//       ]);

//       return {
//         ...data,
//         mdxSource,
//         relatedContent,
//       };
//     },
//     [`${domain}-${slug}`],
//     {
//       revalidate: 900,
//       tags: [`${domain}-${slug}`],
//     },
//   )();
// }

// For admin dashboard
export async function getStudentsForSchool(schoolId: string) {
  return await db.query.students.findMany({
    where: eq(students.schoolId, schoolId),
    orderBy: (students, { asc }) => [asc(students.firstName), asc(students.lastName)],
  });
}

export async function getStaffForSchool(schoolId: string) {
  return await db.query.staff.findMany({
    where: eq(staff.schoolId, schoolId),
    with: {
      user: true,
    },
    orderBy: (staff, { asc }) => asc(staff.position),
  });
}

export async function getClassesForSchool(schoolId: string) {
  return await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
    with: {
      classTeacher: true,
    },
    orderBy: (classes, { asc }) => [asc(classes.gradeLevel), asc(classes.name)],
  });
}

// Get student counts for dashboard
export async function getSchoolStats(schoolId: string) {
  const [studentCount, staffCount, classCount] = await Promise.all([
    db.select({ count: count() }).from(students).where(eq(students.schoolId, schoolId)),
    db.select({ count: count() }).from(staff).where(eq(staff.schoolId, schoolId)),
    db.select({ count: count() }).from(classes).where(eq(classes.schoolId, schoolId)),
  ]);

  return {
    studentCount: studentCount[0].count,
    staffCount: staffCount[0].count,
    classCount: classCount[0].count,
  };
}

// Get student data for a specific student
export async function getStudentData(studentId: string) {
  return await db.query.students.findFirst({
    where: eq(students.id, studentId),
    with: {
      school: true,
      enrollments: {
        with: {
          class: true,
        },
      },
    },
  });
}

// Get class data with enrolled students
export async function getClassWithStudents(classId: string) {
  return await db.query.classes.findFirst({
    where: eq(classes.id, classId),
    with: {
      classTeacher: {
        with: {
          user: true,
        },
      },
      enrollments: {
        with: {
          student: true,
        },
      },
    },
  });
}

// Get all classes with enrollments
export async function getClasses() {
  const session = await getSession()
  if (!session) {
    return []
  }

  try {
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    })

    if (!school) {
      return []
    }

    return await db.query.classes.findMany({
      where: eq(classes.schoolId, school.id),
      with: {
        enrollments: {
          with: {
            student: true,
          },
        },
      },
      orderBy: (classes, { asc }) => [asc(classes.name)],
    })
  } catch (error) {
    console.error("Error fetching classes:", error)
    return []
  }
}

// Get all enrollments for a school
export async function getEnrollments() {
  const session = await getSession()
  if (!session) {
    return null
  }

  try {
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    })

    if (!school) {
      return null
    }

    // Get all enrollments for the school using direct DB query
    return await db.query.classEnrollments.findMany({
      where: eq(classEnrollments.status, "active"),
      with: {
        student: true,
        class: true
      }
    }).then(enrollments => {
      // Filter to only include enrollments for this school's classes and students
      return enrollments.filter(enrollment => 
        enrollment.class?.schoolId === school.id && 
        enrollment.student?.schoolId === school.id
      )
    })
  } catch (error) {
    console.error("Error fetching enrollments:", error)
    return null
  }
}

export async function getBatches() {
  try {
    const session = await getSession();
    if (!session) return null;

    // Get school ID for current admin
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });

    if (!school) return null;

    // Get all batches for the school
    const batchesData = await db.query.batches.findMany({
      where: eq(batches.schoolId, school.id),
      orderBy: [desc(batches.createdAt)],
    });

    // Get student counts for each batch
    const batchesWithCounts = await Promise.all(
      batchesData.map(async (batch) => {
        const studentCount = await db.query.batchEnrollments.findMany({
          where: and(
            eq(batchEnrollments.batchId, batch.id),
            eq(batchEnrollments.status, "active")
          ),
        });

        return {
          ...batch,
          studentCount: studentCount.length,
          // Convert Date objects to strings to match the expected type
          createdAt: batch.createdAt.toISOString(),
          updatedAt: batch.updatedAt.toISOString()
        };
      })
    );

    return batchesWithCounts;
  } catch (error) {
    console.error("Error fetching batches:", error);
    return null;
  }
}

export async function getTeachers() {
  try {
    const session = await getSession();
    if (!session) return [];
    
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });
    
    if (!school) return [];
      
    const teachers = await db.query.staff.findMany({
      where: eq(staff.schoolId, school.id),
      with: {
        user: true,
        classesTaught: {
          with: {
            subject: true,
          },
        },
      },
    });
    if (!teachers) return [];
    
    return teachers;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}

export async function getSubjects() {
  return await db.query.subjects.findMany({
    columns: {
      id: true,
      name: true,
    },
  })
}

export async function getSubjectsForSchool(schoolId: string) {
  return await db.query.subjects.findMany({
    where: eq(subjects.schoolId, schoolId),
    columns: {
      id: true,
      name: true,
      code: true,
      isOptional: true,
      schoolId: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      courseId: true,
    },
  })
}

export async function getAcademicYear(schoolId: string) {
  try {
    return await db.query.academicYears.findFirst({
      where: eq(academicYears.schoolId, schoolId),
      orderBy: desc(academicYears.createdAt),
    });
  } catch (error) {
    console.error('Error fetching academic year:', error);
    return null;
  }
}

export async function getAcademicTerm(schoolId: string) {
  try {
    return await db.query.academicTerms.findFirst({
      where: eq(academicTerms.schoolId, schoolId),
      orderBy: desc(academicTerms.createdAt),
    });
  } catch (error) {
    console.error('Error fetching academic term:', error);
    return null;
  }
}

export async function getPeriods() {
  try {
    const session = await getSession();
    if (!session) return [];
    
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });
    
    if (!school) return [];
      
    const schoolPeriods = await db.query.periods.findMany({
      where: eq(periods.schoolId, school.id),
      orderBy: asc(periods.orderIndex),
    });

    // If no periods exist for the school, create default ones
    if (schoolPeriods.length === 0) {
      const defaultPeriods = [
        { time: '7:30 - 8:30', label: 'Period 1', type: 'class', orderIndex: 0 },
        { time: '8:30 - 9:30', label: 'Period 2', type: 'class', orderIndex: 1 },
        { time: '9:30 - 10:30', label: 'Period 3', type: 'class', orderIndex: 2 },
        { time: '10:30 - 11:00', label: 'Break', type: 'break', orderIndex: 3 },
        { time: '11:00 - 12:00', label: 'Period 4', type: 'class', orderIndex: 4 },
        { time: '12:00 - 13:00', label: 'Break', type: 'break', orderIndex: 5 },
        { time: '13:00 - 14:00', label: 'Period 6', type: 'class', orderIndex: 6 },
        { time: '14:00 - 15:00', label: 'Period 7', type: 'class', orderIndex: 7 },
        { time: '15:00 - 16:00', label: 'Period 8', type: 'class', orderIndex: 8 },
        { time: '16:00 - 17:00', label: 'Period 9', type: 'class', orderIndex: 9 }
      ];

      // Insert default periods
      await Promise.all(
        defaultPeriods.map(period =>
          db.insert(periods).values({
            ...period,
            schoolId: school.id,
          })
        )
      );

      // Return the newly created default periods
      return await db.query.periods.findMany({
        where: eq(periods.schoolId, school.id),
        orderBy: asc(periods.orderIndex),
      });
    }

    return schoolPeriods;
  } catch (error) {
    console.error('Error fetching periods:', error);
    return [];
  }
}
