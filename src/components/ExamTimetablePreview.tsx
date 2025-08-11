import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { examService } from '../services/examService';

interface ExamTimetablePreviewProps {
  scheduledExams: any[];
}

export const ExamTimetablePreview: React.FC<ExamTimetablePreviewProps> = ({ scheduledExams }) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Define all departments based on the image description
  const allDepartments = [
    'ACT', 'AIDS', 'AIML', 'BME', 'CE', 'CSBS', 'CSE', 
    'CYBER', 'ECE', 'EEE', 'IT', 'MCT', 'MECH', 'VLSI'
  ];

  useEffect(() => {
    // Extract unique departments from scheduled exams
    const uniqueDepts = [...new Set(scheduledExams.map(exam => exam.department))];
    setDepartments(uniqueDepts);
    setLoading(false);
  }, [scheduledExams]);

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading timetable...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-green-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Scheduled Exams Table Preview</h3>
        </div>
      </div>

      {uniqueDates.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500">No exams scheduled yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {allDepartments.map(dept => (
                  <th key={dept} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dept}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uniqueDates.map(date => (
                <tr key={date} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  {allDepartments.map(dept => {
                    const exam = examsByDateAndDept[date][dept];
                    return (
                      <td key={dept} className="px-2 py-2 text-sm text-gray-900 text-center">
                        {exam ? (
                          <div className="space-y-1">
                            <div className="font-medium text-xs">{exam.subjectCode}</div>
                            <div className="text-xs text-gray-600">{exam.subjectName}</div>
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
