"use server";

import { getSession } from "@/lib/auth";
import {
  addDomainToVercel,
  removeDomainFromVercelProject,
  validDomainRegex,
} from "@/lib/domains";
import { getBlurDataURL } from "@/lib/utils";
import { put } from "@vercel/blob";
import { eq, and, count, or } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { revalidateTag } from "next/cache";
import { withSchoolAuth, withStudentAuth, withStaffAuth, withClassAuth } from "./auth";
import db from "./db";
import { 
  schools, 
  schoolContent, 
  staff, 
  students, 
  classes, 
  classEnrollments, 
  subjects, 
  classSubjects, 
  attendance, 
  feeTypes, 
  feePayments, 
  users, 
  academicYears
} from "./schema";
import { 
  SelectSchool, 
  SelectSchoolContent, 
  SelectStudent, 
  SelectStaff, 
  SelectClass, 
  SelectSubject,
  SelectFeeType,
  SelectFeePayment 
} from "./schema";
import { hash } from "bcryptjs";
import { e } from "@vercel/blob/dist/put-96a1f07e";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7,
); // 7-character random string

// School CRUD operations
export const createSchool = async (formData: FormData) => {
  const session = await getSession();
  if (!session?.user.id) {
    return {
      error: "Not authenticated",
    };
  }
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const subdomain = formData.get("subdomain") as string;
  const schoolCode = formData.get("schoolCode") as string;
  const schoolType = formData.get("schoolType") as string;
  const region = formData.get("region") as string;
  const district = formData.get("district") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const establishedYear = parseInt(formData.get("establishedYear") as string) || null;

  try {
    const [response] = await db
      .insert(schools)
      .values({
        name,
        description,
        subdomain,
        schoolCode,
        schoolType,
        region,
        district,
        address,
        phone,
        email,
        establishedYear,
        adminId: session.user.id,
      })
      .returning();

    revalidateTag(
      `${subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-metadata`,
    );
    return response;
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        error: `This subdomain or school code is already taken`,
      };
    } else {
      return {
        error: error.message,
      };
    }
  }
};

export const updateSchool = withSchoolAuth(
  async (formData: FormData, school: SelectSchool, key: string) => {
    const value = formData.get(key) as string;
    console.log(school)
    try {
      let response;

      if (key === "customDomain") {
        if (value.includes("edutrac.com")) {
          return {
            error: "Cannot use edutrac.com subdomain as your custom domain",
          };

          // if the custom domain is valid, we need to add it to Vercel
        } else if (validDomainRegex.test(value)) {
          response = await db
            .update(schools)
            .set({
              customDomain: value,
            })
            .where(eq(schools.id, school.id))
            .returning()
            .then((res) => res[0]);

          await Promise.all([
            addDomainToVercel(value),
            // Optional: add www subdomain as well and redirect to apex domain
            addDomainToVercel(`www.${value}`),
          ]);

          // empty value means the user wants to remove the custom domain
        } else if (value === "") {
          response = await db
            .update(schools)
            .set({
              customDomain: null,
            })
            .where(eq(schools.id, school.id))
            .returning()
            .then((res) => res[0]);
        }

        // if the school had a different customDomain before, we need to remove it from Vercel
        if (school.customDomain && school.customDomain !== value) {
          response = await removeDomainFromVercelProject(school.customDomain);
        }
      } else if (key === "image" || key === "logo") {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          return {
            error:
              "Missing BLOB_READ_WRITE_TOKEN token. Note: Vercel Blob is currently in beta – please fill out this form for access: https://tally.so/r/nPDMNd",
          };
        }

        const file = formData.get(key) as File;
        const filename = `${nanoid()}.${file.type.split("/")[1]}`;

        const { url } = await put(filename, file, {
          access: "public",
        });

        const blurhash = key === "image" ? await getBlurDataURL(url) : null;

        response = await db
          .update(schools)
          .set({
            [key]: url,
            ...(blurhash && { imageBlurhash: blurhash }),
          })
          .where(eq(schools.id, school.id))
          .returning()
          .then((res) => res[0]);
      } else if (key === "establishedYear") {
        response = await db
          .update(schools)
          .set({
            [key]: parseInt(value) || null,
          })
          .where(eq(schools.id, school.id))
          .returning()
          .then((res) => res[0]);
      } else {
        response = await db
          .update(schools)
          .set({
            [key]: value,
          })
          .where(eq(schools.id, school.id))
          .returning()
          .then((res) => res[0]);
      }

      console.log(
        "Updated school data! Revalidating tags: ",
        `${school.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-metadata`,
        `${school.customDomain}-metadata`,
      );
      revalidateTag(
        `${school.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-metadata`,
      );
      school.customDomain && revalidateTag(`${school.customDomain}-metadata`);

      return response;
    } catch (error: any) {
      if (error.code === "P2002") {
        return {
          error: `This ${key} is already taken`,
        };
      } else {
        return {
          error: error.message,
        };
      }
    }
  },
);

export const deleteSchool = withSchoolAuth(
  async (_: FormData, school: SelectSchool) => {
    try {
      const [response] = await db
        .delete(schools)
        .where(eq(schools.id, school.id))
        .returning();

      revalidateTag(
        `${school.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-metadata`,
      );
      response.customDomain && revalidateTag(`${response.customDomain}-metadata`);
      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  },
);

// School Content CRUD operations
export const createSchoolContent = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const session = await getSession();
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const contentType = formData.get("contentType") as string;
    const content = formData.get("content") as string;
    const publishDate = formData.get("publishDate") 
      ? new Date(formData.get("publishDate") as string)
      : new Date();
    const published = formData.get("published") === "true";

    try {
      const [response] = await db
        .insert(schoolContent)
        .values({
          title,
          description,
          content,
          contentType,
          publishDate,
          published,
          schoolId: school.id,
          authorId: session.user.id,
        })
        .returning();

      revalidateTag(
        `${school.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-${contentType}`,
      );
      school.customDomain && revalidateTag(`${school.customDomain}-${contentType}`);

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const updateSchoolContent = async (data: SelectSchoolContent) => {
  const session = await getSession();
  if (!session?.user.id) {
    return {
      error: "Not authenticated",
    };
  }

  const content = await db.query.schoolContent.findFirst({
    where: eq(schoolContent.id, data.id),
    with: {
      school: true,
    },
  });

  if (!content || content.authorId !== session.user.id) {
    return {
      error: "Content not found",
    };
  }

  try {
    const [response] = await db
      .update(schoolContent)
      .set({
        title: data.title,
        description: data.description,
        content: data.content,
        publishDate: data.publishDate,
        published: data.published,
      })
      .where(eq(schoolContent.id, data.id))
      .returning();

    revalidateTag(
      `${content.school?.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-${content.contentType}`,
    );
    revalidateTag(
      `${content.school?.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-${content.slug}`,
    );

    // if the school has a custom domain, we need to revalidate those tags too
    content.school?.customDomain &&
      (revalidateTag(`${content.school?.customDomain}-${content.contentType}`),
      revalidateTag(`${content.school?.customDomain}-${content.slug}`));

    return response;
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};

export const updateSchoolContentMetadata = async (
  formData: FormData,
  contentId: string,
  key: string,
) => {
  const session = await getSession();
  if (!session?.user.id) {
    return {
      error: "Not authenticated",
    };
  }

  const content = await db.query.schoolContent.findFirst({
    where: eq(schoolContent.id, contentId),
    with: {
      school: true,
    },
  });

  if (!content || content.authorId !== session.user.id) {
    return {
      error: "Content not found",
    };
  }

  const value = formData.get(key) as string;

  try {
    let response;
    if (key === "image") {
      const file = formData.get("image") as File;
      const filename = `${nanoid()}.${file.type.split("/")[1]}`;

      const { url } = await put(filename, file, {
        access: "public",
      });

      const blurhash = await getBlurDataURL(url);
      response = await db
        .update(schoolContent)
        .set({
          image: url,
          imageBlurhash: blurhash,
        })
        .where(eq(schoolContent.id, contentId))
        .returning()
        .then((res) => res[0]);
    } else if (key === "publishDate") {
      response = await db
        .update(schoolContent)
        .set({
          publishDate: new Date(value),
        })
        .where(eq(schoolContent.id, contentId))
        .returning()
        .then((res) => res[0]);
    } else {
      response = await db
        .update(schoolContent)
        .set({
          [key]: key === "published" ? value === "true" : value,
        })
        .where(eq(schoolContent.id, contentId))
        .returning()
        .then((res) => res[0]);
    }

    revalidateTag(
      `${content.school?.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-${content.contentType}`,
    );
    revalidateTag(
      `${content.school?.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-${content.slug}`,
    );

    content.school?.customDomain &&
      (revalidateTag(`${content.school?.customDomain}-${content.contentType}`),
      revalidateTag(`${content.school?.customDomain}-${content.slug}`));

    return response;
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        error: `This slug is already in use`,
      };
    } else {
      return {
        error: error.message,
      };
    }
  }
};

export const deleteSchoolContent = async (
  _: FormData,
  contentId: string,
) => {
  const session = await getSession();
  if (!session?.user.id) {
    return {
      error: "Not authenticated",
    };
  }

  const content = await db.query.schoolContent.findFirst({
    where: eq(schoolContent.id, contentId),
    with: {
      school: true,
    },
  });

  if (!content || content.authorId !== session.user.id) {
    return {
      error: "Content not found",
    };
  }

  try {
    const [response] = await db
      .delete(schoolContent)
      .where(eq(schoolContent.id, contentId))
      .returning({
        schoolId: schoolContent.schoolId,
        contentType: schoolContent.contentType,
        slug: schoolContent.slug,
      });

    // Revalidate appropriate tags
    if (content.school) {
      revalidateTag(
        `${content.school.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-${content.contentType}`,
      );
      revalidateTag(
        `${content.school.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}-${content.slug}`,
      );

      content.school.customDomain &&
        (revalidateTag(`${content.school.customDomain}-${content.contentType}`),
        revalidateTag(`${content.school.customDomain}-${content.slug}`));
    }

    return response;
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};

// Staff CRUD operations
export const createStaffMember = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const userId = formData.get("userId") as string;
    const staffId = formData.get("staffId") as string;
    const position = formData.get("position") as string;
    const department = formData.get("department") as string;
    const qualification = formData.get("qualification") as string;
    const joinedDate = formData.get("joinedDate") 
      ? new Date(formData.get("joinedDate") as string) 
      : new Date();
    const status = formData.get("status") as string || "active";
    const contactInfo = formData.get("contactInfo") 
      ? JSON.parse(formData.get("contactInfo") as string) 
      : {};

    try {
      const [response] = await db
        .insert(staff)
        .values({
          userId,
          schoolId: school.id,
          staffId,
          position,
          department,
          qualification,
          joinedDate,
          status,
          contactInfo,
        })
        .returning();

      return response;
    } catch (error: any) {
      if (error.code === "P2002") {
        return {
          error: `This staff ID is already in use`,
        };
      } else {
        return {
          error: error.message,
        };
      }
    }
  }
);

export const updateStaffMember = withStaffAuth(
  async (formData: FormData, staffMember: SelectStaff, key: string) => {
    const value = formData.get(key) as string;

    try {
      let response;

      if (key === "joinedDate") {
        response = await db
          .update(staff)
          .set({
            joinedDate: new Date(value),
          })
          .where(eq(staff.id, staffMember.id))
          .returning()
          .then((res) => res[0]);
      } else if (key === "contactInfo") {
        response = await db
          .update(staff)
          .set({
            contactInfo: JSON.parse(value),
          })
          .where(eq(staff.id, staffMember.id))
          .returning()
          .then((res) => res[0]);
      } else {
        response = await db
          .update(staff)
          .set({
            [key]: value,
          })
          .where(eq(staff.id, staffMember.id))
          .returning()
          .then((res) => res[0]);
      }

      return response;
    } catch (error: any) {
      if (error.code === "P2002") {
        return {
          error: `This ${key} is already in use`,
        };
      } else {
        return {
          error: error.message,
        };
      }
    }
  }
);

export const deleteStaffMember = withStaffAuth(
  async (_: FormData, staffMember: SelectStaff) => {
    try {
      const [response] = await db
        .delete(staff)
        .where(eq(staff.id, staffMember.id))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

// Student CRUD operations
export const createStudent = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const userId = formData.get("userId") as string || null; // Optional user account
    const studentId = formData.get("studentId") as string;
    const firstName = formData.get("firstName") as string;
    const middleName = formData.get("middleName") as string || null;
    const lastName = formData.get("lastName") as string;
    const dateOfBirth = formData.get("dateOfBirth")
      ? new Date(formData.get("dateOfBirth") as string)
      : null;
    const gender = formData.get("gender") as string;
    const enrollmentDate = formData.get("enrollmentDate")
      ? new Date(formData.get("enrollmentDate") as string)
      : new Date();
    const currentGradeLevel = formData.get("currentGradeLevel") as string;
    const status = formData.get("status") as string || "active";
    const guardian = formData.get("guardian")
      ? JSON.parse(formData.get("guardian") as string)
      : {};
    const contactInfo = formData.get("contactInfo")
      ? JSON.parse(formData.get("contactInfo") as string)
      : {};
    const healthInfo = formData.get("healthInfo")
      ? JSON.parse(formData.get("healthInfo") as string)
      : {};

    try {
      // Check if this student ID already exists for this school
      const existingStudent = await db.query.students.findFirst({
        where: and(
          eq(students.studentId, studentId),
          eq(students.schoolId, school.id)
        ),
      });

      if (existingStudent) {
        return {
          error: "This student ID is already in use",
        };
      }

      const [response] = await db
        .insert(students)
        .values({
          userId,
          schoolId: school.id,
          studentId,
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          gender,
          enrollmentDate,
          status,
          guardian,
          contactInfo,
          healthInfo,
        })
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const updateStudent = withStudentAuth(
  async (formData: FormData, student: SelectStudent, key: string) => {
    const value = formData.get(key) as string;

    try {
      let response;

      if (key === "dateOfBirth" || key === "enrollmentDate") {
        response = await db
          .update(students)
          .set({
            [key]: new Date(value),
          })
          .where(eq(students.id, student.id))
          .returning()
          .then((res) => res[0]);
      } else if (key === "guardian" || key === "contactInfo" || key === "healthInfo") {
        response = await db
          .update(students)
          .set({
            [key]: JSON.parse(value),
          })
          .where(eq(students.id, student.id))
          .returning()
          .then((res) => res[0]);
      } else {
        response = await db
          .update(students)
          .set({
            [key]: value,
          })
          .where(eq(students.id, student.id))
          .returning()
          .then((res) => res[0]);
      }

      return response;
    } catch (error: any) {
      if (error.code === "P2002") {
        return {
          error: `This ${key} is already in use`,
        };
      } else {
        return {
          error: error.message,
        };
      }
    }
  }
);

export const deleteStudent = withStudentAuth(
  async (_: FormData, student: SelectStudent) => {
    try {
      const [response] = await db
        .delete(students)
        .where(eq(students.id, student.id))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

// Classroom management
export const createClass = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const name = formData.get("name") as string;
    const gradeLevel = formData.get("gradeLevel") as string;
    const academicYear = formData.get("academicYear") as string;
    const capacity = parseInt(formData.get("capacity") as string);
    const room = formData.get("room") as string;
    const classTeacherId = formData.get("classTeacherId") as string || null;
    try {
      const [response] = await db
        .insert(classes)
        .values({
          schoolId: school.id,
          name,
          gradeLevel,
          academicYear,
          capacity,
          room,
          classTeacherId,
        })
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const updateClass = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const gradeLevel = formData.get("gradeLevel") as string;
    const academicYear = formData.get("academicYear") as string;
    const capacity = parseInt(formData.get("capacity") as string);
    const room = formData.get("room") as string;
    const classTeacherId = formData.get("classTeacherId") as string || null;

    try {
      // Verify that the class belongs to this school
      const existingClass = await db.query.classes.findFirst({
        where: and(
          eq(classes.id, id),
          eq(classes.schoolId, school.id)
        ),
      });

      if (!existingClass) {
        return {
          error: "Class not found in this school",
        };
      }

      const [response] = await db
        .update(classes)
        .set({
          name,
          gradeLevel,
          academicYear,
          capacity,
          room,
          classTeacherId,
        })
        .where(eq(classes.id, id))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const deleteClass = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const id = formData.get("id") as string;

    try {
      // Verify that the class belongs to this school
      const existingClass = await db.query.classes.findFirst({
        where: and(
          eq(classes.id, id),
          eq(classes.schoolId, school.id)
        ),
      });

      if (!existingClass) {
        return {
          error: "Class not found in this school",
        };
      }

      // Delete all enrollments first
      await db
        .delete(classEnrollments)
        .where(eq(classEnrollments.classId, id));

      // Delete the class
      await db
        .delete(classes)
        .where(eq(classes.id, id));

      return { success: true };
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

// Class enrollment
export const enrollStudent = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const classId = formData.get("classId") as string;
    const studentId = formData.get("studentId") as string;
    const enrollmentDate = formData.get("enrollmentDate")
      ? new Date(formData.get("enrollmentDate") as string)
      : new Date();
    const status = formData.get("status") as string || "active";

    try {
      // Verify that the class and student belong to this school
      const classData = await db.query.classes.findFirst({
        where: and(
          eq(classes.id, classId),
          eq(classes.schoolId, school.id)
        ),
      });

      const studentData = await db.query.students.findFirst({
        where: and(
          eq(students.id, studentId),
          eq(students.schoolId, school.id)
        ),
      });

      if (!classData || !studentData) {
        return {
          error: "Class or student not found in this school",
        };
      }

      // Check if the student is already enrolled in this class
      const existingEnrollment = await db.query.classEnrollments.findFirst({
        where: and(
          eq(classEnrollments.classId, classId),
          eq(classEnrollments.studentId, studentId)
        ),
      });

      if (existingEnrollment) {
        return {
          error: "Student is already enrolled in this class",
        };
      }

      const [response] = await db
        .insert(classEnrollments)
        .values({
          classId,
          studentId,
          enrollmentDate,
          status,
        })
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const updateEnrollment = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const enrollmentId = formData.get("enrollmentId") as string;
    const status = formData.get("status") as string;

    try {
      // Verify that the enrollment belongs to a class and student of this school
      const enrollment = await db.query.classEnrollments.findFirst({
        where: eq(classEnrollments.id, enrollmentId),
        with: {
          class: true,
          student: true,
        },
      });

      if (!enrollment || enrollment.class.schoolId !== school.id || enrollment.student.schoolId !== school.id) {
        return {
          error: "Enrollment not found or doesn't belong to this school",
        };
      }

      const [response] = await db
        .update(classEnrollments)
        .set({
          status,
        })
        .where(eq(classEnrollments.id, enrollmentId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const removeEnrollment = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const enrollmentId = formData.get("enrollmentId") as string;

    try {
      // Verify that the enrollment belongs to a class and student of this school
      const enrollment = await db.query.classEnrollments.findFirst({
        where: eq(classEnrollments.id, enrollmentId),
        with: {
          class: true,
          student: true,
        },
      });

      if (!enrollment || enrollment.class.schoolId !== school.id || enrollment.student.schoolId !== school.id) {
        return {
          error: "Enrollment not found or doesn't belong to this school",
        };
      }

      const [response] = await db
        .delete(classEnrollments)
        .where(eq(classEnrollments.id, enrollmentId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

// Attendance tracking
export const recordAttendance = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const studentId = formData.get("studentId") as string;
    const classId = formData.get("classId") as string;
    const date = formData.get("date")
      ? new Date(formData.get("date") as string)
      : new Date();
    const status = formData.get("status") as string;
    const notes = formData.get("notes") as string || null;
    const recordedBy = formData.get("recordedBy") as string;

    try {
      // Verify that the class, student, and staff member belong to this school
      const classData = await db.query.classes.findFirst({
        where: and(
          eq(classes.id, classId),
          eq(classes.schoolId, school.id)
        ),
      });

      const studentData = await db.query.students.findFirst({
        where: and(
          eq(students.id, studentId),
          eq(students.schoolId, school.id)
        ),
      });
      const academicYearData = await db.query.academicYears.findFirst({
        where: and(
          eq(academicYears.schoolId, school.id),
          eq(academicYears.isCurrent, true)
        ),
      });

      const staffMember = await db.query.staff.findFirst({
        where: and(
          eq(staff.id, recordedBy),
          eq(staff.schoolId, school.id)
        ),
      });

      if (!classData || !studentData || !staffMember || !academicYearData) {
        return {
          error: "Class, student, academic year or staff member not found in this school",
        };
      }

      // Check if an attendance record already exists for this student on this date for this class
      const existingAttendance = await db.query.attendance.findFirst({
        where: and(
          eq(attendance.studentId, studentId),
          eq(attendance.classId, classId),
          eq(attendance.date, date)
        ),
      });

      let response;
      if (existingAttendance) {
        // Update existing attendance record
        [response] = await db
          .update(attendance)
          .set({
            status,
            notes,
            recordedBy,
          })
          .where(eq(attendance.id, existingAttendance.id))
          .returning();
      } else {
        // Create new attendance record
        [response] = await db
          .insert(attendance)
          .values({
            studentId,
            schoolId: school.id,
            academicYearId: academicYearData!.id!,
            classId,
            date,
            status,
            notes,
            recordedBy,
          })
          .returning();
      }

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const getAttendanceByDate = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const classId = formData.get("classId") as string;
    const date = formData.get("date")
      ? new Date(formData.get("date") as string)
      : new Date();

    try {
      // Verify that the class belongs to this school
      const classData = await db.query.classes.findFirst({
        where: and(
          eq(classes.id, classId),
          eq(classes.schoolId, school.id)
        ),
      });

      if (!classData) {
        return {
          error: "Class not found in this school",
        };
      }

      // Get all students enrolled in this class
      const enrollments = await db.query.classEnrollments.findMany({
        where: and(
          eq(classEnrollments.classId, classId),
          eq(classEnrollments.status, "active")
        ),
        with: {
          student: true,
        },
      });

      // Get attendance records for this class on this date
      const attendanceRecords = await db.query.attendance.findMany({
        where: and(
          eq(attendance.classId, classId),
          eq(attendance.date, date)
        ),
      });

      // Map attendance records to students
      const studentsWithAttendance = enrollments.map(enrollment => {
        const attendanceRecord = attendanceRecords.find(record => 
          record.studentId === enrollment.studentId
        );

        return {
          student: enrollment.student,
          attendance: attendanceRecord || null,
        };
      });

      return studentsWithAttendance;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

// Subject management
export const createSubject = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const name = formData.get("name") as string;
    const code = formData.get("code") as string || null;
    const description = formData.get("description") as string || null;
    const gradeLevel = formData.get("gradeLevel") as string || null;

    try {
      const [response] = await db
        .insert(subjects)
        .values({
          schoolId: school.id,
          name,
          code,
          description,
        })
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const updateSubject = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const subjectId = formData.get("subjectId") as string;
    const name = formData.get("name") as string;
    const code = formData.get("code") as string || null;
    const description = formData.get("description") as string || null;
    const gradeLevel = formData.get("gradeLevel") as string || null;

    try {
      // Verify that the subject belongs to this school
      const subject = await db.query.subjects.findFirst({
        where: and(
          eq(subjects.id, subjectId),
          eq(subjects.schoolId, school.id)
        ),
      });

      if (!subject) {
        return {
          error: "Subject not found in this school",
        };
      }

      const [response] = await db
        .update(subjects)
        .set({
          name,
          code,
          description,
        })
        .where(eq(subjects.id, subjectId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const deleteSubject = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const subjectId = formData.get("subjectId") as string;

    try {
      // Verify that the subject belongs to this school
      const subject = await db.query.subjects.findFirst({
        where: and(
          eq(subjects.id, subjectId),
          eq(subjects.schoolId, school.id)
        ),
      });

      if (!subject) {
        return {
          error: "Subject not found in this school",
        };
      }

      const [response] = await db
        .delete(subjects)
        .where(eq(subjects.id, subjectId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

// Class subjects assignment
export const assignSubjectToClass = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const classId = formData.get("classId") as string;
    const subjectId = formData.get("subjectId") as string;
    const teacherId = formData.get("teacherId") as string || null;
    const academicYear = formData.get("academicYear") as string;
    const term = formData.get("term") as string;
    const schedule = formData.get("schedule")
      ? JSON.parse(formData.get("schedule") as string)
      : null;

    try {
      // Verify that the class and subject belong to this school
      const classData = await db.query.classes.findFirst({
        where: and(
          eq(classes.id, classId),
          eq(classes.schoolId, school.id)
        ),
      });

      const subjectData = await db.query.subjects.findFirst({
        where: and(
          eq(subjects.id, subjectId),
          eq(subjects.schoolId, school.id)
        ),
      });

      if (!classData || !subjectData) {
        return {
          error: "Class or subject not found in this school",
        };
      }

      // If teacher is specified, verify they belong to this school
      if (teacherId) {
        const teacherData = await db.query.staff.findFirst({
          where: and(
            eq(staff.id, teacherId),
            eq(staff.schoolId, school.id)
          ),
        });

        if (!teacherData) {
          return {
            error: "Teacher not found in this school",
          };
        }
      }

      // Check if this subject is already assigned to this class for this term and academic year
      const existingAssignment = await db.query.classSubjects.findFirst({
        where: and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.subjectId, subjectId),
          eq(classSubjects.academicYear, academicYear),
          eq(classSubjects.term, term)
        ),
      });

      if (existingAssignment) {
        return {
          error: "This subject is already assigned to this class for this term and academic year",
        };
      }

      const [response] = await db
        .insert(classSubjects)
        .values({
          classId,
          subjectId,
          teacherId,
          academicYear,
          term,
          schedule,
        })
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const updateClassSubject = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const classSubjectId = formData.get("classSubjectId") as string;
    const teacherId = formData.get("teacherId") as string || null;
    const schedule = formData.get("schedule")
      ? JSON.parse(formData.get("schedule") as string)
      : null;

    try {
      // Verify that the class subject assignment belongs to this school
      const classSubjectData = await db.query.classSubjects.findFirst({
        where: eq(classSubjects.id, classSubjectId),
        with: {
          class: true,
          subject: true,
        },
      });

      if (!classSubjectData || classSubjectData.class.schoolId !== school.id || classSubjectData.subject.schoolId !== school.id) {
        return {
          error: "Class subject assignment not found or doesn't belong to this school",
        };
      }

      // If teacher is specified, verify they belong to this school
      if (teacherId) {
        const teacherData = await db.query.staff.findFirst({
          where: and(
            eq(staff.id, teacherId),
            eq(staff.schoolId, school.id)
          ),
        });

        if (!teacherData) {
          return {
            error: "Teacher not found in this school",
          };
        }
      }

      const [response] = await db
        .update(classSubjects)
        .set({
          teacherId,
          schedule,
        })
        .where(eq(classSubjects.id, classSubjectId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const removeClassSubject = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const classSubjectId = formData.get("classSubjectId") as string;

    try {
      // Verify that the class subject assignment belongs to this school
      const classSubjectData = await db.query.classSubjects.findFirst({
        where: eq(classSubjects.id, classSubjectId),
        with: {
          class: true,
          subject: true,
        },
      });

      if (!classSubjectData || classSubjectData.class.schoolId !== school.id || classSubjectData.subject.schoolId !== school.id) {
        return {
          error: "Class subject assignment not found or doesn't belong to this school",
        };
      }

      const [response] = await db
        .delete(classSubjects)
        .where(eq(classSubjects.id, classSubjectId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

// Fee management
export const createFeeType = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string || null;
    const amount = parseFloat(formData.get("amount") as string);
    const frequency = formData.get("frequency") as string; // One-time, Term, Annual
    const gradeLevel = formData.get("gradeLevel") as string || null;
    const academicYear = formData.get("academicYear") as string || null;
    const term = formData.get("term") as string || null;
    const optional = formData.get("optional") === "true";

    try {
      const [response] = await db
        .insert(feeTypes)
        .values({
          schoolId: school.id,
          name,
          description,
          amount,
          frequency,
          gradeLevel,
          academicYear,
          term,
          optional,
        })
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const updateFeeType = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const feeTypeId = formData.get("feeTypeId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string || null;
    const amount = parseFloat(formData.get("amount") as string);
    const frequency = formData.get("frequency") as string;
    const gradeLevel = formData.get("gradeLevel") as string || null;
    const academicYear = formData.get("academicYear") as string || null;
    const term = formData.get("term") as string || null;
    const optional = formData.get("optional") === "true";

    try {
      // Verify that the fee type belongs to this school
      const feeTypeData = await db.query.feeTypes.findFirst({
        where: and(
          eq(feeTypes.id, feeTypeId),
          eq(feeTypes.schoolId, school.id)
        ),
      });

      if (!feeTypeData) {
        return {
          error: "Fee type not found in this school",
        };
      }

      const [response] = await db
        .update(feeTypes)
        .set({
          name,
          description,
          amount,
          frequency,
          gradeLevel,
          academicYear,
          term,
          optional,
        })
        .where(eq(feeTypes.id, feeTypeId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const deleteFeeType = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const feeTypeId = formData.get("feeTypeId") as string;

    try {
      // Verify that the fee type belongs to this school
      const feeTypeData = await db.query.feeTypes.findFirst({
        where: and(
          eq(feeTypes.id, feeTypeId),
          eq(feeTypes.schoolId, school.id)
        ),
      });

      if (!feeTypeData) {
        return {
          error: "Fee type not found in this school",
        };
      }

      const [response] = await db
        .delete(feeTypes)
        .where(eq(feeTypes.id, feeTypeId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

// Fee payments
export const recordFeePayment = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const studentId = formData.get("studentId") as string;
    const feeTypeId = formData.get("feeTypeId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const paymentDate = formData.get("paymentDate")
      ? new Date(formData.get("paymentDate") as string)
      : new Date();
    const paymentMethod = formData.get("paymentMethod") as string || null;
    const transactionId = formData.get("transactionId") as string || null;
    const academicYear = formData.get("academicYear") as string;
    const term = formData.get("term") as string;
    const status = formData.get("status") as string || "paid";
    const recordedBy = formData.get("recordedBy") as string;
    const notes = formData.get("notes") as string || null;

    try {
      // Verify that student, fee type, and staff member belong to this school
      const studentData = await db.query.students.findFirst({
        where: and(
          eq(students.id, studentId),
          eq(students.schoolId, school.id)
        ),
      });

      const feeTypeData = await db.query.feeTypes.findFirst({
        where: and(
          eq(feeTypes.id, feeTypeId),
          eq(feeTypes.schoolId, school.id)
        ),
      });

      const staffMember = await db.query.staff.findFirst({
        where: and(
          eq(staff.id, recordedBy),
          eq(staff.schoolId, school.id)
        ),
      });

      if (!studentData || !feeTypeData || !staffMember) {
        return {
          error: "Student, fee type, or staff member not found in this school",
        };
      }

      const [response] = await db
        .insert(feePayments)
        .values({
          studentId,
          feeTypeId,
          amount,
          paymentDate,
          paymentMethod,
          transactionId,
          academicYear,
          term,
          status,
          recordedBy,
          notes,
        })
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const updateFeePayment = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const paymentId = formData.get("paymentId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const paymentDate = formData.get("paymentDate")
      ? new Date(formData.get("paymentDate") as string)
      : undefined;
    const paymentMethod = formData.get("paymentMethod") as string || undefined;
    const transactionId = formData.get("transactionId") as string || undefined;
    const status = formData.get("status") as string || undefined;
    const notes = formData.get("notes") as string || undefined;

    try {
      // Verify that the payment belongs to a student of this school
      const payment = await db.query.feePayments.findFirst({
        where: eq(feePayments.id, paymentId),
        with: {
          student: true,
          feeType: true,
        },
      }) as (SelectFeePayment & { student: SelectStudent; feeType: SelectFeeType }) | null;

      if (!payment || payment.student.schoolId !== school.id || payment.feeType.schoolId !== school.id) {
        return {
          error: "Payment not found or doesn't belong to this school",
        };
      }

      const updateData: any = {};
      if (amount) updateData.amount = amount;
      if (paymentDate) updateData.paymentDate = paymentDate;
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
      if (transactionId) updateData.transactionId = transactionId;
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const [response] = await db
        .update(feePayments)
        .set(updateData)
        .where(eq(feePayments.id, paymentId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export const deleteFeePayment = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const paymentId = formData.get("paymentId") as string;

    try {
      // Verify that the payment belongs to a student of this school
      const payment = await db.query.feePayments.findFirst({
        where: eq(feePayments.id, paymentId),
        with: {
          student: true,
          feeType: true,
        },
      }) as (SelectFeePayment & { student: SelectStudent; feeType: SelectFeeType }) | null;

      if (!payment || payment.student.schoolId !== school.id || payment.feeType.schoolId !== school.id) {
        return {
          error: "Payment not found or doesn't belong to this school",
        };
      }

      const [response] = await db
        .delete(feePayments)
        .where(eq(feePayments.id, paymentId))
        .returning();

      return response;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

// User management for the school
export const inviteUserToSchool = withSchoolAuth(
  async (formData: FormData, school: SelectSchool) => {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const staffId = formData.get("staffId") as string || null;
    const position = formData.get("position") as string || "Teacher";
    const department = formData.get("department") as string || null;
    const qualification = formData.get("qualification") as string || null;
    const contactInfo = formData.get("contactInfo") 
      ? JSON.parse(formData.get("contactInfo") as string) 
      : {};

    try {
      // Check if the user already exists
      let user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        // Create the user if they don't exist
        [user] = await db
          .insert(users)
          .values({
            email,
            name,
            role,
          })
          .returning();
      }

      // Check if the user is already a staff member at this school
      const existingStaff = await db.query.staff.findFirst({
        where: and(
          eq(staff.userId, user.id),
          eq(staff.schoolId, school.id)
        ),
      });

      if (existingStaff) {
        return {
          error: "This user is already a staff member at this school",
        };
      }

      // Create staff record for the user
      const [staffMember] = await db.insert(staff)
        .values({
          userId: user.id,
          schoolId: school.id,
          staffId,
          position,
          department,
          qualification,
          contactInfo,
          status: "active",
        })
        .returning();

      // Send invitation email (this would be implemented separately)
      // await sendInvitationEmail(user.email, school.name, role);

      return staffMember;
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
);

export async function getSchoolPlanAndSiteCount(schoolId: string) {
  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
    with: {
      websiteConfig: true,
    },
  });

  if (!school) {
    return null;
  }

  return {
    plan: school.plan || 'free',
    siteCount: school.websiteConfig ? 1 : 0,
  };
}

// export type SelectStaff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;


export async function createTeacher(data: {
  name: string;
  email: string;
  password: string;
  subject: string;
  classes: string[];
  phone: string;
  address: string;
}) {
  // Create user first
  const hashedPassword = await hash("teacher@1234", 10);
  const user = await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: "teacher",
  }).returning();

  // Then create teacher profile with mapped fields
  const contactInfo = {
    phone: data.phone,
    address: data.address,
    subject: data.subject,
    classes: data.classes.join(", ")
  };

  const teacher = await db.insert(staff).values({
    userId: user[0].id,
    position: "Teacher",
    department: data.subject,
    contactInfo
  }).returning();

  return teacher[0];
}

export async function updateTeacher(
  id: string,
  data: Partial<Omit<InsertStaff, "userId">>
) {
  const teacher = await db
    .update(staff)
    .set(data)
    .where(eq(staff.id, id))
    .returning();

  return teacher[0];
}

export async function deleteTeacher(id: string) {
  try {
    // Use a full URL with a fallback to relative URL
    const url = typeof window !== 'undefined' 
      ? `/api/teachers?id=${id}` 
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/teachers?id=${id}`;
      
    const response = await fetch(url, {
      method: 'DELETE',
      next: { tags: ['teachers'] },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete teacher');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting teacher:', error);
    throw error;
  }
}