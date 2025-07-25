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
      academicYearIdIdx: index().on(table.academicYearId),
      schoolIdIdx: index().on(table.schoolId),
      dateIdx: index().on(table.date),
      uniqueAttendance: uniqueIndex().on(
        table.studentId,
        table.classId,
        table.date,
      ),
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
    dueDate: timestamp("dueDate", { mode: "date" }),
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
  feeTypes: many(feeTypes),
  examPercentageConfigs: many(examPercentageConfigs),
  academicYears: many(academicYears),
  academicTerms: many(academicTerms),
  courses: many(courses),
  periods: many(periods),
  websiteConfig: one(websiteConfigs, { fields: [schools.id], references: [websiteConfigs.schoolId] }),
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
  termResults: many(termResults),
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
  id: text("id").primaryKey().$defaultFn(() => createId()), // Use string ID with cuid2 generator
  termReportId: text("term_report_id").notNull().references(() => termReports.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  classScore: numeric("class_score", { precision: 5, scale: 2 }).notNull().default("0"), // Add not null and default
  examScore: numeric("exam_score", { precision: 5, scale: 2 }).notNull().default("0"), // Add not null and default
  totalScore: numeric("total_score", { precision: 5, scale: 2 }).notNull().default("0"), // Add not null and default
  gradeId: integer("grade_id").references(() => gradeSystem.id),
  position: integer("position"), // overall class postion after find the total for all exams
  coursePosition: integer("course_position"), // course or program position. This is optional for Basic Schools, but for High Schools it will be required
  batchPosition: integer("batch_position"), // Batch or form position
  classPosition: integer("class_position").notNull().default(0), // class position for each subject - made not null with default
  teacherRemarks: text("teacher_remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueIdx: uniqueIndex("term_report_detail_unique_idx").on(table.termReportId, table.subjectId),
}));

// Generate types for the schema
export type SelectExamPeriod = InferSelectModel<typeof examPeriods>;
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

// Website Builder System
export const websitePages = pgTable(
  "websitePages",
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
    title: text("title").notNull(),
    slug: text("slug").notNull(), // URL path like "/about", "/contact"
    content: json("content"), // Page builder content structure
    metaTitle: text("metaTitle"),
    metaDescription: text("metaDescription"),
    featuredImage: text("featuredImage"),
    pageType: text("pageType").default("page").notNull(), // page, landing, blog, etc.
    template: text("template").default("default"), // template variant
    isHomePage: boolean("isHomePage").default(false),
    isPublished: boolean("isPublished").default(false),
    sortOrder: integer("sortOrder").default(0),
    showInNavigation: boolean("showInNavigation").default(true),
    customCSS: text("customCSS"),
    customJS: text("customJS"),
    seoSettings: json("seoSettings"), // SEO configuration
    accessLevel: text("accessLevel").default("public"), // public, private, members-only
    publishedAt: timestamp("publishedAt", { mode: "date" }),
    createdBy: text("createdBy")
      .notNull()
      .references(() => users.id, {
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
      slugSchoolIdIdx: uniqueIndex().on(table.schoolId, table.slug),
      createdByIdx: index().on(table.createdBy),
    };
  },
);

// Website Components/Blocks
export const websiteBlocks = pgTable(
  "websiteBlocks",
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
    pageId: text("pageId")
      .references(() => websitePages.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    blockType: text("blockType").notNull(), // hero, text, image, gallery, form, etc.
    content: json("content").notNull(), // Block configuration and content
    styles: json("styles"), // Block-specific styling
    sortOrder: integer("sortOrder").default(0),
    isVisible: boolean("isVisible").default(true),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      pageIdIdx: index().on(table.pageId),
      sortOrderIdx: index().on(table.sortOrder),
    };
  },
);

// Website Themes and Templates
export const websiteThemes = pgTable(
  "websiteThemes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    description: text("description"),
    thumbnail: text("thumbnail"),
    isDefault: boolean("isDefault").default(false),
    isPremium: boolean("isPremium").default(false),
    config: json("config").notNull(), // Theme configuration
    styles: json("styles").notNull(), // Theme styles
    layouts: json("layouts"), // Available layouts
    category: text("category").default("general"), // education, corporate, etc.
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      categoryIdx: index().on(table.category),
    };
  },
);

// School Website Configuration
export const websiteConfigs = pgTable(
  "websiteConfigs",
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
    themeId: text("themeId")
      .references(() => websiteThemes.id, {
        onDelete: "set null",
        onUpdate: "cascade",
      }),
    siteName: text("siteName"),
    tagline: text("tagline"),
    favicon: text("favicon"),
    socialMedia: json("socialMedia"), // Social media links
    contactInfo: json("contactInfo"), // Contact details
    globalStyles: json("globalStyles"), // Site-wide styling
    headerConfig: json("headerConfig"), // Header configuration
    footerConfig: json("footerConfig"), // Footer configuration
    navigationMenu: json("navigationMenu"), // Site navigation
    seoSettings: json("seoSettings"), // Global SEO settings
    analytics: json("analytics"), // Google Analytics, etc.
    isMaintenanceMode: boolean("isMaintenanceMode").default(false),
    maintenanceMessage: text("maintenanceMessage"),
    customDomainSettings: json("customDomainSettings"),
    isPublished: boolean("isPublished").default(false),
    publishedAt: timestamp("publishedAt", { mode: "date" }),
    lastBackup: timestamp("lastBackup", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: uniqueIndex().on(table.schoolId), // One config per school
      themeIdIdx: index().on(table.themeId),
    };
  },
);

// Website Media Library
export const websiteMedia = pgTable(
  "websiteMedia",
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
    fileName: text("fileName").notNull(),
    originalName: text("originalName").notNull(),
    fileUrl: text("fileUrl").notNull(),
    fileType: text("fileType").notNull(), // image, video, document, etc.
    mimeType: text("mimeType").notNull(),
    fileSize: integer("fileSize").notNull(), // in bytes
    dimensions: json("dimensions"), // width, height for images
    altText: text("altText"),
    caption: text("caption"),
    tags: json("tags"), // Array of tags for organization
    uploadedBy: text("uploadedBy")
      .notNull()
      .references(() => users.id, {
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
      fileTypeIdx: index().on(table.fileType),
      uploadedByIdx: index().on(table.uploadedBy),
    };
  },
);

// Website Forms (Contact forms, applications, etc.)
export const websiteForms = pgTable(
  "websiteForms",
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
    formSchema: json("formSchema").notNull(), // Form field definitions
    settings: json("settings"), // Form settings (notifications, etc.)
    isActive: boolean("isActive").default(true),
    submissionCount: integer("submissionCount").default(0),
    createdBy: text("createdBy")
      .notNull()
      .references(() => users.id, {
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
      createdByIdx: index().on(table.createdBy),
    };
  },
);

// Form Submissions
export const websiteFormSubmissions = pgTable(
  "websiteFormSubmissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    formId: text("formId")
      .notNull()
      .references(() => websiteForms.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    submissionData: json("submissionData").notNull(), // Form field values
    submitterEmail: text("submitterEmail"),
    submitterIP: text("submitterIP"),
    userAgent: text("userAgent"),
    isRead: boolean("isRead").default(false),
    isReplied: boolean("isReplied").default(false),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => {
    return {
      formIdIdx: index().on(table.formId),
      schoolIdIdx: index().on(table.schoolId),
      isReadIdx: index().on(table.isRead),
    };
  },
);

// Enhanced Fee Structure Management
export const feeStructures = pgTable(
  "feeStructures",
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
    className: text("className").notNull(), // "JHS 1", "SHS 2A", etc.
    level: text("level").notNull(), // "Junior High", "Senior High"
    academicYear: text("academicYear").notNull(),
    
    // Fee breakdown
    tuitionFee: real("tuitionFee").notNull().default(0),
    activitiesFee: real("activitiesFee").notNull().default(0),
    examinationFee: real("examinationFee").notNull().default(0),
    libraryFee: real("libraryFee").notNull().default(0),
    laboratoryFee: real("laboratoryFee").notNull().default(0),
    transportFee: real("transportFee").notNull().default(0),
    
    totalFee: real("totalFee").notNull(), // Calculated total
    status: text("status").default("active"), // active, inactive
    studentsEnrolled: integer("studentsEnrolled").default(0),
    
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      uniqueClassYear: uniqueIndex().on(table.schoolId, table.className, table.academicYear),
    };
  },
);

// Staff Salary Management
export const staffSalaries = pgTable(
  "staffSalaries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    staffId: text("staffId")
      .notNull()
      .references(() => staff.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    schoolId: text("schoolId")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    
    // Salary components
    baseSalary: real("baseSalary").notNull(),
    allowances: real("allowances").default(0), // Housing, transport, etc.
    deductions: real("deductions").default(0), // Tax, insurance, etc.
    netSalary: real("netSalary").notNull(), // Calculated net
    
    // Payment details
    paymentDate: timestamp("paymentDate", { mode: "date" }),
    paymentMethod: text("paymentMethod"), // Bank Transfer, Mobile Money, Cash
    paymentReference: text("paymentReference"),
    accountNumber: text("accountNumber"),
    
    // Period
    payPeriod: text("payPeriod").notNull(), // "2024-01", "2024-02"
    academicYear: text("academicYear").notNull(),
    
    status: text("status").default("pending"), // pending, paid, processing
    processedBy: text("processedBy").references(() => staff.id),
    notes: text("notes"),
    
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      staffIdIdx: index().on(table.staffId),
      schoolIdIdx: index().on(table.schoolId),
      uniqueStaffPeriod: uniqueIndex().on(table.staffId, table.payPeriod),
    };
  },
);

// Expense Management
export const expenses = pgTable(
  "expenses",
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
    
    description: text("description").notNull(),
    category: text("category").notNull(), // Utilities, Supplies, Maintenance, etc.
    vendor: text("vendor").notNull(),
    department: text("department").notNull(),
    
    amount: real("amount").notNull(),
    expenseDate: timestamp("expenseDate", { mode: "date" }).notNull(),
    
    // Payment details
    paymentMethod: text("paymentMethod"), // Cash, Bank Transfer, Cheque
    paymentReference: text("paymentReference"),
    receiptUrl: text("receiptUrl"), // URL to receipt file
    
    // Approval workflow
    status: text("status").default("pending"), // pending, approved, paid, rejected
    approvedBy: text("approvedBy").references(() => staff.id),
    approvedAt: timestamp("approvedAt", { mode: "date" }),
    
    recordedBy: text("recordedBy")
      .notNull()
      .references(() => staff.id),
    notes: text("notes"),
    
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      categoryIdx: index().on(table.category),
      statusIdx: index().on(table.status),
    };
  },
);

// Financial Transactions (for tracking all money movement)
export const financialTransactions = pgTable(
  "financialTransactions",
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
    
    type: text("type").notNull(), // income, expense
    category: text("category").notNull(), // fees, salary, utilities, etc.
    description: text("description").notNull(),
    
    amount: real("amount").notNull(),
    transactionDate: timestamp("transactionDate", { mode: "date" }).notNull(),
    
    // Reference to source table
    referenceType: text("referenceType"), // feePayment, staffSalary, expense
    referenceId: text("referenceId"), // ID from the source table
    
    // Additional details
    paymentMethod: text("paymentMethod"),
    transactionReference: text("transactionReference"),
    
    recordedBy: text("recordedBy")
      .notNull()
      .references(() => staff.id),
    
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      typeIdx: index().on(table.type),
      categoryIdx: index().on(table.category),
      dateIdx: index().on(table.transactionDate),
    };
  },
);

// Budget Management
export const budgets = pgTable(
  "budgets",
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
    category: text("category").notNull(), // Overall, Department-specific
    academicYear: text("academicYear").notNull(),
    
    // Budget amounts
    totalBudget: real("totalBudget").notNull(),
    allocatedAmount: real("allocatedAmount").default(0),
    spentAmount: real("spentAmount").default(0),
    remainingAmount: real("remainingAmount").default(0),
    
    period: text("period").notNull(), // annual, monthly, quarterly
    startDate: timestamp("startDate", { mode: "date" }).notNull(),
    endDate: timestamp("endDate", { mode: "date" }).notNull(),
    
    status: text("status").default("active"), // active, completed, suspended
    
    createdBy: text("createdBy")
      .notNull()
      .references(() => staff.id),
    
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      academicYearIdx: index().on(table.academicYear),
    };
  },
);

// Payment Reminders
export const paymentReminders = pgTable(
  "paymentReminders",
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
    studentId: text("studentId")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    
    reminderType: text("reminderType").notNull(), // fee_due, overdue
    message: text("message").notNull(),
    amount: real("amount").notNull(),
    dueDate: timestamp("dueDate", { mode: "date" }).notNull(),
    
    // Delivery details
    method: text("method").notNull(), // sms, email, both
    recipientPhone: text("recipientPhone"),
    recipientEmail: text("recipientEmail"),
    
    status: text("status").default("pending"), // pending, sent, failed
    sentAt: timestamp("sentAt", { mode: "date" }),
    
    createdBy: text("createdBy")
      .notNull()
      .references(() => staff.id),
    
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      schoolIdIdx: index().on(table.schoolId),
      studentIdIdx: index().on(table.studentId),
      statusIdx: index().on(table.status),
    };
  },
);

// Add relations for new tables
export const feeStructureRelations = relations(feeStructures, ({ one }) => ({
  school: one(schools, { fields: [feeStructures.schoolId], references: [schools.id] }),
}));

export const staffSalaryRelations = relations(staffSalaries, ({ one }) => ({
  staff: one(staff, { fields: [staffSalaries.staffId], references: [staff.id] }),
  school: one(schools, { fields: [staffSalaries.schoolId], references: [schools.id] }),
  processor: one(staff, { fields: [staffSalaries.processedBy], references: [staff.id] }),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
  school: one(schools, { fields: [expenses.schoolId], references: [schools.id] }),
  approver: one(staff, { fields: [expenses.approvedBy], references: [staff.id] }),
  recorder: one(staff, { fields: [expenses.recordedBy], references: [staff.id] }),
}));

export const financialTransactionRelations = relations(financialTransactions, ({ one }) => ({
  school: one(schools, { fields: [financialTransactions.schoolId], references: [schools.id] }),
  recorder: one(staff, { fields: [financialTransactions.recordedBy], references: [staff.id] }),
}));

export const budgetRelations = relations(budgets, ({ one }) => ({
  school: one(schools, { fields: [budgets.schoolId], references: [schools.id] }),
  creator: one(staff, { fields: [budgets.createdBy], references: [staff.id] }),
}));

export const paymentReminderRelations = relations(paymentReminders, ({ one }) => ({
  school: one(schools, { fields: [paymentReminders.schoolId], references: [schools.id] }),
  student: one(students, { fields: [paymentReminders.studentId], references: [students.id] }),
  creator: one(staff, { fields: [paymentReminders.createdBy], references: [staff.id] }),
}));

// Enhanced feePayments to add more fields (extend existing table)
// You should modify your existing feePayments table to include these fields:
/*
  Add these columns to your existing feePayments table:
  - feeStructureId: text("feeStructureId").references(() => feeStructures.id)
  - parentGuardianId: text("parentGuardianId").references(() => guardians.id)
  - paymentStatus: text("paymentStatus").default("completed") // completed, partial, failed
  - balanceAmount: real("balanceAmount").default(0)
  - receiptNumber: text("receiptNumber")
  - receiptUrl: text("receiptUrl")
*/

// Website Builder Relations
export const websitePageRelations = relations(websitePages, ({ one, many }) => ({
  school: one(schools, { fields: [websitePages.schoolId], references: [schools.id] }),
  creator: one(users, { fields: [websitePages.createdBy], references: [users.id] }),
  blocks: many(websiteBlocks),
}));

export const websiteBlockRelations = relations(websiteBlocks, ({ one }) => ({
  school: one(schools, { fields: [websiteBlocks.schoolId], references: [schools.id] }),
  page: one(websitePages, { fields: [websiteBlocks.pageId], references: [websitePages.id] }),
}));

export const websiteConfigRelations = relations(websiteConfigs, ({ one }) => ({
  school: one(schools, { fields: [websiteConfigs.schoolId], references: [schools.id] }),
  theme: one(websiteThemes, { fields: [websiteConfigs.themeId], references: [websiteThemes.id] }),
}));

export const websiteThemeRelations = relations(websiteThemes, ({ many }) => ({
  configs: many(websiteConfigs),
}));

export const websiteMediaRelations = relations(websiteMedia, ({ one }) => ({
  school: one(schools, { fields: [websiteMedia.schoolId], references: [schools.id] }),
  uploader: one(users, { fields: [websiteMedia.uploadedBy], references: [users.id] }),
}));

export const websiteFormRelations = relations(websiteForms, ({ one, many }) => ({
  school: one(schools, { fields: [websiteForms.schoolId], references: [schools.id] }),
  creator: one(users, { fields: [websiteForms.createdBy], references: [users.id] }),
  submissions: many(websiteFormSubmissions),
}));

export const websiteFormSubmissionRelations = relations(websiteFormSubmissions, ({ one }) => ({
  form: one(websiteForms, { fields: [websiteFormSubmissions.formId], references: [websiteForms.id] }),
  school: one(schools, { fields: [websiteFormSubmissions.schoolId], references: [schools.id] }),
}));

// Add website relations to schools
export const schoolWebsiteRelations = relations(schools, ({ one, many }) => ({
  // ... existing relations
  websiteConfig: one(websiteConfigs),
  websitePages: many(websitePages),
  websiteBlocks: many(websiteBlocks),
  websiteMedia: many(websiteMedia),
  websiteForms: many(websiteForms),
}));

// Add types for new tables
export type SelectFeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = typeof feeStructures.$inferInsert;
export type SelectStaffSalary = typeof staffSalaries.$inferSelect;
export type InsertStaffSalary = typeof staffSalaries.$inferInsert;
export type SelectExpense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
export type SelectFinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = typeof financialTransactions.$inferInsert;
export type SelectBudget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
export type SelectPaymentReminder = typeof paymentReminders.$inferSelect;
export type InsertPaymentReminder = typeof paymentReminders.$inferInsert;

// Website Builder Types
export type SelectWebsitePage = typeof websitePages.$inferSelect;
export type InsertWebsitePage = typeof websitePages.$inferInsert;
export type SelectWebsiteBlock = typeof websiteBlocks.$inferSelect;
export type InsertWebsiteBlock = typeof websiteBlocks.$inferInsert;
export type SelectWebsiteTheme = typeof websiteThemes.$inferSelect;
export type InsertWebsiteTheme = typeof websiteThemes.$inferInsert;
export type SelectWebsiteConfig = typeof websiteConfigs.$inferSelect;
export type InsertWebsiteConfig = typeof websiteConfigs.$inferInsert;
export type SelectWebsiteMedia = typeof websiteMedia.$inferSelect;
export type InsertWebsiteMedia = typeof websiteMedia.$inferInsert;
export type SelectWebsiteForm = typeof websiteForms.$inferSelect;
export type InsertWebsiteForm = typeof websiteForms.$inferInsert;
export type SelectWebsiteFormSubmission = typeof websiteFormSubmissions.$inferSelect;
export type InsertWebsiteFormSubmission = typeof websiteFormSubmissions.$inferInsert;
