-- Complete update to exam_settings table to store all exam alert data
-- This migration adds all missing columns needed for proper exam alert functionality

-- Add year column (if not already exists from previous migration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_settings' 
        AND column_name = 'year'
    ) THEN
        ALTER TABLE exam_settings ADD COLUMN year INTEGER;
        ALTER TABLE exam_settings ADD CONSTRAINT check_valid_exam_year CHECK (year IN (2, 3));
    END IF;
END $$;

-- Add semester column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_settings' 
        AND column_name = 'semester'
    ) THEN
        ALTER TABLE exam_settings ADD COLUMN semester INTEGER;
        ALTER TABLE exam_settings ADD CONSTRAINT check_valid_semester CHECK (semester BETWEEN 1 AND 8);
    END IF;
END $$;

-- Add exam_type column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_settings' 
        AND column_name = 'exam_type'
    ) THEN
        ALTER TABLE exam_settings ADD COLUMN exam_type VARCHAR(50);
        ALTER TABLE exam_settings ADD CONSTRAINT check_valid_exam_type 
        CHECK (exam_type IN ('IA1', 'IA2', 'IA3', 'MODEL', 'END_SEM', 'Internal Assessment-I', 'Internal Assessment-II', 'Model Exam', 'End Semester'));
    END IF;
END $$;

-- Add refid column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_settings' 
        AND column_name = 'refid'
    ) THEN
        ALTER TABLE exam_settings ADD COLUMN refid VARCHAR(100);
    END IF;
END $$;

-- Add alert_date column (for notification/alert scheduling)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_settings' 
        AND column_name = 'alert_date'
    ) THEN
        ALTER TABLE exam_settings ADD COLUMN alert_date DATE;
    END IF;
END $$;

-- Add status column for exam alert status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_settings' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE exam_settings ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        ALTER TABLE exam_settings ADD CONSTRAINT check_valid_status CHECK (status IN ('active', 'closed', 'draft'));
    END IF;
END $$;

-- Add title column for exam alert title
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_settings' 
        AND column_name = 'title'
    ) THEN
        ALTER TABLE exam_settings ADD COLUMN title VARCHAR(500);
    END IF;
END $$;

-- Add departments column to store which departments the alert applies to
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_settings' 
        AND column_name = 'departments'
    ) THEN
        ALTER TABLE exam_settings ADD COLUMN departments JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exam_settings_year ON exam_settings(year);
CREATE INDEX IF NOT EXISTS idx_exam_settings_semester ON exam_settings(semester);
CREATE INDEX IF NOT EXISTS idx_exam_settings_exam_type ON exam_settings(exam_type);
CREATE INDEX IF NOT EXISTS idx_exam_settings_status ON exam_settings(status);
CREATE INDEX IF NOT EXISTS idx_exam_settings_created_by ON exam_settings(created_by);

-- Add a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_exam_settings_year_semester ON exam_settings(year, semester);