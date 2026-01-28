import React, { useState } from 'react';
import { Exam } from '../types';
import { Calendar, User, Edit, Trash2 } from 'lucide-react';
import { EditExamSchedule } from './EditExamSchedule';
import { examService } from '../services/examService';

interface ExamScheduleTableProps {
  exams: Exam[];
  scheduledExams?: any[];
  onScheduleUpdated?: () => void;
}

export const ExamScheduleTable: React.FC<ExamScheduleTableProps> = ({ 
  exams, 
  scheduledExams = [],
  onScheduleUpdated 
}) => {
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  // Define all departments based on the image description
  const allDepartments = [
    'ACT', 'AIDS', 'AIML', 'BME', 'CE', 'CSBS', 'CSE', 
    'CYBER', 'ECE', 'EEE', 'IT', 'MCT', 'MECH', 'VLSI'
  ];

  // Get unique dates from scheduled exams and sort them
  const uniqueDates = [...new Set(scheduledExams.map(exam => exam.examDate))].sort();

  // Group exams by date and department
  const examsByDateAndDept = uniqueDates.reduce((acc, date) => {
    acc[date!] = allDepartments.reduce((deptAcc, dept) => {
      // Match by department name
      const exam = scheduledExams.find(e => {
        const examDept = e.department?.trim();
        return e.examDate === date && examDept === dept;
      });
      deptAcc[dept] = exam || null;
      return deptAcc;
    }, {} as Record<string, any>);
    return acc;
  }, {} as Record<string, Record<string, any>>);

  const toggleDateExpanded = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const handleDeleteSchedule = async (scheduleId: string, subjectName: string, department: string) => {
    if (!window.confirm(`Are you sure you want to delete the schedule for "${subjectName}" in ${department}? This cannot be undone.`)) {
      return;
    }

    setDeleting(scheduleId);
    try {
      await examService.deleteExamSchedule(scheduleId);
      // Trigger refresh
      if (onScheduleUpdated) {
        onScheduleUpdated();
      }
    } catch (error: any) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleting(null);
    }
  };

  const handleScheduleUpdated = () => {
    setEditingSchedule(null);
    if (onScheduleUpdated) {
      onScheduleUpdated();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Exam Schedule Overview</h3>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Click on a date to view and edit schedules. Edit actions are available for Admin and Department Coordinators.
        </p>
      </div>

      {uniqueDates.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500">No exams scheduled yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {uniqueDates.map(date => (
            <div key={date} className="hover:bg-gray-50 transition-colors">
              <button
                onClick={() => toggleDateExpanded(date)}
                className="w-full text-left px-6 py-4 flex items-center justify-between focus:outline-none"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {scheduledExams.filter(e => e.examDate === date).length} exam(s) scheduled
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-xs text-gray-600">
                    {expandedDates.has(date) ? '▼' : '▶'}
                  </div>
                </div>
              </button>

              {expandedDates.has(date) && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-xs font-medium text-gray-600 py-2">Department</th>
                          <th className="text-left text-xs font-medium text-gray-600 py-2">Subject Code</th>
                          <th className="text-left text-xs font-medium text-gray-600 py-2">Subject Name</th>
                          <th className="text-left text-xs font-medium text-gray-600 py-2">Exam Type</th>
                          <th className="text-left text-xs font-medium text-gray-600 py-2">Assigned By</th>
                          <th className="text-right text-xs font-medium text-gray-600 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allDepartments.map(dept => {
                          const exam = examsByDateAndDept[date][dept];
                          if (!exam) return null;
                          return (
                            <tr key={`${date}-${dept}`} className="hover:bg-white">
                              <td className="py-3 text-sm font-medium text-gray-900">{dept}</td>
                              <td className="py-3 text-sm text-gray-700">{exam.subjectCode}</td>
                              <td className="py-3 text-sm text-gray-700">{exam.subjectName}</td>
                              <td className="py-3 text-sm text-gray-600">{exam.examType || 'IA1'}</td>
                              <td className="py-3 text-sm text-gray-600">
                                <div className="flex items-center space-x-1 text-gray-600">
                                  <User className="h-3 w-3" />
                                  <span>{exam.assignedBy || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => setEditingSchedule(exam)}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                    title="Edit Schedule"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSchedule(exam.id, exam.subjectName, exam.department)}
                                    disabled={deleting === exam.id}
                                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                                    title="Delete Schedule"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingSchedule && (
        <EditExamSchedule
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onUpdate={handleScheduleUpdated}
        />
      )}
    </div>
  );
};