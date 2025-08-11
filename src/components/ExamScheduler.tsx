import React, { useState } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { Exam } from '../types';
import { useExams } from '../context/ExamContext';
import { useAuth } from '../context/AuthContext';

interface ExamSchedulerProps {
  exam: Exam;
  onClose: () => void;
  onSchedule: (examId: string, date: string) => void;
}

export const ExamScheduler: React.FC<ExamSchedulerProps> = ({ exam, onClose, onSchedule }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [conflict, setConflict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { exams, scheduleExam } = useExams();
  const { user } = useAuth();
  const [staffId, setStaffId] = useState<string | null>(null);

  // Fetch staff_details.id for current user
  React.useEffect(() => {
    const fetchStaffId = async () => {
      if (!user || !user.id) {
        console.log('User not loaded yet, skipping staff lookup.');
        return;
      }
      console.log('Current logged-in user.id:', user.id);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const res = await fetch(
          `${supabaseUrl}/rest/v1/staff_details?user_id=eq.${user.id}`,
          {
            headers: {
              apikey: supabaseKey || '',
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await res.json();
        console.log('Staff details fetch result:', data, 'for user_id:', user.id);
        if (Array.isArray(data) && data.length > 0) {
          // Store staff_details.id for assigned_by
          setStaffId(data[0].id);
        } else {
          setStaffId(null);
        }
      } catch (err) {
        console.error('Error fetching staff_details:', err);
        setStaffId(null);
      }
    };
    if (user && user.id) {
      fetchStaffId();
    }
  }, [user]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setConflict(null); // Clear any previous errors or conflicts
    
    // Check for conflicts
    const scheduledExams = exams.filter(e => e.status === 'scheduled' && e.scheduledDate === date);
    
    // Check for same department conflict
    const sameDeptConflict = scheduledExams.find(e => e.department === exam.department);
    if (sameDeptConflict) {
      setConflict(`Conflict: Another exam is already scheduled for ${exam.department} department on this date.`);
      return;
    }
    
    // Check for same subject name scheduling opportunity
    const sameSubjectScheduled = scheduledExams.find(e => e.subjectName === exam.subjectName);
    if (sameSubjectScheduled) {
      setConflict(`Info: Same subject "${exam.subjectName}" is already scheduled for ${sameSubjectScheduled.department} on this date. This is a shared subject - all departments teaching this subject must schedule on the same date.`);
      return;
    }
  };

  const handleClose = () => {
    setConflict(null); // Clear any errors when closing
    onClose();
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate && !conflict?.includes('Conflict:') && user && user.id) {
      setLoading(true);
      try {
        await scheduleExam(exam.id, selectedDate, user.id);
        onSchedule(exam.id, selectedDate);
        onClose();
      } catch (error: any) {
        console.error('Error scheduling exam:', error);
        
        // Extract error message and handle specific cases
        let errorMessage = 'Failed to schedule exam. Please try again.';
        
        if (error?.message) {
          errorMessage = error.message;
          
          // Check for specific department conflict error
          if (errorMessage.includes('department already has an exam scheduled')) {
            setConflict(`Conflict: ${errorMessage}`);
          } else {
            setConflict(`Error: ${errorMessage}`);
          }
        } else if (typeof error === 'string') {
          setConflict(`Error: ${error}`);
        } else {
          setConflict(`Error: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    } else if (!user || !user.id) {
      setConflict('Error: Unable to find logged-in user.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Schedule Exam</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Exam Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{exam.subjectName}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Subject Code: {exam.subjectCode}</p>
              <p>Course ID: {exam.courseId}</p>
              <p>Department: {exam.department}</p>
              <p>Year {exam.year}</p>
            </div>
          </div>



                      {/* Date Selection */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Select Exam Date
                </label>
                <input
                  type="date"
                  required
                  min={exam.startDate}
                  max={exam.endDate}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be between {exam.startDate} and {exam.endDate}
                </p>
              </div>



            {/* Conflict Notice */}
            {conflict && (
              <div className={`border rounded-lg p-4 ${
                conflict.includes('Conflict:') 
                  ? 'bg-red-50 border-red-200' 
                  : conflict.includes('Error:')
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start">
                  <AlertTriangle className={`h-5 w-5 mr-2 mt-0.5 ${
                    conflict.includes('Conflict:') || conflict.includes('Error:') ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <h4 className={`text-sm font-medium ${
                      conflict.includes('Conflict:') || conflict.includes('Error:') ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {conflict.includes('Conflict:') ? 'Scheduling Conflict' : 
                       conflict.includes('Error:') ? 'Scheduling Error' : 'Scheduling Information'}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      conflict.includes('Conflict:') || conflict.includes('Error:') ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {conflict.replace('Conflict: ', '').replace('Error: ', '').replace('Info: ', '')}
                    </p>
                  </div>
                </div>
              </div>
            )}



            {/* Exam Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Exam Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Exams will be conducted in morning session.<br />
                    Students must arrive on time.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedDate || conflict?.includes('Conflict:') || conflict?.includes('Error:') || loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Scheduling...' : 'Schedule Exam'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};