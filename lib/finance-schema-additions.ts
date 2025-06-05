import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { schools, staff, students } from "@/lib/schema";

// Add these new tables to your schema.ts file for complete finance module support

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
