-- Fix term_report_details table
ALTER TABLE term_report_details
  ALTER COLUMN class_score SET NOT NULL,
  ALTER COLUMN class_score SET DEFAULT 0,
  ALTER COLUMN exam_score SET NOT NULL,
  ALTER COLUMN exam_score SET DEFAULT 0,
  ALTER COLUMN total_score SET NOT NULL,
  ALTER COLUMN total_score SET DEFAULT 0,
  ALTER COLUMN class_position SET NOT NULL,
  ALTER COLUMN class_position SET DEFAULT 0,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;
