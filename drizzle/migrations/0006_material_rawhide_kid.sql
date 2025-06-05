CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"academicYear" text NOT NULL,
	"totalBudget" real NOT NULL,
	"allocatedAmount" real DEFAULT 0,
	"spentAmount" real DEFAULT 0,
	"remainingAmount" real DEFAULT 0,
	"period" text NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"status" text DEFAULT 'active',
	"createdBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"vendor" text NOT NULL,
	"department" text NOT NULL,
	"amount" real NOT NULL,
	"expenseDate" timestamp NOT NULL,
	"paymentMethod" text,
	"paymentReference" text,
	"receiptUrl" text,
	"status" text DEFAULT 'pending',
	"approvedBy" text,
	"approvedAt" timestamp,
	"recordedBy" text NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeStructures" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"className" text NOT NULL,
	"level" text NOT NULL,
	"academicYear" text NOT NULL,
	"tuitionFee" real DEFAULT 0 NOT NULL,
	"activitiesFee" real DEFAULT 0 NOT NULL,
	"examinationFee" real DEFAULT 0 NOT NULL,
	"libraryFee" real DEFAULT 0 NOT NULL,
	"laboratoryFee" real DEFAULT 0 NOT NULL,
	"transportFee" real DEFAULT 0 NOT NULL,
	"totalFee" real NOT NULL,
	"status" text DEFAULT 'active',
	"studentsEnrolled" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financialTransactions" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"transactionDate" timestamp NOT NULL,
	"referenceType" text,
	"referenceId" text,
	"paymentMethod" text,
	"transactionReference" text,
	"recordedBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paymentReminders" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"studentId" text NOT NULL,
	"reminderType" text NOT NULL,
	"message" text NOT NULL,
	"amount" real NOT NULL,
	"dueDate" timestamp NOT NULL,
	"method" text NOT NULL,
	"recipientPhone" text,
	"recipientEmail" text,
	"status" text DEFAULT 'pending',
	"sentAt" timestamp,
	"createdBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staffSalaries" (
	"id" text PRIMARY KEY NOT NULL,
	"staffId" text NOT NULL,
	"schoolId" text NOT NULL,
	"baseSalary" real NOT NULL,
	"allowances" real DEFAULT 0,
	"deductions" real DEFAULT 0,
	"netSalary" real NOT NULL,
	"paymentDate" timestamp,
	"paymentMethod" text,
	"paymentReference" text,
	"accountNumber" text,
	"payPeriod" text NOT NULL,
	"academicYear" text NOT NULL,
	"status" text DEFAULT 'pending',
	"processedBy" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_createdBy_staff_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approvedBy_staff_id_fk" FOREIGN KEY ("approvedBy") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recordedBy_staff_id_fk" FOREIGN KEY ("recordedBy") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeStructures" ADD CONSTRAINT "feeStructures_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "financialTransactions" ADD CONSTRAINT "financialTransactions_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "financialTransactions" ADD CONSTRAINT "financialTransactions_recordedBy_staff_id_fk" FOREIGN KEY ("recordedBy") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentReminders" ADD CONSTRAINT "paymentReminders_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "paymentReminders" ADD CONSTRAINT "paymentReminders_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "paymentReminders" ADD CONSTRAINT "paymentReminders_createdBy_staff_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffSalaries" ADD CONSTRAINT "staffSalaries_staffId_staff_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "staffSalaries" ADD CONSTRAINT "staffSalaries_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "staffSalaries" ADD CONSTRAINT "staffSalaries_processedBy_staff_id_fk" FOREIGN KEY ("processedBy") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_schoolId_index" ON "budgets" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "budgets_academicYear_index" ON "budgets" USING btree ("academicYear");--> statement-breakpoint
CREATE INDEX "expenses_schoolId_index" ON "expenses" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "expenses_category_index" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expenses_status_index" ON "expenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feeStructures_schoolId_index" ON "feeStructures" USING btree ("schoolId");--> statement-breakpoint
CREATE UNIQUE INDEX "feeStructures_schoolId_className_academicYear_index" ON "feeStructures" USING btree ("schoolId","className","academicYear");--> statement-breakpoint
CREATE INDEX "financialTransactions_schoolId_index" ON "financialTransactions" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "financialTransactions_type_index" ON "financialTransactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "financialTransactions_category_index" ON "financialTransactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "financialTransactions_transactionDate_index" ON "financialTransactions" USING btree ("transactionDate");--> statement-breakpoint
CREATE INDEX "paymentReminders_schoolId_index" ON "paymentReminders" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "paymentReminders_studentId_index" ON "paymentReminders" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "paymentReminders_status_index" ON "paymentReminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staffSalaries_staffId_index" ON "staffSalaries" USING btree ("staffId");--> statement-breakpoint
CREATE INDEX "staffSalaries_schoolId_index" ON "staffSalaries" USING btree ("schoolId");--> statement-breakpoint
CREATE UNIQUE INDEX "staffSalaries_staffId_payPeriod_index" ON "staffSalaries" USING btree ("staffId","payPeriod");