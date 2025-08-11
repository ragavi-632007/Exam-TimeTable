import { supabase } from '../lib/supabase';

export interface Department {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
}

export const departmentService = {
  // Get all departments
  async getAllDepartments(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching departments:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get department by ID
  async getDepartmentById(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching department by ID:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Create new department
  async createDepartment(departmentData: CreateDepartmentData): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert([departmentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating department:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Update department
  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating department:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting department:', error);
      throw new Error(error.message);
    }
  }
};
