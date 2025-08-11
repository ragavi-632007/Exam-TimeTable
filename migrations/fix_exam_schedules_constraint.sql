-- First drop the existing exam_schedules table
DROP TABLE IF EXISTS exam_schedules;

-- Recreate the exam_schedules table with proper foreign key constraint
CREATE TABLE exam_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subject_detail(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES staff_details(id) ON DELETE CASCADE,
    priority_department UUID,
    exam_type VARCHAR(10) CHECK (exam_type IN ('IA1', 'IA2', 'IA3')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recreate the indexes
CREATE INDEX idx_exam_schedules_subject_id ON exam_schedules(subject_id);
CREATE INDEX idx_exam_schedules_department_id ON exam_schedules(department_id);
CREATE INDEX idx_exam_schedules_assigned_by ON exam_schedules(assigned_by);
