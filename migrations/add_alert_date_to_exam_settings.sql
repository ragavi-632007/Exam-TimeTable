-- Migration: Add alert_date column to exam_settings table
ALTER TABLE exam_settings ADD COLUMN IF NOT EXISTS alert_date DATE;
