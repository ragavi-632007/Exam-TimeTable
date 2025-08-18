-- Updated Complete Database Schema for Exam Management System
-- This schema includes all the necessary columns for proper exam alert functionality

-- Create departments table
CREATE TABLE departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_details table
CREATE TABLE staff_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    department VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255),
    subject_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subject_detail table
CREATE TABLE subject_detail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subcode VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL CHECK (year IN (2, 3)),
    semester INTEGER NOT NULL DEFAULT 1 CHECK (semester BETWEEN 1 AND 8),
    is_shared BOOLEAN DEFAULT false,
    shared_subject_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exam_settings table (updated with all necessary columns)
CREATE TABLE exam_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_start_date DATE NOT NULL,
    exam_end_date DATE NOT NULL,
    year INTEGER CHECK (year IN (2, 3)),
    semester INTEGER CHECK (semester BETWEEN 1 AND 8),
    exam_type VARCHAR(50) CHECK (exam_type IN ('IA1', 'IA2', 'IA3', 'MODEL', 'END_SEM', 'Internal Assessment-I', 'Internal Assessment-II', 'Model Exam', 'End Semester')),
    refid VARCHAR(100),
    alert_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    title VARCHAR(500),
    departments JSONB DEFAULT '[]',
    holidays JSONB DEFAULT '[]',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exam_schedules table
CREATE TABLE exam_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subject_detail(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES staff_details(id) ON DELETE CASCADE,
    priority_department UUID,
    exam_type VARCHAR(10) CHECK (exam_type IN ('IA1', 'IA2', 'IA3')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, department_id)
);

-- Create staff_subjects table for handling multiple subjects per staff member
CREATE TABLE staff_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff_details(id) ON DELETE CASCADE,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, subject_code)
);

-- Add indexes for better query performance
CREATE INDEX idx_staff_subjects_staff_id ON staff_subjects(staff_id);
CREATE INDEX idx_exam_schedules_subject_id ON exam_schedules(subject_id);
CREATE INDEX idx_exam_schedules_department_id ON exam_schedules(department_id);
CREATE INDEX idx_exam_schedules_assigned_by ON exam_schedules(assigned_by);
CREATE INDEX idx_subject_detail_semester ON subject_detail(semester);
CREATE INDEX idx_subject_detail_year_semester ON subject_detail(year, semester);
CREATE INDEX idx_exam_settings_year ON exam_settings(year);
CREATE INDEX idx_exam_settings_semester ON exam_settings(semester);
CREATE INDEX idx_exam_settings_exam_type ON exam_settings(exam_type);
CREATE INDEX idx_exam_settings_status ON exam_settings(status);
CREATE INDEX idx_exam_settings_created_by ON exam_settings(created_by);
CREATE INDEX idx_exam_settings_year_semester ON exam_settings(year, semester);