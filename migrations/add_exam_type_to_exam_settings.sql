-- Migration: Add exam_type column to exam_settings table
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS exam_type VARCHAR(255);
