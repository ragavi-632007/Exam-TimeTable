import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface ScheduledExam {
  id: string;
  examDate: string;
  department: string;
  subjectCode: string;
  subjectName: string;
  year: number;
  subject_detail?: {
    year: number;
  };
}

interface ExamTimetablePreviewProps {
  scheduledExams: ScheduledExam[];
}

export const ExamTimetablePreview: React.FC<ExamTimetablePreviewProps> = ({ scheduledExams }) => {
  const [loading, setLoading] = useState(true);

  // Define all departments based on the image description
  const allDepartments = [
    'ACT', 'AIDS', 'AIML', 'BME', 'CE', 'CSBS', 'CSE', 
    'CYBER', 'ECE', 'EEE', 'IT', 'MCT', 'MECH', 'VLSI'
  ];

  useEffect(() => {
    setLoading(false);
  }, [scheduledExams]);

  // Get unique dates from scheduled exams and sort them
  const uniqueDates = [...new Set(scheduledExams.filter(exam => exam?.examDate).map(exam => exam.examDate))].sort();

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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Year {scheduledExams[0]?.year || scheduledExams[0]?.subject_detail?.year || ''} Exam Schedule
            </h3>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-green-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                DATE
              </th>
              {allDepartments.map(dept => (
                <th key={dept} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  {dept}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {uniqueDates.map(date => (
              <tr key={date} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border">
                  {new Date(date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>
                {allDepartments.map(dept => {
                  const exam = examsByDateAndDept[date][dept];
                  return (
                    <td key={dept} className="px-4 py-3 text-sm text-center border">
                      {exam ? (
                        <div>
                          <div className="font-medium text-sm">{exam.subjectCode}</div>
                          <div className="text-xs text-gray-600 mt-1">{exam.subjectName}</div>
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
    </div>
  );
};
