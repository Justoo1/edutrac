import { unstable_cache } from "next/cache";
import db from "./db";
import { and, desc, eq, not, count } from "drizzle-orm";
import { schools, schoolContent, staff, students, classes } from "./schema";
import { serialize } from "next-mdx-remote/serialize";
import { replaceExamples, replaceTweets } from "@/lib/remark-plugins";

async function getMdxSource(postContents: string) {
  // transforms links like <link> to [link](link) as MDX doesn't support <link> syntax
  // https://mdxjs.com/docs/what-is-mdx/#markdown
  const content =
    postContents?.replaceAll(/<(https?:\/\/\S+)>/g, "[$1]($1)") ?? "";
  // Serialize the content string into MDX
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [replaceTweets, () => replaceExamples(db)],
    },
  });

  return mdxSource;
}

export async function getSchoolData(domain: string) {
  // The domain parameter is already the subdomain from the middleware
  // No need to check for .edutrac.com suffix since middleware handles that
  console.log("getSchoolData received domain:", domain);
  
  return await unstable_cache(
    async () => {
      return await db.query.schools.findFirst({
        where: eq(schools.subdomain, domain),
        with: {
          admin: true,
        },
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

export async function getContentBySlug(domain: string, slug: string) {
  const subdomain = domain.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)
    ? domain.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
    : null;

  return await unstable_cache(
    async () => {
      const data = await db
        .select({
          content: schoolContent,
          school: schools,
          author: {
            id: staff.id,
            name: staff.userId,
            image: staff.userId,
          },
        })
        .from(schoolContent)
        .leftJoin(schools, eq(schools.id, schoolContent.schoolId))
        .leftJoin(staff, eq(staff.id, schoolContent.authorId))
        .where(
          and(
            eq(schoolContent.slug, slug),
            eq(schoolContent.published, true),
            subdomain
              ? eq(schools.subdomain, subdomain)
              : eq(schools.customDomain, domain),
          ),
        )
        .then((res) =>
          res.length > 0
            ? {
                ...res[0].content,
                school: res[0].school,
                author: res[0].author,
              }
            : null,
        );

      if (!data) return null;

      const [mdxSource, relatedContent] = await Promise.all([
        getMdxSource(data.content!),
        db
          .select({
            id: schoolContent.id,
            title: schoolContent.title,
            description: schoolContent.description,
            slug: schoolContent.slug,
            image: schoolContent.image,
            imageBlurhash: schoolContent.imageBlurhash,
            contentType: schoolContent.contentType,
            publishDate: schoolContent.publishDate,
            createdAt: schoolContent.createdAt,
          })
          .from(schoolContent)
          .leftJoin(schools, eq(schools.id, schoolContent.schoolId))
          .where(
            and(
              eq(schoolContent.published, true),
              eq(schoolContent.contentType, data.contentType),
              not(eq(schoolContent.id, data.id)),
              subdomain
                ? eq(schools.subdomain, subdomain)
                : eq(schools.customDomain, domain),
            ),
          )
          .limit(3),
      ]);

      return {
        ...data,
        mdxSource,
        relatedContent,
      };
    },
    [`${domain}-${slug}`],
    {
      revalidate: 900,
      tags: [`${domain}-${slug}`],
    },
  )();
}

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