export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher';
  department?: string;
}

export interface Exam {
  id: string;
  subjectCode: string;
  subjectName: string;
  courseId: string;
  department: string;
  year: 1 | 2 | 3 | 4;
  subject_detail?: {
    year: 1 | 2 | 3 | 4;
  };
  semester: number;
  examType?: 'IA1' | 'IA2' | 'IA3';
  teacherId: string;
  teacherName: string;
  scheduledDate?: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'scheduled' | 'confirmed';
}

export interface ExamAlert {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  year: 1 | 2 | 3 | 4;
  semester: number;
  departments: string[];
  createdAt: string;
  status: 'active' | 'closed';
}

export interface Department {
  code: string;
  name: string;
}

export interface Subject {
  subject_code: string;
  subject_name: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  subjects: Subject[];
  password: string;
}

export interface ScheduleConflict {
  date: string;
  existingTeacher: string;
  conflictingTeacher: string;
  subjectName: string;
}