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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subject_detail table
CREATE TABLE subject_detail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subcode VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL DEFAULT 1,
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exam_settings table
CREATE TABLE exam_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_start_date DATE NOT NULL,
    exam_end_date DATE NOT NULL,
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
    assigned_by UUID NOT NULL,
    priority_department UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Add first subject
INSERT INTO staff_subjects (staff_id, subject_name, subject_code)
VALUES ('ragavi_staff_id', 'Software Engineering', 'CS001');

-- Add second subject
INSERT INTO staff_subjects (staff_id, subject_name, subject_code)
VALUES ('ragavi_staff_id', 'Database Management', 'CS002');
