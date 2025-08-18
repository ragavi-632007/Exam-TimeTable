-- Add missing columns to exam_settings table for storing exam alert data
-- This migration adds semester, exam_type, refid, and alert_date columns

-- Add semester column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_settings' 
        AND column_name = 'semester'
    ) THEN
        ALTER TABLE exam_settings ADD COLUMN semester INTEGER;
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

-- Add alert_date column
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