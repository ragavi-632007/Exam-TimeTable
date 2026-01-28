import React, { useState } from 'react';
import { X, Calendar, Save, AlertTriangle } from 'lucide-react';
import { examService } from '../services/examService';

interface EditExamScheduleProps {
  schedule: any;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditExamSchedule: React.FC<EditExamScheduleProps> = ({ schedule, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    examDate: schedule.examDate || '',
    examType: schedule.examType || 'IA1',
    room: schedule.room || '',
    notes: schedule.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examTypes = [
    { value: 'IA1', label: 'Internal Assessment 1' },
    { value: 'IA2', label: 'Internal Assessment 2' },
    { value: 'IA3', label: 'Internal Assessment 3' }
  ];

  const isSunday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 0; // Sunday
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Disallow Sundays
    if (isSunday(formData.examDate)) {
      setLoading(false);
      setError('Sunday is not allowed for exams. Please choose another date.');
      return;
    }

    try {
      // Update the exam schedule (swap logic and cross-department consistency handled in service)
      await examService.updateExamSchedule(schedule.id, {
        exam_date: formData.examDate,
        exam_type: formData.examType,
        room: formData.room,
        notes: formData.notes
      });
      setError(null);
      onUpdate();
      onClose();
    } catch (error: any) {
      // Show comprehensive error message
      const errorMsg = error.message || 'Failed to update exam schedule';
      console.error('Failed to update exam schedule:', error);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'examDate') {
      // Validate Sunday
      if (isSunday(value)) {
        setError('Sunday is not allowed for exams. Please choose another date.');
        setFormData(prev => ({ ...prev, examDate: '' }));
        return;
      } else {
        setError(null);
      }
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Edit Exam Schedule</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Exam Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{schedule.subjectName}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Subject Code: {schedule.subjectCode}</p>
              <p>Department: {schedule.department}</p>
              <p>Current Date: {new Date(schedule.examDate).toLocaleDateString()}</p>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <p className="font-semibold mb-1">📋 Important Note:</p>
              <p>
                If this subject is taught in multiple departments, changing the date will:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Automatically update the date for this subject in ALL departments</li>
                <li>Release (remove) any conflicting schedules on the old date</li>
                <li>Ensure all departments teaching this subject have the exam on the same date</li>
              </ul>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Update Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Exam Date
              </label>
              <input
                type="date"
                required
                value={formData.examDate}
                onChange={(e) => handleInputChange('examDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Sundays are not allowed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type
              </label>
              <select
                value={formData.examType}
                onChange={(e) => handleInputChange('examType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {examTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room/Venue
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => handleInputChange('room', e.target.value)}
                placeholder="e.g., Room 101, Lab 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Updating...' : 'Update Schedule'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
