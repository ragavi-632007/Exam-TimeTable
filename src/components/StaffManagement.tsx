import React, { useState, useEffect } from 'react';
import { Search, Trash2, Mail, Phone, Loader2 } from 'lucide-react';
import { staffService, StaffMember } from '../services/staffService';
import { departmentService, Department } from '../services/departmentService';

export const StaffManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load staff and departments data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [staffData, departmentData] = await Promise.all([
          staffService.getAllStaff(),
          departmentService.getAllDepartments()
        ]);
        
        console.log('Loaded staff data:', staffData);
        console.log('Staff with subjects:', staffData.filter(staff => staff.subjects?.length > 0));
        
        setStaffMembers(staffData);
        setDepartments(departmentData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter staff based on search term
  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.subjects?.some(subject => 
      subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getRoleColor = (role: string) => {
    return role === 'Administrator' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  // Edit functionality removed

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await staffService.deleteStaff(id);
        // Refresh the staff list
        const updatedStaff = await staffService.getAllStaff();
        setStaffMembers(updatedStaff);
      } catch (err) {
        console.error('Error deleting staff:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete staff member');
      }
    }
  };

  // Add staff functionality removed per requirements

  const refreshData = async () => {
    try {
      setLoading(true);
      const [staffData, departmentData] = await Promise.all([
        staffService.getAllStaff(),
        departmentService.getAllDepartments()
      ]);
      setStaffMembers(staffData);
      setDepartments(departmentData);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-sm text-gray-600">Manage staff members and their roles</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Search Bar */}

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading staff data...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STAFF MEMBER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DEPARTMENT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROLE
                  </th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     CONTACT
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     ACTIONS
                   </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {filteredStaff.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                       {searchTerm ? 'No staff members found matching your search.' : 'No staff members found.'}
                     </td>
                   </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                          <div className="text-sm text-gray-500">{staff.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{staff.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(staff.role)}`}>
                          {staff.role}
                        </span>
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap">
                         <div className="space-y-1">
                           <div className="flex items-center space-x-2">
                             <Mail className="h-4 w-4 text-gray-400" />
                             <span className="text-sm text-gray-900">{staff.email}</span>
                           </div>
                           <div className="flex items-center space-x-2">
                             <Phone className="h-4 w-4 text-gray-400" />
                             <span className="text-sm text-gray-900">{staff.phone}</span>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDelete(staff.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}; 