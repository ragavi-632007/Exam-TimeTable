import React from 'react';
import { Exam } from '../types';
import { Calendar, User } from 'lucide-react';

interface ExamScheduleTableProps {
  exams: Exam[];
  scheduledExams?: any[];
}

export const ExamScheduleTable: React.FC<ExamScheduleTableProps> = ({ exams, scheduledExams = [] }) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Exam Schedule Overview</h3>
        </div>
      </div>

      {uniqueDates.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500">No exams scheduled yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {allDepartments.map(dept => (
                  <th key={dept} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dept}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uniqueDates.map(date => (
                <tr key={date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  {allDepartments.map(dept => {
                    const exam = examsByDateAndDept[date][dept];
                    return (
                      <td key={dept} className="px-6 py-4 text-sm text-gray-900">
                        {exam ? (
                          <div className="space-y-1">
                            <div className="font-medium">{exam.subjectCode}</div>
                            <div className="text-xs text-gray-600">{exam.subjectName}</div>
                            <div className="flex items-center text-xs text-gray-500">
                              <User className="h-3 w-3 mr-1" />
                              {exam.assignedBy}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};