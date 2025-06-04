CREATE TABLE "academicTerms" (
	"id" text PRIMARY KEY NOT NULL,
	"academicYearId" text NOT NULL,
	"schoolId" text NOT NULL,
	"name" text NOT NULL,
	"termNumber" integer NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"isCurrent" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academicYears" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"name" text NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"isCurrent" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batchEnrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"batchId" text NOT NULL,
	"studentId" text NOT NULL,
	"enrollmentDate" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"name" text NOT NULL,
	"gradeLevel" text NOT NULL,
	"capacity" integer NOT NULL,
	"academicYearId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"department" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"class_score_weight" integer DEFAULT 30,
	"exam_score_weight" integer DEFAULT 70,
	"pass_mark" integer DEFAULT 50,
	"highest_mark" integer DEFAULT 100,
	"use_grade_system" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "examPercentageConfigs" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"name" text NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"continuousAssessmentPercent" integer DEFAULT 30 NOT NULL,
	"examPercent" integer DEFAULT 70 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"academic_year" text NOT NULL,
	"term" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exam_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"student_id" text NOT NULL,
	"raw_score" numeric(5, 2) NOT NULL,
	"scaled_score" numeric(5, 2),
	"grade_id" integer,
	"remarks" text,
	"graded_by" text,
	"graded_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exam_students" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exam_types" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"weight" integer NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"exam_period_id" integer NOT NULL,
	"class_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"exam_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"exam_code" text NOT NULL,
	"academic_year" text NOT NULL,
	"term" text NOT NULL,
	"start_time" time DEFAULT '09:00:00' NOT NULL,
	"end_time" time DEFAULT '11:00:00' NOT NULL,
	"responsible_staff_id" text NOT NULL,
	"total_marks" integer DEFAULT 100 NOT NULL,
	"duration" integer,
	"exam_date" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grade_system" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"grade_name" text NOT NULL,
	"min_score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"interpretation" text,
	"grade_point" numeric(3, 1),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "periods" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"time" text NOT NULL,
	"label" text NOT NULL,
	"orderIndex" integer NOT NULL,
	"type" text DEFAULT 'class' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studentClassHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"classId" text NOT NULL,
	"academicYearId" text NOT NULL,
	"schoolId" text NOT NULL,
	"enrollmentDate" timestamp NOT NULL,
	"endDate" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"performanceSummary" json,
	"comments" text,
	"recordedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studentCourses" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"courseId" text NOT NULL,
	"enrollmentDate" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studentSubjects" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"subjectId" text NOT NULL,
	"enrollmentDate" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjectCourses" (
	"id" text PRIMARY KEY NOT NULL,
	"subjectId" text NOT NULL,
	"courseId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "term_report_details" (
	"id" text PRIMARY KEY NOT NULL,
	"term_report_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"class_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"exam_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"grade_id" integer,
	"position" integer,
	"course_position" integer,
	"batch_position" integer,
	"class_position" integer DEFAULT 0 NOT NULL,
	"teacher_remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "term_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"academic_term_id" text NOT NULL,
	"total_marks" real NOT NULL,
	"average_score" real NOT NULL,
	"rank" text NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "termResults" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"classId" text NOT NULL,
	"subjectId" text NOT NULL,
	"schoolId" text NOT NULL,
	"academicYearId" text,
	"academicTermId" text,
	"academicYear" text NOT NULL,
	"term" text NOT NULL,
	"continuousAssessmentScore" real NOT NULL,
	"examScore" real NOT NULL,
	"totalScore" real NOT NULL,
	"grade" text NOT NULL,
	"remark" text NOT NULL,
	"position" integer,
	"percentageConfigId" text,
	"recordedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetables" (
	"id" text PRIMARY KEY NOT NULL,
	"schoolId" text NOT NULL,
	"classId" text NOT NULL,
	"subjectId" text NOT NULL,
	"teacherId" text NOT NULL,
	"day" text NOT NULL,
	"period" text NOT NULL,
	"room" text NOT NULL,
	"academicYearId" text NOT NULL,
	"academicTermId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessmentResults" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assessments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "assessmentResults" CASCADE;--> statement-breakpoint
DROP TABLE "assessments" CASCADE;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "role" text DEFAULT 'teacher';--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "isActive" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "courseId" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "isOptional" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "schoolId" text;--> statement-breakpoint
ALTER TABLE "academicTerms" ADD CONSTRAINT "academicTerms_academicYearId_academicYears_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYears"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "academicTerms" ADD CONSTRAINT "academicTerms_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "academicYears" ADD CONSTRAINT "academicYears_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "batchEnrollments" ADD CONSTRAINT "batchEnrollments_batchId_batches_id_fk" FOREIGN KEY ("batchId") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "batchEnrollments" ADD CONSTRAINT "batchEnrollments_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_academicYearId_academicYears_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYears"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "exam_configurations" ADD CONSTRAINT "exam_configurations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examPercentageConfigs" ADD CONSTRAINT "examPercentageConfigs_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "exam_periods" ADD CONSTRAINT "exam_periods_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_grade_id_grade_system_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grade_system"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_students" ADD CONSTRAINT "exam_students_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_students" ADD CONSTRAINT "exam_students_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_types" ADD CONSTRAINT "exam_types_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_exam_period_id_exam_periods_id_fk" FOREIGN KEY ("exam_period_id") REFERENCES "public"."exam_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_exam_type_exam_types_id_fk" FOREIGN KEY ("exam_type") REFERENCES "public"."exam_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_academic_year_academicYears_id_fk" FOREIGN KEY ("academic_year") REFERENCES "public"."academicYears"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_term_academicTerms_id_fk" FOREIGN KEY ("term") REFERENCES "public"."academicTerms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_responsible_staff_id_staff_id_fk" FOREIGN KEY ("responsible_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_system" ADD CONSTRAINT "grade_system_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periods" ADD CONSTRAINT "periods_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "studentClassHistory" ADD CONSTRAINT "studentClassHistory_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "studentClassHistory" ADD CONSTRAINT "studentClassHistory_classId_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "studentClassHistory" ADD CONSTRAINT "studentClassHistory_academicYearId_academicYears_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYears"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "studentClassHistory" ADD CONSTRAINT "studentClassHistory_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "studentClassHistory" ADD CONSTRAINT "studentClassHistory_recordedBy_staff_id_fk" FOREIGN KEY ("recordedBy") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "studentCourses" ADD CONSTRAINT "studentCourses_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "studentCourses" ADD CONSTRAINT "studentCourses_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "studentSubjects" ADD CONSTRAINT "studentSubjects_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "studentSubjects" ADD CONSTRAINT "studentSubjects_subjectId_subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subjectCourses" ADD CONSTRAINT "subjectCourses_subjectId_subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subjectCourses" ADD CONSTRAINT "subjectCourses_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "term_report_details" ADD CONSTRAINT "term_report_details_term_report_id_term_reports_id_fk" FOREIGN KEY ("term_report_id") REFERENCES "public"."term_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_report_details" ADD CONSTRAINT "term_report_details_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_report_details" ADD CONSTRAINT "term_report_details_grade_id_grade_system_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grade_system"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_reports" ADD CONSTRAINT "term_reports_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "term_reports" ADD CONSTRAINT "term_reports_academic_year_id_academicYears_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academicYears"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "term_reports" ADD CONSTRAINT "term_reports_academic_term_id_academicTerms_id_fk" FOREIGN KEY ("academic_term_id") REFERENCES "public"."academicTerms"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "termResults" ADD CONSTRAINT "termResults_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "termResults" ADD CONSTRAINT "termResults_classId_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "termResults" ADD CONSTRAINT "termResults_subjectId_subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "termResults" ADD CONSTRAINT "termResults_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "termResults" ADD CONSTRAINT "termResults_academicYearId_academicYears_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYears"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "termResults" ADD CONSTRAINT "termResults_academicTermId_academicTerms_id_fk" FOREIGN KEY ("academicTermId") REFERENCES "public"."academicTerms"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "termResults" ADD CONSTRAINT "termResults_percentageConfigId_examPercentageConfigs_id_fk" FOREIGN KEY ("percentageConfigId") REFERENCES "public"."examPercentageConfigs"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "termResults" ADD CONSTRAINT "termResults_recordedBy_staff_id_fk" FOREIGN KEY ("recordedBy") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_classId_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_subjectId_subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_teacherId_staff_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_academicYearId_academicYears_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYears"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_academicTermId_academicTerms_id_fk" FOREIGN KEY ("academicTermId") REFERENCES "public"."academicTerms"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "academicTerms_academicYearId_index" ON "academicTerms" USING btree ("academicYearId");--> statement-breakpoint
CREATE INDEX "academicTerms_schoolId_index" ON "academicTerms" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "academicTerms_schoolId_isCurrent_index" ON "academicTerms" USING btree ("schoolId","isCurrent");--> statement-breakpoint
CREATE UNIQUE INDEX "academicTerms_academicYearId_termNumber_index" ON "academicTerms" USING btree ("academicYearId","termNumber");--> statement-breakpoint
CREATE INDEX "academicYears_schoolId_index" ON "academicYears" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "academicYears_schoolId_isCurrent_index" ON "academicYears" USING btree ("schoolId","isCurrent");--> statement-breakpoint
CREATE INDEX "batchEnrollments_batchId_index" ON "batchEnrollments" USING btree ("batchId");--> statement-breakpoint
CREATE INDEX "batchEnrollments_studentId_index" ON "batchEnrollments" USING btree ("studentId");--> statement-breakpoint
CREATE UNIQUE INDEX "batchEnrollments_batchId_studentId_index" ON "batchEnrollments" USING btree ("batchId","studentId");--> statement-breakpoint
CREATE INDEX "batches_schoolId_index" ON "batches" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "batches_academicYearId_index" ON "batches" USING btree ("academicYearId");--> statement-breakpoint
CREATE UNIQUE INDEX "batches_schoolId_gradeLevel_academicYearId_index" ON "batches" USING btree ("schoolId","gradeLevel","academicYearId");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_config_school_id_unique_idx" ON "exam_configurations" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "examPercentageConfigs_schoolId_index" ON "examPercentageConfigs" USING btree ("schoolId");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_score_unique_idx" ON "exam_scores" USING btree ("exam_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_student_unique_idx" ON "exam_students" USING btree ("exam_id","student_id");--> statement-breakpoint
CREATE INDEX "periods_schoolId_index" ON "periods" USING btree ("schoolId");--> statement-breakpoint
CREATE UNIQUE INDEX "periods_schoolId_orderIndex_index" ON "periods" USING btree ("schoolId","orderIndex");--> statement-breakpoint
CREATE INDEX "studentClassHistory_studentId_index" ON "studentClassHistory" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "studentClassHistory_classId_index" ON "studentClassHistory" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "studentClassHistory_academicYearId_index" ON "studentClassHistory" USING btree ("academicYearId");--> statement-breakpoint
CREATE INDEX "studentClassHistory_schoolId_index" ON "studentClassHistory" USING btree ("schoolId");--> statement-breakpoint
CREATE UNIQUE INDEX "studentClassHistory_studentId_academicYearId_index" ON "studentClassHistory" USING btree ("studentId","academicYearId");--> statement-breakpoint
CREATE INDEX "studentCourses_studentId_index" ON "studentCourses" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "studentCourses_courseId_index" ON "studentCourses" USING btree ("courseId");--> statement-breakpoint
CREATE UNIQUE INDEX "studentCourses_studentId_courseId_index" ON "studentCourses" USING btree ("studentId","courseId");--> statement-breakpoint
CREATE INDEX "studentSubjects_studentId_index" ON "studentSubjects" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "studentSubjects_subjectId_index" ON "studentSubjects" USING btree ("subjectId");--> statement-breakpoint
CREATE UNIQUE INDEX "studentSubjects_studentId_subjectId_index" ON "studentSubjects" USING btree ("studentId","subjectId");--> statement-breakpoint
CREATE INDEX "subjectCourses_subjectId_index" ON "subjectCourses" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "subjectCourses_courseId_index" ON "subjectCourses" USING btree ("courseId");--> statement-breakpoint
CREATE UNIQUE INDEX "subjectCourses_subjectId_courseId_index" ON "subjectCourses" USING btree ("subjectId","courseId");--> statement-breakpoint
CREATE UNIQUE INDEX "term_report_detail_unique_idx" ON "term_report_details" USING btree ("term_report_id","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "term_report_unique_idx" ON "term_reports" USING btree ("student_id","academic_year_id","academic_term_id");--> statement-breakpoint
CREATE INDEX "termResults_studentId_index" ON "termResults" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "termResults_classId_index" ON "termResults" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "termResults_subjectId_index" ON "termResults" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "termResults_schoolId_index" ON "termResults" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "termResults_academicYearId_index" ON "termResults" USING btree ("academicYearId");--> statement-breakpoint
CREATE INDEX "termResults_academicTermId_index" ON "termResults" USING btree ("academicTermId");--> statement-breakpoint
CREATE UNIQUE INDEX "termResults_studentId_subjectId_academicYearId_academicTermId_index" ON "termResults" USING btree ("studentId","subjectId","academicYearId","academicTermId");--> statement-breakpoint
CREATE INDEX "timetables_schoolId_index" ON "timetables" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "timetables_classId_index" ON "timetables" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "timetables_subjectId_index" ON "timetables" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "timetables_teacherId_index" ON "timetables" USING btree ("teacherId");--> statement-breakpoint
CREATE INDEX "timetables_academicYearId_index" ON "timetables" USING btree ("academicYearId");--> statement-breakpoint
CREATE INDEX "timetables_academicTermId_index" ON "timetables" USING btree ("academicTermId");--> statement-breakpoint
CREATE UNIQUE INDEX "timetables_classId_day_period_academicYearId_academicTermId_index" ON "timetables" USING btree ("classId","day","period","academicYearId","academicTermId");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "currentGradeLevel";--> statement-breakpoint
ALTER TABLE "subjects" DROP COLUMN "gradeLevel";