-- Add semester column to subject_detail table
-- This migration adds a semester column with a default value of 1 for existing subjects

-- Add the semester column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subject_detail' 
        AND column_name = 'semester'
    ) THEN
        ALTER TABLE subject_detail ADD COLUMN semester INTEGER DEFAULT 1;
        
        -- Update existing subjects to have semester 1 by default
        UPDATE subject_detail SET semester = 1 WHERE semester IS NULL;
        
        -- Make the column NOT NULL after setting default values
        ALTER TABLE subject_detail ALTER COLUMN semester SET NOT NULL;
    END IF;
END $$;

-- Add an index on semester for better query performance
CREATE INDEX IF NOT EXISTS idx_subject_detail_semester ON subject_detail(semester);

-- Add a composite index for year and semester queries
CREATE INDEX IF NOT EXISTS idx_subject_detail_year_semester ON subject_detail(year, semester);
