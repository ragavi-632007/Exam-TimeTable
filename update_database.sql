-- Complete database update script for exam management system
-- Run this in your Supabase SQL Editor to update your database structure

-- 1. Add missing columns to exam_settings table
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS semester INTEGER;
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS exam_type VARCHAR(50);
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS refid VARCHAR(100);
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS alert_date DATE;
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS title VARCHAR(500);
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS departments JSONB DEFAULT '[]';

-- 2. Add constraints for data validation
ALTER TABLE exam_settings ADD CONSTRAINT IF NOT EXISTS check_valid_exam_year CHECK (year IN (2, 3));
ALTER TABLE exam_settings ADD CONSTRAINT IF NOT EXISTS check_valid_semester CHECK (semester BETWEEN 1 AND 8);
ALTER TABLE exam_settings ADD CONSTRAINT IF NOT EXISTS check_valid_exam_type 
CHECK (exam_type IN ('IA1', 'IA2', 'IA3', 'MODEL', 'END_SEM', 'Internal Assessment-I', 'Internal Assessment-II', 'Model Exam', 'End Semester'));
ALTER TABLE exam_settings ADD CONSTRAINT IF NOT EXISTS check_valid_status CHECK (status IN ('active', 'closed', 'draft'));

-- 3. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exam_settings_year ON exam_settings(year);
CREATE INDEX IF NOT EXISTS idx_exam_settings_semester ON exam_settings(semester);
CREATE INDEX IF NOT EXISTS idx_exam_settings_exam_type ON exam_settings(exam_type);
CREATE INDEX IF NOT EXISTS idx_exam_settings_status ON exam_settings(status);
CREATE INDEX IF NOT EXISTS idx_exam_settings_created_by ON exam_settings(created_by);
CREATE INDEX IF NOT EXISTS idx_exam_settings_year_semester ON exam_settings(year, semester);

-- 4. Update any existing records to have default values
UPDATE exam_settings SET 
    year = 2,
    semester = 1,
    status = 'active',
    departments = '[]'
WHERE year IS NULL OR semester IS NULL OR status IS NULL OR departments IS NULL;

-- 5. Show updated table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'exam_settings' 
ORDER BY ordinal_position;