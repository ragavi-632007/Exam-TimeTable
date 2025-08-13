import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types matching your existing schema
export interface Database {
  public: {
    Tables: {
      staff_details: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          department: string;
          created_at: string;
          updated_at: string;
          role: string;
          department_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string;
          department: string;
          created_at?: string;
          updated_at?: string;
          role: string;
          department_id?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          department?: string;
          created_at?: string;
          updated_at?: string;
          role?: string;
          department_id?: string;
          user_id?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subject_detail: {
        Row: {
          id: string;
          subcode: string;
          name: string;
          department: string;
          year: number;
          sem: number; // Using 'sem' as the field name
          created_at: string;
          updated_at: string;
          is_shared: boolean;
          shared_subject_code: string | null;
        };
        Insert: {
          id?: string;
          subcode: string;
          name: string;
          department: string;
          year: number;
          sem: number;
          created_at?: string;
          updated_at?: string;
          is_shared?: boolean;
          shared_subject_code?: string | null;
        };
        Update: {
          id?: string;
          subcode?: string;
          name?: string;
          department?: string;
          year?: number;
          sem?: number;
          created_at?: string;
          updated_at?: string;
          is_shared?: boolean;
          shared_subject_code?: string | null;
        };
      };
      exam_settings: {
        Row: {
          id: string;
          exam_start_date: string;
          exam_end_date: string;
          holidays: any;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_start_date: string;
          exam_end_date: string;
          holidays?: any;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exam_start_date?: string;
          exam_end_date?: string;
          holidays?: any;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      exam_schedules: {
        Row: {
          id: string;
          subject_id: string;
          exam_date: string;
          exam_time: string;
          department_id: string;
          assigned_by: string;
          is_shared: boolean;
          priority_department: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          exam_date: string;
          exam_time: string;
          department_id: string;
          assigned_by: string;
          is_shared?: boolean;
          priority_department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          exam_date?: string;
          exam_time?: string;
          department_id?: string;
          assigned_by?: string;
          is_shared?: boolean;
          priority_department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
} 