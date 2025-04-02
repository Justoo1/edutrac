import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
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
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$onUpdate(() => new Date()),
  role: text("role").default("user").notNull(), // admin, user, etc.
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
    enrollmentDate: timestamp("enrollmentDate", { mode: "date" }),
    currentGradeLevel: text("currentGradeLevel"),
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
    gradeLevel: text("gradeLevel"), // Which grade this subject is for
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
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull(), // Exam, Quiz, Project, etc.
    totalMarks: real("totalMarks").notNull(),
    passMark: real("passMark"),
    weight: real("weight"), // How much this contributes to final grade
    date: timestamp("date", { mode: "date" }),
    academicYear: text("academicYear").notNull(),
    term: text("term").notNull(),
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
    grade: text("grade"), // A, B, C, etc.
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
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, { fields: [staff.userId], references: [users.id] }),
  school: one(schools, { fields: [staff.schoolId], references: [schools.id] }),
  classesTaught: many(classSubjects),
  mainClass: many(classes),
}));

export const studentRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  school: one(schools, { fields: [students.schoolId], references: [schools.id] }),
  enrollments: many(classEnrollments),
  attendanceRecords: many(attendance),
  assessmentResults: many(assessmentResults),
  feePayments: many(feePayments),
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
export type SelectStudent = typeof students.$inferSelect;
export type SelectClass = typeof classes.$inferSelect;
export type SelectSubject = typeof subjects.$inferSelect;
export type SelectAssessment = typeof assessments.$inferSelect;
export type SelectFeeType = typeof feeTypes.$inferSelect;
export type SelectFeePayment = typeof feePayments.$inferSelect;

export const feePaymentRelations = relations(feePayments, ({ one }) => ({
  student: one(students, { fields: [feePayments.studentId], references: [students.id] }),
  feeType: one(feeTypes, { fields: [feePayments.feeTypeId], references: [feeTypes.id] }),
  recordedBy: one(staff, { fields: [feePayments.recordedBy], references: [staff.id] }),
}));
