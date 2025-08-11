import { supabase } from '../lib/supabase';

export interface Subject {
  id: string;
  subcode: string;
  name: string;
  department: string;
  year: number;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  shared_subject_code: string | null;
}

export interface CreateSubjectData {
  subcode: string;
  name: string;
  department: string;
  year: number;
  is_shared?: boolean;
  shared_subject_code?: string | null;
}

export const subjectService = {
  // Get all subjects
  async getAllSubjects(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subject_detail')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subjects:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get subjects by department
  async getSubjectsByDepartment(department: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subject_detail')
      .select('*')
      .eq('department', department)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching subjects by department:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get subjects by year
  async getSubjectsByYear(year: number): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subject_detail')
      .select('*')
      .eq('year', year)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching subjects by year:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get single subject by ID
  async getSubjectById(id: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subject_detail')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching subject by ID:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Create new subject
  async createSubject(subjectData: CreateSubjectData): Promise<Subject> {
    const { data, error } = await supabase
      .from('subject_detail')
      .insert([subjectData])
      .select()
      .single();

    if (error) {
      console.error('Error creating subject:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Update subject
  async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
    const { data, error } = await supabase
      .from('subject_detail')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subject:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Delete subject
  async deleteSubject(id: string): Promise<void> {
    const { error } = await supabase
      .from('subject_detail')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subject:', error);
      throw new Error(error.message);
    }
  },

  // Search subjects
  async searchSubjects(searchTerm: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subject_detail')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,subcode.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error searching subjects:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get shared subjects
  async getSharedSubjects(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subject_detail')
      .select('*')
      .eq('is_shared', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching shared subjects:', error);
      throw new Error(error.message);
    }

    return data || [];
  }
};
