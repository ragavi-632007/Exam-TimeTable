import { supabase } from '../lib/supabase';

interface StaffSubject {
  id: string;
  subject_name: string;
  subject_code: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  department_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  subjects: StaffSubject[];
}

export interface CreateStaffData {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  department_id: string;
  user_id: string;
  subjects?: { name: string; code: string; }[];
}

export const staffService = {
  // Get all staff members
  async getAllStaff(): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('staff_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get staff by role
  async getStaffByRole(role: string): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('staff_details')
      .select('*')
      .eq('role', role)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching staff by role:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get staff by department
  async getStaffByDepartment(departmentId: string): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('staff_details')
      .select('*')
      .eq('department_id', departmentId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching staff by department:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get single staff member by ID
  async getStaffById(id: string): Promise<StaffMember | null> {
    const { data, error } = await supabase
      .from('staff_details')
      .select(`
        *,
        staff_subjects (*)
      `)
      .eq('user_id', id)
      .single();

    if (error) {
      console.error('Error fetching staff by ID:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Create new staff member
  async createStaff(staffData: CreateStaffData): Promise<StaffMember> {
    const { data, error } = await supabase
      .from('staff_details')
      .insert([staffData])
      .select()
      .single();

    if (error) {
      console.error('Error creating staff:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Update staff member
  async updateStaff(id: string, updates: Partial<StaffMember>): Promise<StaffMember> {
    const { data, error } = await supabase
      .from('staff_details')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Delete staff member
  async deleteStaff(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff_details')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting staff:', error);
      throw new Error(error.message);
    }
  },

  // Search staff members
  async searchStaff(searchTerm: string): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('staff_details')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error searching staff:', error);
      throw new Error(error.message);
    }

    return data || [];
  }
};
