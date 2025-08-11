-- Add check constraint to subject_detail table to only allow years 2 and 3
ALTER TABLE subject_detail ADD CONSTRAINT check_valid_year CHECK (year IN (2, 3));

-- Update any existing records with year = 1 or year = 4 to be year = 2
UPDATE subject_detail SET year = 2 WHERE year NOT IN (2, 3);

-- Add similar constraint to exam_settings table for consistency
ALTER TABLE exam_settings ADD COLUMN year INTEGER;
ALTER TABLE exam_settings ADD CONSTRAINT check_valid_exam_year CHECK (year IN (2, 3));
