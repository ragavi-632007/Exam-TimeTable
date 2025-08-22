-- Migration: Add refid and semester columns to exam_settings table
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS refid VARCHAR(255);
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS semester INTEGER;
