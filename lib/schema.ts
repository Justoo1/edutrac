import { createId } from "@paralleldrive/cuid2";
import { getTime } from "date-fns";
import { relations, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  real,
  serial,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  numeric,
  time,
} from "drizzle-orm/pg-core";

// Original tables from the starter kit (renamed and modified for our use case)
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  username: text("username"),
  gh_username: text("gh_username"),
  password: text("password"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$onUpdate(() => new Date()),
  role: text("role").default("user").notNull(), // admin, user, etc.
  schoolId: text("schoolId"),
});

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => {
    return {
      userIdIdx: index().on(table.userId),
    };
  },
);

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => {
    return {
      compositePk: primaryKey({ columns: [table.identifier, table.token] }),
    };
  },
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    refreshTokenExpiresIn: integer("refresh_token_expires_in"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    oauth_token_secret: text("oauth_token_secret"),
    oauth_token: text("oauth_token"),
  },
  (table) => {
    return {
      userIdIdx: index().on(table.userId),
      compositePk: primaryKey({
        columns: [table.provider, table.providerAccountId],
      }),
    };
  },
);

// Transform sites into schools
export const schools = pgTable(
  "schools",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    description: text("description"),
    logo: text("logo").default(
      "https://public.blob.vercel-storage.com/eEZHAoPTOBSYGBE3/JRajRyC-PhBHEinQkupt02jqfKacBVHLWJq7Iy.png",
    ),
    font: text("font").default("font-cal").notNull(),
    image: text("image").default(
      "https://public.blob.vercel-storage.com/eEZHAoPTOBSYGBE3/hxfcV5V-eInX3jbVUhjAt1suB7zB88uGd1j20b.png",
    ),
    imageBlurhash: text("imageBlurhash").default(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAhCAYAAACbffiEAAAACXBIWXMAABYlAAAWJQFJUiTwAAABfUlEQVR4nN3XyZLDIAwE0Pz/v3q3r55JDlSBplsIEI49h76k4opexCK/juP4eXjOT149f2Tf9ySPgcjCc7kdpBTgDPKByKK2bTPFEdMO0RDrusJ0wLRBGCIuelmWJAjkgPGDSIQEMBDCfA2CEPM80+Qwl0JkNxBimiaYGOTUlXYI60YoehzHJDEm7kxjV3whOQTD3AaCuhGKHoYhyb+CBMwjIAFz647kTqyapdV4enGINuDJMSScPmijSwjCaHeLcT77C7EC0C1ugaCTi2HYfAZANgj6Z9A8xY5eiYghDMNQBJNCWhASot0jGsSCUiHWZcSGQjaWWCDaGMOWnsCcn2QhVkRuxqqNxMSdUSElCDbp1hbNOsa6Ugxh7xXauF4DyM1m5BLtCylBXgaxvPXVwEoOBjeIFVODtW74oj1yBQah3E8tyz3SkpolKS9Geo9YMD1QJR1Go4oJkgO1pgbNZq0AOUPChyjvh7vlXaQa+X1UXwKxgHokB2XPxbX+AnijwIU4ahazAAAAAElFTkSuQmCC",
    ),
    subdomain: text("subdomain").unique(),
    customDomain: text("customDomain").unique(),
    message404: text("message404").default(
      "Sorry! This page doesn't exist.",
    ),
    schoolCode: text("schoolCode").unique(), // Unique identifier for the school
    schoolType: text("schoolType"), // Primary, Junior High, etc.
    region: text("region"), // Greater Accra, Ashanti, etc.
    district: text("district"),
    address: text("address"),
    phone: text("phone"),
    plan: text("plan").default("basic"),
    email: text("email"),
    establishedYear: integer("establishedYear"),
    primaryColor: text("primaryColor").default("#000000"),
    secondaryColor: text("secondaryColor").default("#ffffff"),
    accentColor: text("accentColor").default("#0066cc"),
    layout: text("layout").default("classic"),
    customCSS: text("customCSS"),
    footerContent: text("footerContent"),
    welcomeMessage: text("welcomeMessage"),
    keywords: text("keywords"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
    adminId: text("adminId").references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  },
  (table) => {
    return {
      adminIdIdx: index().on(table.adminId),
    };
  },
);

// Transform posts into school content (announcements, pages, etc.)
export const schoolContent = pgTable(
  "schoolContent",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title"),
    description: text("description"),
    content: text("content"),
    slug: text("slug")
      .notNull()
      .$defaultFn(() => createId()),
    image: text("image").default(
      "https://public.blob.vercel-storage.com/eEZHAoPTOBSYGBE3/hxfcV5V-eInX3jbVUhjAt1suB7zB88uGd1j20b.png",
    ),
    imageBlurhash: text("imageBlurhash").default(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAhCAYAAACbffiEAAAACXBIWXMAABYlAAAWJQFJUiTwAAABfUlEQVR4nN3XyZLDIAwE0Pz/v3q3r55JDlSBplsIEI49h76k4opexCK/juP4eXjOT149f2Tf9ySPgcjCc7kdpBTgDPKByKK2bTPFEdMO0RDrusJ0wLRBGCIuelmWJAjkgPGDSIQEMBDCfA2CEPM80+Qwl0JkNxBimiaYGOTUlXYI60YoehzHJDEm7kxjV3whOQTD3AaCuhGKHoYhyb+CBMwjIAFz647kTqyapdV4enGINuDJMSScPmijSwjCaHeLcT77C7EC0C1ugaCTi2HYfAZANgj6Z9A8xY5eiYghDMNQBJNCWhASot0jGsSCUiHWZcSGQjaWWCDaGMOWnsCcn2QhVkRuxqqNxMSdUSElCDbp1hbNOsa6Ugxh7xXauF4DyM1m5BLtCylBXgaxvPXVwEoOBjeIFVODtW74oj1yBQah3E8tyz3SkpolKS9Geo9YMD1QJR1Go4oJkgO1pgbNZq0AOUPChyjvh7vlXaQa+X1UXwKxgHokB2XPxbX+AnijwIU4ahazAAAAAElFTkSuQmCC",
    ),
    contentType: text("contentType").notNull(), // announcement, page, newsletter
    publishDate: timestamp("publishDate", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
    published: boolean("published").default(false).notNull(),
    schoolId: text("schoolId").references(() => schools.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    authorId: text("authorId").references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      authorIdIdx: index().on(table.authorId),
      slugSchoolIdKey: uniqueIndex().on(table.slug, table.schoolId),
    };
  },
);

// New tables for the school management system

// Staff members (teachers, administrators, etc.)
export const staff = pgTable(
  "staff",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId").references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    name: text("name"),
    schoolId: text("schoolId").references(() => schools.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    
    staffId: text("staffId"), // School-issued ID
    position: text("position"), // Teacher, Headmaster, etc.
    department: text("department"),
    qualification: text("qualification"),
    joinedDate: timestamp("joinedDate", { mode: "date" }),
    status: text("status").default("active"), // active, on leave, former
    contactInfo: json("contactInfo"), // address, emergency contact, etc.
    gender: text("gender"),
    role: text("role").default("teacher"), // teacher, headmaster, etc.
    isActive: boolean("isActive").default(true), // Whether the staff member is active
    email: text("email"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userIdIdx: index().on(table.userId),
      schoolIdIdx: index().on(table.schoolId),
    };
  },
);

// Students
export const students = pgTable(
  "students",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }), // Optional user account for older students
    schoolId: text("schoolId").references(() => schools.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    studentId: text("studentId").notNull(), // School-issued ID
    firstName: text("firstName").notNull(),
    middleName: text("middleName"),
    lastName: text("lastName").notNull(),
    dateOfBirth: timestamp("dateOfBirth", { mode: "date" }),
    gender: text("gender"),
    address: text("address"),
    enrollmentDate: timestamp("enrollmentDate", { mode: "date" }),
    // currentGradeLevel: text("currentGradeLevel"),
    status: text("status").default("active"), // active, graduated, transferred
    guardian: json("guardian"), // Parent/guardian information
    contactInfo: json("contactInfo"), // address, phone, etc.
    healthInfo: json("healthInfo"), // Medical information, allergies, etc.
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userIdIdx: index().on(table.userId),
      schoolIdIdx: index().on(table.schoolId),
      studentIdSchoolIdKey: uniqueIndex().on(table.studentId, table.schoolId),
    };
  },
);

// program/course table
export const courses = pgTable("courses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  schoolId: text("schoolId")
    .notNull()
    .references(() => schools.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  department: text("department"), // e.g., "Science", "Arts", "Business", etc.
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$onUpdate(() => new Date()),
});

// Student-Course enrollments table
export const studentCourses = pgTable(
  "studentCourses", 
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    enrollmentDate: timestamp("enrollmentDate", { mode: "date" }).defaultNow().notNull(),
    status: text("status").default("active").notNull(), // active, completed, withdrawn
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      studentIdIdx: index().on(table.studentId),
      courseIdIdx: index().on(table.courseId),
      uniqueStudentCourse: uniqueIndex().on(table.studentId, table.courseId),
    };
  }
);

// Guardian table for storing parent/guardian information
export const guardians = pgTable("guardians", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }).unique(),
  firstName: varchar("firstName").notNull(),
  lastName: varchar("lastName").notNull(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone").notNull(),
  alternativePhone: varchar("alternativePhone"),
  relationship: varchar("relationship").notNull(), // e.g., "Father", "Mother", "Guardian"
  occupation: varchar("occupation"),
  address: text("address"),
  emergencyContact: boolean("emergencyContact").default(true),
  notes: text("notes"),
  status: varchar("status").notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Guardian-Student relationship table (many-to-many)
export const guardianStudents = pgTable("guardian_students", {
  id: text("id").primaryKey(),
  guardianId: text("guardianId").notNull().references(() => guardians.id, { onDelete: "cascade" }),
  studentId: text("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  isPrimary: boolean("isPrimary").default(false), // Whether this is the primary guardian for the student
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Relations
export const guardiansRelations = relations(guardians, ({ one, many }) => ({
  user: one(users, {
    fields: [guardians.userId],
    references: [users.id],
  }),
  guardianStudents: many(guardianStudents),
}));

export const guardianStudentsRelations = relations(guardianStudents, ({ one }) => ({
  guardian: one(guardians, {
    fields: [guardianStudents.guardianId],
    references: [guardians.id],
  }),
  student: one(students, {
    fields: [guardianStudents.studentId],
    references: [students.id],
  }),
}));

// Academic classes
export const classes = pgTable(
  "classes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    schoolId: text("schoolId").references(() => schools.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    name: text("name").notNull(), // e.g., "Primary 3A", "JHS 2B"
    gradeLevel: text("gradeLevel").notNull(), // e.g., "Primary 3", "JHS 2"
    academicYear: text("academicYear").notNull(), // e.g., "2023-2024"
    classTeacherId: text("classTeacherId").references(() => staff.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    capacity: integer("capacity"),
    room: text("room"),
    schedule: json("schedule"), // Class schedule
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      classTeacherIdIdx: index().on(table.classTeacherId),
    };
  },
);

// Class enrollment (students in classes)
export const classEnrollments = pgTable(
  "classEnrollments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    classId: text("classId")
      .notNull()
      .references(() => classes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    enrollmentDate: timestamp("enrollmentDate", { mode: "date" })
      .defaultNow()
      .notNull(),
    status: text("status").default("active"), // active, transferred, etc.
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      classIdIdx: index().on(table.classId),
      studentIdIdx: index().on(table.studentId),
      uniqueEnrollment: uniqueIndex().on(table.classId, table.studentId),
    };
  },
);

// Subjects
export const subjects = pgTable(
  "subjects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    schoolId: text("schoolId").references(() => schools.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    name: text("name").notNull(),
    code: text("code"),
    description: text("description"),
    courseId: text("courseId").references(() => courses.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    isOptional: boolean("isOptional").default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
    };
  },
);

// Class subjects (which subjects are taught in which classes)
export const classSubjects = pgTable(
  "classSubjects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    classId: text("classId")
      .notNull()
      .references(() => classes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    subjectId: text("subjectId")
      .notNull()
      .references(() => subjects.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    teacherId: text("teacherId").references(() => staff.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    academicYear: text("academicYear").notNull(),
    term: text("term").notNull(), // First, Second, Third
    schedule: json("schedule"), // When this subject is taught
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      classIdIdx: index().on(table.classId),
      subjectIdIdx: index().on(table.subjectId),
      teacherIdIdx: index().on(table.teacherId),
      uniqueClassSubject: uniqueIndex().on(
        table.classId,
        table.subjectId,
        table.academicYear,
        table.term,
      ),
    };
  },
);

// Attendance records
export const attendance = pgTable(
  "attendance",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    classId: text("classId")
      .notNull()
      .references(() => classes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    date: timestamp("date", { mode: "date" }).notNull(),
    status: text("status").notNull(), // present, absent, excused, late
    notes: text("notes"),
    recordedBy: text("recordedBy").references(() => staff.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      studentIdIdx: index().on(table.studentId),
      classIdIdx: index().on(table.classId),
      dateIdx: index().on(table.date),
      uniqueAttendance: uniqueIndex().on(
        table.studentId,
        table.classId,
        table.date,
      ),
    };
  },
);

// Assessments (exams, quizzes, etc.)
export const assessments = pgTable(
  "assessments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    schoolId: text("schoolId").references(() => schools.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    subjectId: text("subjectId").references(() => subjects.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    classId: text("classId").references(() => classes.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    academicYearId: text("academicYearId").references(() => academicYears.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    academicTermId: text("academicTermId").references(() => academicTerms.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type", { 
      enum: [
        "class_test_1", 
        "class_test_2", 
        "class_test_3", 
        "class_test_4", 
        "class_test_5",
        "quiz_1", 
        "quiz_2", 
        "quiz_3", 
        "quiz_4", 
        "quiz_5",
        "assignment_1",
        "assignment_2",
        "assignment_3",
        "project",
        "mid_term", 
        "end_of_term"
      ] 
    }).notNull(),
    category: text("category").default("continuous_assessment").notNull(), // continuous_assessment, final_exam
    totalMarks: real("totalMarks").notNull(),
    passMark: real("passMark"),
    weight: real("weight"), // How much this contributes to final grade
    date: timestamp("date", { mode: "date" }),
    academicYear: text("academicYear").notNull(),
    term: text("term").notNull(),
    percentageConfigId: text("percentageConfigId").references(() => examPercentageConfigs.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    status: text("status").default("active").notNull(), // active, completed, archived
    gradingComplete: boolean("gradingComplete").default(false).notNull(),
    createdBy: text("createdBy").references(() => staff.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      subjectIdIdx: index().on(table.subjectId),
      classIdIdx: index().on(table.classId),
      academicYearIdIdx: index().on(table.academicYearId),
      academicTermIdIdx: index().on(table.academicTermId),
      percentageConfigIdx: index().on(table.percentageConfigId),
    };
  },
);

// Assessment results
export const assessmentResults = pgTable(
  "assessmentResults",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    assessmentId: text("assessmentId")
      .notNull()
      .references(() => assessments.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    score: real("score").notNull(),
    convertedScore: real("convertedScore"), // Score after applying percentage conversion
    grade: text("grade"), // 1, 2, 3, etc.
    remark: text("remark"), // Excellent, Very Good, etc.
    position: integer("position"), // Rank in class
    feedback: text("feedback"),
    recordedBy: text("recordedBy").references(() => staff.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      assessmentIdIdx: index().on(table.assessmentId),
      studentIdIdx: index().on(table.studentId),
      uniqueResult: uniqueIndex().on(table.assessmentId, table.studentId),
    };
  },
);

// Fee types
export const feeTypes = pgTable(
  "feeTypes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(),
    description: text("description"),
    amount: real("amount").notNull(),
    frequency: text("frequency").notNull(), // One-time, Term, Annual
    gradeLevel: text("gradeLevel"), // Optional, specific to grade level
    academicYear: text("academicYear"),
    term: text("term"),
    optional: boolean("optional").default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
    };
  },
);

// Fee payments
export const feePayments = pgTable(
  "feePayments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    feeTypeId: text("feeTypeId")
      .notNull()
      .references(() => feeTypes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    amount: real("amount").notNull(),
    paymentDate: timestamp("paymentDate", { mode: "date" }).notNull(),
    paymentMethod: text("paymentMethod"), // Cash, Mobile Money, etc.
    transactionId: text("transactionId"),
    academicYear: text("academicYear").notNull(),
    term: text("term").notNull(),
    status: text("status").default("paid"), // paid, partial, pending
    recordedBy: text("recordedBy").references(() => staff.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      studentIdIdx: index().on(table.studentId),
      feeTypeIdIdx: index().on(table.feeTypeId),
    };
  },
);

// Exam percentage configuration for schools
export const examPercentageConfigs = pgTable(
  "examPercentageConfigs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(), // e.g., "Default", "Special Program"
    isDefault: boolean("isDefault").default(false).notNull(),
    continuousAssessmentPercent: integer("continuousAssessmentPercent").default(30).notNull(), // e.g., 30, 40
    examPercent: integer("examPercent").default(70).notNull(), // e.g., 70, 60
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
    };
  },
);

// Academic years table
export const academicYears = pgTable(
  "academicYears",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(), // e.g., "2023-2024"
    startDate: timestamp("startDate", { mode: "date" }).notNull(),
    endDate: timestamp("endDate", { mode: "date" }).notNull(),
    isCurrent: boolean("isCurrent").default(false).notNull(),
    status: text("status").default("upcoming").notNull(), // upcoming, active, completed
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      schoolCurrentYearIdx: index().on(table.schoolId, table.isCurrent),
    };
  },
);

// Academic terms table
export const academicTerms = pgTable(
  "academicTerms",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    academicYearId: text("academicYearId")
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(), // e.g., "First Term", "Second Term", "Third Term"
    termNumber: integer("termNumber").notNull(), // 1, 2, 3
    startDate: timestamp("startDate", { mode: "date" }).notNull(),
    endDate: timestamp("endDate", { mode: "date" }).notNull(),
    isCurrent: boolean("isCurrent").default(false).notNull(),
    status: text("status").default("upcoming").notNull(), // upcoming, active, completed
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      academicYearIdIdx: index().on(table.academicYearId),
      schoolIdIdx: index().on(table.schoolId),
      schoolCurrentTermIdx: index().on(table.schoolId, table.isCurrent),
      uniqueTerm: uniqueIndex().on(table.academicYearId, table.termNumber),
    };
  },
);

// Student class history for tracking promotions and class changes
export const studentClassHistory = pgTable(
  "studentClassHistory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    classId: text("classId")
      .notNull()
      .references(() => classes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    academicYearId: text("academicYearId")
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    enrollmentDate: timestamp("enrollmentDate", { mode: "date" }).notNull(),
    endDate: timestamp("endDate", { mode: "date" }),
    status: text("status").default("active").notNull(), // active, promoted, held-back, transferred, graduated
    performanceSummary: json("performanceSummary"), // Summary of student's performance in this class/year
    comments: text("comments"),
    recordedBy: text("recordedBy").references(() => staff.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      studentIdIdx: index().on(table.studentId),
      classIdIdx: index().on(table.classId),
      academicYearIdIdx: index().on(table.academicYearId),
      schoolIdIdx: index().on(table.schoolId),
      uniqueStudentClassYear: uniqueIndex().on(
        table.studentId, 
        table.academicYearId
      ),
    };
  },
);

// Define relationships between tables
export const userRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  staffProfiles: many(staff),
  studentProfiles: many(students),
  authoredContent: many(schoolContent),
  schools: many(schools),
}));

export const schoolRelations = relations(schools, ({ one, many }) => ({
  admin: one(users, { fields: [schools.adminId], references: [users.id] }),
  contents: many(schoolContent),
  staffMembers: many(staff),
  students: many(students),
  classes: many(classes),
  subjects: many(subjects),
  assessments: many(assessments),
  feeTypes: many(feeTypes),
  examPercentageConfigs: many(examPercentageConfigs),
  academicYears: many(academicYears),
  academicTerms: many(academicTerms),
  courses: many(courses),
  periods: many(periods),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, { fields: [staff.userId], references: [users.id] }),
  school: one(schools, { fields: [staff.schoolId], references: [schools.id] }),
  classesTaught: many(classSubjects),
  mainClass: many(classes),
}));

// Student relations
export const studentRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  school: one(schools, { fields: [students.schoolId], references: [schools.id] }),
  enrollments: many(classEnrollments),
  attendanceRecords: many(attendance),
  assessmentResults: many(assessmentResults),
  termResults: many(termResults),
  feePayments: many(feePayments),
  guardianStudents: many(guardianStudents),
  classHistory: many(studentClassHistory),
  batchEnrollments: many(batchEnrollments),
  courseEnrollments: many(studentCourses),
  subjectEnrollments: many(studentSubjects),
}));

export const classRelations = relations(classes, ({ one, many }) => ({
  school: one(schools, { fields: [classes.schoolId], references: [schools.id] }),
  classTeacher: one(staff, { fields: [classes.classTeacherId], references: [staff.id] }),
  enrollments: many(classEnrollments),
  subjects: many(classSubjects),
  attendanceRecords: many(attendance),
  assessments: many(assessments),
}));

export const classSubjectRelations = relations(classSubjects, ({ one }) => ({
  class: one(classes, { fields: [classSubjects.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [classSubjects.subjectId], references: [subjects.id] }),
  teacher: one(staff, { fields: [classSubjects.teacherId], references: [staff.id] }),
}));

export const classEnrollmentRelations = relations(classEnrollments, ({ one }) => ({
  class: one(classes, { fields: [classEnrollments.classId], references: [classes.id] }),
  student: one(students, { fields: [classEnrollments.studentId], references: [students.id] }),
}));

export const schoolContentRelations = relations(schoolContent, ({ one }) => ({
  school: one(schools, { fields: [schoolContent.schoolId], references: [schools.id] }),
  author: one(users, { fields: [schoolContent.authorId], references: [users.id] }),
}));

// Export types for use in the application
export type SelectSchool = typeof schools.$inferSelect;
export type SelectSchoolContent = typeof schoolContent.$inferSelect;
export type SelectStaff = typeof staff.$inferSelect;
export type SelectAcademicYear = typeof academicYears.$inferSelect;
export type SelectAcademicTerm = typeof academicTerms.$inferSelect;
export type SelectStudent = typeof students.$inferSelect;
export type SelectClass = typeof classes.$inferSelect;
export type SelectSubject = typeof subjects.$inferSelect;
export type SelectAssessment = typeof assessments.$inferSelect;
export type SelectFeeType = typeof feeTypes.$inferSelect;
export type SelectFeePayment = typeof feePayments.$inferSelect;

// Type definitions for query results
export type SelectGuardian = typeof guardians.$inferSelect;
export type InsertGuardian = typeof guardians.$inferInsert;

export type SelectGuardianStudent = typeof guardianStudents.$inferSelect;
export type InsertGuardianStudent = typeof guardianStudents.$inferInsert;

export const feePaymentRelations = relations(feePayments, ({ one }) => ({
  student: one(students, { fields: [feePayments.studentId], references: [students.id] }),
  feeType: one(feeTypes, { fields: [feePayments.feeTypeId], references: [feeTypes.id] }),
  recordedBy: one(staff, { fields: [feePayments.recordedBy], references: [staff.id] }),
}));

// Add a new table for term result summaries
export const termResults = pgTable(
  "termResults",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    classId: text("classId")
      .notNull()
      .references(() => classes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    subjectId: text("subjectId")
      .notNull()
      .references(() => subjects.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    academicYearId: text("academicYearId").references(() => academicYears.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    academicTermId: text("academicTermId").references(() => academicTerms.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    academicYear: text("academicYear").notNull(),
    term: text("term").notNull(),
    continuousAssessmentScore: real("continuousAssessmentScore").notNull(),
    examScore: real("examScore").notNull(),
    totalScore: real("totalScore").notNull(),
    grade: text("grade").notNull(),
    remark: text("remark").notNull(),
    position: integer("position"),
    percentageConfigId: text("percentageConfigId").references(() => examPercentageConfigs.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    recordedBy: text("recordedBy").references(() => staff.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      studentIdIdx: index().on(table.studentId),
      classIdIdx: index().on(table.classId),
      subjectIdIdx: index().on(table.subjectId),
      schoolIdIdx: index().on(table.schoolId),
      academicYearIdIdx: index().on(table.academicYearId),
      academicTermIdIdx: index().on(table.academicTermId),
      uniqueTermResult: uniqueIndex().on(
        table.studentId,
        table.subjectId,
        table.academicYearId,
        table.academicTermId
      ),
    };
  },
);

// Add relation for term results
export const termResultRelations = relations(termResults, ({ one }) => ({
  student: one(students, { fields: [termResults.studentId], references: [students.id] }),
  class: one(classes, { fields: [termResults.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [termResults.subjectId], references: [subjects.id] }),
  school: one(schools, { fields: [termResults.schoolId], references: [schools.id] }),
  academicYear: one(academicYears, { fields: [termResults.academicYearId], references: [academicYears.id] }),
  academicTerm: one(academicTerms, { fields: [termResults.academicTermId], references: [academicTerms.id] }),
  recorder: one(staff, { fields: [termResults.recordedBy], references: [staff.id] }),
  percentageConfig: one(examPercentageConfigs, {
    fields: [termResults.percentageConfigId],
    references: [examPercentageConfigs.id]
  }),
}));

// Add relations for new exam percentage config
export const examPercentageConfigRelations = relations(examPercentageConfigs, ({ one, many }) => ({
  school: one(schools, { fields: [examPercentageConfigs.schoolId], references: [schools.id] }),
  assessments: many(assessments),
  termResults: many(termResults),
}));

// Update existing assessment relations
export const assessmentRelations = relations(assessments, ({ one, many }) => ({
  school: one(schools, { fields: [assessments.schoolId], references: [schools.id] }),
  subject: one(subjects, { fields: [assessments.subjectId], references: [subjects.id] }),
  class: one(classes, { fields: [assessments.classId], references: [classes.id] }),
  academicYear: one(academicYears, { fields: [assessments.academicYearId], references: [academicYears.id] }),
  academicTerm: one(academicTerms, { fields: [assessments.academicTermId], references: [academicTerms.id] }),
  creator: one(staff, { fields: [assessments.createdBy], references: [staff.id] }),
  results: many(assessmentResults),
  percentageConfig: one(examPercentageConfigs, { 
    fields: [assessments.percentageConfigId], 
    references: [examPercentageConfigs.id] 
  }),
}));

// Add relations for assessment results
export const assessmentResultsRelations = relations(assessmentResults, ({ one }) => ({
  assessment: one(assessments, { fields: [assessmentResults.assessmentId], references: [assessments.id] }),
  student: one(students, { fields: [assessmentResults.studentId], references: [students.id] }),
  recorder: one(staff, { fields: [assessmentResults.recordedBy], references: [staff.id] }),
}));

// Academic year relations
export const academicYearRelations = relations(academicYears, ({ one, many }) => ({
  school: one(schools, { fields: [academicYears.schoolId], references: [schools.id] }),
  terms: many(academicTerms),
  studentClassHistory: many(studentClassHistory),
  batches: many(batches),
}));

export const academicTermRelations = relations(academicTerms, ({ one }) => ({
  academicYear: one(academicYears, { fields: [academicTerms.academicYearId], references: [academicYears.id] }),
  school: one(schools, { fields: [academicTerms.schoolId], references: [schools.id] }),
}));

// Add relations for student class history
export const studentClassHistoryRelations = relations(studentClassHistory, ({ one }) => ({
  student: one(students, { fields: [studentClassHistory.studentId], references: [students.id] }),
  class: one(classes, { fields: [studentClassHistory.classId], references: [classes.id] }),
  academicYear: one(academicYears, { fields: [studentClassHistory.academicYearId], references: [academicYears.id] }),
  school: one(schools, { fields: [studentClassHistory.schoolId], references: [schools.id] }),
  recorder: one(staff, { fields: [studentClassHistory.recordedBy], references: [staff.id] }),
}));

// Batches table
export const batches = pgTable(
  "batches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(),
    gradeLevel: text("gradeLevel").notNull(), // e.g., "Kindergarten 1", "Primary 1", "JHS 1", "SHS 1"
    capacity: integer("capacity").notNull(),
    academicYearId: text("academicYearId")
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      academicYearIdIdx: index().on(table.academicYearId),
      uniqueBatchYear: uniqueIndex().on(table.schoolId, table.gradeLevel, table.academicYearId),
    };
  },
);

// Batch enrollments (students in batches)
export const batchEnrollments = pgTable(
  "batchEnrollments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    batchId: text("batchId")
      .notNull()
      .references(() => batches.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    enrollmentDate: timestamp("enrollmentDate", { mode: "date" })
      .defaultNow()
      .notNull(),
    status: text("status").default("active").notNull(), // active, transferred, graduated
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      batchIdIdx: index().on(table.batchId),
      studentIdIdx: index().on(table.studentId),
      uniqueEnrollment: uniqueIndex().on(table.batchId, table.studentId),
    };
  },
);

// Add batch relations
export const batchRelations = relations(batches, ({ one, many }) => ({
  school: one(schools, { fields: [batches.schoolId], references: [schools.id] }),
  academicYear: one(academicYears, { fields: [batches.academicYearId], references: [academicYears.id] }),
  enrollments: many(batchEnrollments),
}));

export const batchEnrollmentRelations = relations(batchEnrollments, ({ one }) => ({
  batch: one(batches, { fields: [batchEnrollments.batchId], references: [batches.id] }),
  student: one(students, { fields: [batchEnrollments.studentId], references: [students.id] }),
}));

// Add course relations
export const courseRelations = relations(courses, ({ one, many }) => ({
  school: one(schools, { fields: [courses.schoolId], references: [schools.id] }),
  subjects: many(subjectCourses),
  studentEnrollments: many(studentCourses),
}));

export const studentCourseRelations = relations(studentCourses, ({ one }) => ({
  student: one(students, { fields: [studentCourses.studentId], references: [students.id] }),
  course: one(courses, { fields: [studentCourses.courseId], references: [courses.id] }),
}));

// Subject-Course relationships (for SHS schools)
export const subjectCourses = pgTable(
  "subjectCourses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    subjectId: text("subjectId")
      .notNull()
      .references(() => subjects.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      subjectIdIdx: index().on(table.subjectId),
      courseIdIdx: index().on(table.courseId),
      uniqueSubjectCourse: uniqueIndex().on(table.subjectId, table.courseId),
    };
  },
);

// Update subject relations
export const subjectRelations = relations(subjects, ({ one, many }) => ({
  school: one(schools, { fields: [subjects.schoolId], references: [schools.id] }),
  course: one(courses, { fields: [subjects.courseId], references: [courses.id] }),
  classSubjects: many(classSubjects),
  assessments: many(assessments),
  termResults: many(termResults),
  studentEnrollments: many(studentSubjects),
}));

// Student-Subject enrollments table
export const studentSubjects = pgTable(
  "studentSubjects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    subjectId: text("subjectId")
      .notNull()
      .references(() => subjects.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    enrollmentDate: timestamp("enrollmentDate", { mode: "date" }).defaultNow().notNull(),
    status: text("status").default("active").notNull(), // active, completed, withdrawn
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      studentIdIdx: index().on(table.studentId),
      subjectIdIdx: index().on(table.subjectId),
      uniqueStudentSubject: uniqueIndex().on(table.studentId, table.subjectId),
    };
  }
);

// Add student-subject relations
export const studentSubjectRelations = relations(studentSubjects, ({ one }) => ({
  student: one(students, { fields: [studentSubjects.studentId], references: [students.id] }),
  subject: one(subjects, { fields: [studentSubjects.subjectId], references: [subjects.id] }),
}));

// Timetable schema
export const timetables = pgTable(
  "timetables",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    classId: text("classId")
      .notNull()
      .references(() => classes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    subjectId: text("subjectId")
      .notNull()
      .references(() => subjects.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    teacherId: text("teacherId")
      .notNull()
      .references(() => staff.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    day: text("day").notNull(), // monday, tuesday, etc.
    period: text("period").notNull(), // Period 1, Period 2, etc.
    room: text("room").notNull(),
    academicYearId: text("academicYearId")
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    academicTermId: text("academicTermId")
      .notNull()
      .references(() => academicTerms.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      classIdIdx: index().on(table.classId),
      subjectIdIdx: index().on(table.subjectId),
      teacherIdIdx: index().on(table.teacherId),
      academicYearIdIdx: index().on(table.academicYearId),
      academicTermIdIdx: index().on(table.academicTermId),
      uniqueSchedule: uniqueIndex().on(
        table.classId,
        table.day,
        table.period,
        table.academicYearId,
        table.academicTermId
      ),
    };
  },
);

// Add timetable relations
export const timetableRelations = relations(timetables, ({ one }) => ({
  school: one(schools, { fields: [timetables.schoolId], references: [schools.id] }),
  class: one(classes, { fields: [timetables.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [timetables.subjectId], references: [subjects.id] }),
  teacher: one(staff, { fields: [timetables.teacherId], references: [staff.id] }),
  academicYear: one(academicYears, { fields: [timetables.academicYearId], references: [academicYears.id] }),
  academicTerm: one(academicTerms, { fields: [timetables.academicTermId], references: [academicTerms.id] }),
}));

// Add this before the timetables schema
export const periods = pgTable(
  "periods",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    time: text("time").notNull(), // e.g., "7:30 - 8:30"
    label: text("label").notNull(), // e.g., "Period 1"
    orderIndex: integer("orderIndex").notNull(), // To maintain the order of periods
    type: text("type").default("class").notNull(), // class or break
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      uniquePeriodOrder: uniqueIndex().on(table.schoolId, table.orderIndex),
    };
  },
);

// Add this to schoolRelations
export const periodRelations = relations(periods, ({ one }) => ({
  school: one(schools, { fields: [periods.schoolId], references: [schools.id] }),
}));

// Exam types table
export const examTypes = pgTable("exam_types", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  weight: integer("weight").notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exam Module
/**
 * Exam Period table (Term, Academic Year)
 * Assessment Types
 * Exam Configuration
 * Exam
 * Exam Student
 * Exam Scores
 * Term Report
 * Term Report Details
 * Exam Results
 * Exam Results Details
 * Exam Results Summary
 * Exam Results Analysis
 * Exam Results Comparison
 * Exam Results Report
 * Exam Results Analysis
 */

// Exam Period table (Term, Academic Year)
export const examPeriods = pgTable("exam_periods", {
  id: serial("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "First Term 2023/2024"
  academicYear: text("academic_year").notNull(), // e.g., "2023/2024"
  term: text("term").notNull(), // e.g., "First Term", "Second Term", "Third Term"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessment types
export const assessmentTypes = pgTable("assessment_types", {
  id: serial("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Class Test", "Assignment", "Project Work", "End of Term Exam"
  shortName: text("short_name"), // e.g., "CT", "ASS", "PW", "ETE"
  category: text("category").notNull(), // "Class Score" or "Exam Score"
  weight: integer("weight").notNull(), // Percentage weight in final calculation
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exam configuration table (for school preferences)
export const examConfigurations = pgTable(
  "exam_configurations",
  {
    id: serial("id").primaryKey(),
    school_id: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    class_score_weight: integer("class_score_weight").default(30), // Percentage (30% or 40%)
    exam_score_weight: integer("exam_score_weight").default(70), // Percentage (70% or 60%)
    pass_mark: integer("pass_mark").default(50), // Minimum score to pass
    highest_mark: integer("highest_mark").default(100), // Maximum possible score
    use_grade_system: boolean("use_grade_system").default(true), // Whether to use letter grades
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      // Add unique constraint on school_id
      schoolIdUniqueIdx: uniqueIndex("exam_config_school_id_unique_idx").on(
        table.school_id,
      ),
    };
  },
);

// Grade system table (A1, B2, etc. with their score ranges and interpretation)
export const gradeSystem = pgTable("grade_system", {
  id: serial("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  gradeName: text("grade_name").notNull(), // e.g., "A1", "B2", "F9"
  minScore: integer("min_score").notNull(), // Minimum score for this grade
  maxScore: integer("max_score").notNull(), // Maximum score for this grade
  interpretation: text("interpretation"), // e.g., "Excellent", "Good", "Fail"
  gradePoint: numeric("grade_point", { precision: 3, scale: 1 }), // e.g., 1.0, 2.0 (for GPA calculation)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exam table (main exam definition)
export const exams = pgTable("exams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  examPeriodId: integer("exam_period_id").notNull().references(() => examPeriods.id, { onDelete: "cascade" }),
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  examType: text("exam_type").notNull().references(() => examTypes.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Mathematics Class Test 1"
  description: text("description"),
  examCode: text("exam_code").notNull(), // e.g., "MATH101"
  academicYear: text("academic_year").notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  term: text("term").notNull().references(() => academicTerms.id, { onDelete: "cascade" }),
  startTime: time("start_time").notNull().default("09:00:00"),
  endTime: time("end_time").notNull().default("11:00:00"),
  responsibleStaffId: text("responsible_staff_id").notNull().references(() => staff.id, { onDelete: "no action" }),
  totalMarks: integer("total_marks").notNull().default(100),
  duration: integer("duration"), // in minutes (if applicable)
  examDate: timestamp("exam_date"), // When the exam will be or was conducted
  status: text("status").notNull().default("draft"), // "draft", "scheduled", "completed", "graded", "published"
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student exam records (which students are assigned to take which exams)
export const examStudents = pgTable("exam_students", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  examId: text("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("assigned"), // "assigned", "present", "absent", "exempted", "sick"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueIdx: uniqueIndex("exam_student_unique_idx").on(table.examId, table.studentId),
}));

// Student exam scores (actual scores for each student)
export const examScores = pgTable("exam_scores", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  examId: text("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  rawScore: numeric("raw_score", { precision: 5, scale: 2 }).notNull(),
  scaledScore: numeric("scaled_score", { precision: 5, scale: 2 }),
  gradeId: integer("grade_id").references(() => gradeSystem.id),
  remarks: text("remarks"),
  gradedBy: text("graded_by").references(() => users.id),
  gradedAt: timestamp("graded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueIdx: uniqueIndex("exam_score_unique_idx").on(table.examId, table.studentId),
}));

// Term Report table (aggregate of all exam scores for a student in a term)
export const termReports = pgTable(
  "term_reports",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    studentId: text("student_id").notNull()
      .references(() => students.id, { onDelete: "cascade", onUpdate: "cascade" }),
    // Remove examPeriodId
    // Add new fields:
    academicYearId: text("academic_year_id").notNull()
      .references(() => academicYears.id, { onDelete: "cascade", onUpdate: "cascade" }),
    academicTermId: text("academic_term_id").notNull()
      .references(() => academicTerms.id, { onDelete: "cascade", onUpdate: "cascade" }),
    totalMarks: real("total_marks").notNull(),
    averageScore: real("average_score").notNull(),
    rank: text("rank").notNull(),
    remarks: text("remarks"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      // Update the unique index to use the new fields
      termReportUniqueIdx: uniqueIndex("term_report_unique_idx").on(
        table.studentId,
        table.academicYearId,
        table.academicTermId
      ),
    };
  }
);

// Term Report Detail table (breakdown of individual subject performance)
export const termReportDetails = pgTable("term_report_details", {
  id: serial("id").primaryKey(),
  termReportId: text("term_report_id").notNull().references(() => termReports.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  classScore: numeric("class_score", { precision: 5, scale: 2 }),
  examScore: numeric("exam_score", { precision: 5, scale: 2 }),
  totalScore: numeric("total_score", { precision: 5, scale: 2 }),
  gradeId: integer("grade_id").references(() => gradeSystem.id),
  position: integer("position"), // overall class postion after find the total for all exams
  coursePosition: integer("course_position"), // course or program position. This is optional for Basic Schools, but for High Schools it will be required
  batchPosition: integer("batch_position"), // Batch or form position
  classPosition: integer("class_position"), // class position for each subject
  teacherRemarks: text("teacher_remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueIdx: uniqueIndex("term_report_detail_unique_idx").on(table.termReportId, table.subjectId),
}));

// Generate types for the schema
export type SelectExamPeriod = InferSelectModel<typeof examPeriods>;
export type SelectAssessmentType = InferSelectModel<typeof assessmentTypes>;
export type SelectExamConfiguration = InferSelectModel<typeof examConfigurations>;
export type SelectGrade = InferSelectModel<typeof gradeSystem>;
export type SelectExam = InferSelectModel<typeof exams>;
export type SelectExamStudent = InferSelectModel<typeof examStudents>;
export type SelectExamScore = InferSelectModel<typeof examScores>;
export type SelectTermReport = InferSelectModel<typeof termReports>;
export type SelectTermReportDetail = InferSelectModel<typeof termReportDetails>;

// Add relations for exam table
export const examRelations = relations(exams, ({ one, many }) => ({
  school: one(schools, { fields: [exams.schoolId], references: [schools.id] }),
  examPeriod: one(examPeriods, { fields: [exams.examPeriodId], references: [examPeriods.id] }),
  class: one(classes, { fields: [exams.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [exams.subjectId], references: [subjects.id] }),
  examType: one(examTypes, { fields: [exams.examType], references: [examTypes.id] }),
  creator: one(users, { fields: [exams.createdBy], references: [users.id] }),
  examStudents: many(examStudents),
  examScores: many(examScores),
}));

export const termReportRelations = relations(termReports, ({ one, many }) => ({
  student: one(students, { 
    fields: [termReports.studentId], 
    references: [students.id] 
  }),
  // Add relations for academic year and term
  academicYear: one(academicYears, {
    fields: [termReports.academicYearId],
    references: [academicYears.id]
  }),
  academicTerm: one(academicTerms, {
    fields: [termReports.academicTermId],
    references: [academicTerms.id]
  }),
  // Relation to term report details
  details: many(termReportDetails)
}));

export const termReportDetailsRelations = relations(termReportDetails, ({ one }) => ({
  termReport: one(termReports, { 
    fields: [termReportDetails.termReportId], 
    references: [termReports.id] 
  }),
  subject: one(subjects, { 
    fields: [termReportDetails.subjectId], 
    references: [subjects.id] 
  }),
  grade: one(gradeSystem, { 
    fields: [termReportDetails.gradeId], 
    references: [gradeSystem.id] 
  }),
}));

// Add relations for examStudents
export const examStudentsRelations = relations(examStudents, ({ one }) => ({
  exam: one(exams, { fields: [examStudents.examId], references: [exams.id] }),
  student: one(students, { fields: [examStudents.studentId], references: [students.id] }),
}));

// Add relations for examScores
export const examScoresRelations = relations(examScores, ({ one }) => ({
  exam: one(exams, { fields: [examScores.examId], references: [exams.id] }),
  student: one(students, { fields: [examScores.studentId], references: [students.id] }),
}));

