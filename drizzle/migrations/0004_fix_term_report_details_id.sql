-- Fix term_report_details table structure
ALTER TABLE term_report_details 
  ALTER COLUMN id TYPE VARCHAR(255),
  ALTER COLUMN term_report_id TYPE VARCHAR(255),
  ALTER COLUMN subject_id TYPE VARCHAR(255);

-- Fix any null values that might exist in the table
UPDATE term_report_details 
SET class_position = 0 
WHERE class_position IS NULL;

-- Set default values and not null constraints
ALTER TABLE term_report_details
  ALTER COLUMN class_score SET NOT NULL,
  ALTER COLUMN class_score SET DEFAULT 0,
  ALTER COLUMN exam_score SET NOT NULL,
  ALTER COLUMN exam_score SET DEFAULT 0,
  ALTER COLUMN total_score SET NOT NULL,
  ALTER COLUMN total_score SET DEFAULT 0,
  ALTER COLUMN class_position SET NOT NULL,
  ALTER COLUMN class_position SET DEFAULT 0;
