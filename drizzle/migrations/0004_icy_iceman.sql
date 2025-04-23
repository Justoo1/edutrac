CREATE TABLE "guardian_students" (
	"id" text PRIMARY KEY NOT NULL,
	"guardianId" text NOT NULL,
	"studentId" text NOT NULL,
	"isPrimary" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardians" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"firstName" varchar NOT NULL,
	"lastName" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"alternativePhone" varchar,
	"relationship" varchar NOT NULL,
	"occupation" varchar,
	"address" text,
	"emergencyContact" boolean DEFAULT true,
	"notes" text,
	"status" varchar DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guardians_userId_unique" UNIQUE("userId"),
	CONSTRAINT "guardians_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "primaryColor" text DEFAULT '#000000';--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "secondaryColor" text DEFAULT '#ffffff';--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "accentColor" text DEFAULT '#0066cc';--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "layout" text DEFAULT 'classic';--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "customCSS" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "footerContent" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "welcomeMessage" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "keywords" text;--> statement-breakpoint
ALTER TABLE "guardian_students" ADD CONSTRAINT "guardian_students_guardianId_guardians_id_fk" FOREIGN KEY ("guardianId") REFERENCES "public"."guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_students" ADD CONSTRAINT "guardian_students_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;