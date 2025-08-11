import React, { useState, useEffect } from 'react';
import { Download, Printer, Calendar, Clock, MapPin } from 'lucide-react';
import { examService } from '../services/examService';

interface ExamSchedule {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  department: string;
  examDate: string;
  examTime: string;
  assignedBy: string;
}

interface TimetableData {
  title: string;
  reference: string;
  date: string;
  startDate: string;
  endDate: string;
  examDuration: string;
  studentArrival: string;
  schedules: ExamSchedule[];
}

export const ExamTimetable: React.FC = () => {
  const [timetableData, setTimetableData] = useState<TimetableData>({
    title: 'INTERNAL ASSESSMENT-II EXAMINATION',
    reference: 'REF: CIT/COE/2025-26/ODD/04',
    date: '01.08.2025',
    startDate: '04.08.2025',
    endDate: '08.08.2025',
    examDuration: '08:00 AM to 09:30 AM',
    studentArrival: '07:45 AM',
    schedules: []
  });

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadExamSchedules();
  }, []);

  const loadExamSchedules = async () => {
    try {
      setLoading(true);
      const scheduledExams = await examService.getScheduledExams();
      
      // Transform the data to match our timetable format
      const schedules: ExamSchedule[] = scheduledExams.map(schedule => ({
        id: schedule.id,
        subjectId: schedule.subjectId,
        subjectName: schedule.subjectName,
        subjectCode: schedule.subjectCode,
        department: schedule.department,
        examDate: schedule.examDate,
        examTime: schedule.examTime,
        assignedBy: schedule.assignedBy
      }));

      setTimetableData(prev => ({
        ...prev,
        schedules
      }));
    } catch (error) {
      console.error('Error loading exam schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group schedules by date
  const schedulesByDate = timetableData.schedules.reduce((acc, schedule) => {
    const date = schedule.examDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, ExamSchedule[]>);

  // Get unique dates sorted
  const dates = Object.keys(schedulesByDate).sort();

  // Department codes mapping
  const departmentCodes: Record<string, string> = {
    'Civil Engineering': 'CE',
    'Electrical & Electronics Engineering': 'EEE',
    'Electronics & Communication Engineering': 'ECE',
    'Mechanical Engineering': 'MECH',
    'Mechatronics': 'MCT',
    'Biomedical Engineering': 'BME',
    'Computer Science & Engineering': 'CSE',
    'Information Technology': 'IT',
    'Artificial Intelligence & Data Science': 'AIDS',
    'Computer Science & Business Systems': 'CSBS',
    'Artificial Intelligence & Machine Learning': 'AIML',
    'Cyber Security': 'CYBER'
  };

  // Get all departments that have exams
  const allDepartments = Array.from(new Set(timetableData.schedules.map(s => s.department))).sort();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    console.log('Download timetable as PDF');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Timetable</h2>
          <p className="text-sm text-gray-600">Generate formal examination circular</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Circular Document */}
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-6xl mx-auto print:shadow-none">
        {/* Institution Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-lg font-bold">CHENNAI</div>
                  <div className="text-lg font-bold">INSTITUTE</div>
                  <div className="text-lg font-bold">OF</div>
                  <div className="text-lg font-bold">TECHNOLOGY</div>
                  <div className="text-xs mt-1">Transforming Lives</div>
                </div>
              </div>
            </div>
            
            {/* Institution Name */}
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">CHENNAI INSTITUTE OF TECHNOLOGY (Autonomous)</h1>
              <p className="text-sm text-gray-600">Autonomous Institution, Affiliated to Anna University, Chennai</p>
            </div>
          </div>
          
          {/* Office Section */}
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-gray-900">OFFICE OF THE CONTROLLER OF EXAMINATIONS</p>
          </div>
        </div>

        {/* Document Details */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">REF: {timetableData.reference}</p>
              <p className="text-sm text-gray-600 font-medium">DATE: {timetableData.date}</p>
            </div>
          </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 underline decoration-2 underline-offset-4">CIRCULAR</h2>
          </div>
        </div>

        {/* Circular Content */}
        <div className="mb-8 text-justify">
          <p className="mb-4 text-base leading-relaxed">
            The {timetableData.title} for IV year students starts from {timetableData.startDate} onwards. 
            Students are advised to take the exams seriously as the marks secured in these tests will be 
            considered for awarding the internal marks.
          </p>
          <p className="mb-4 text-base">The schedule for the exams is as follows:</p>
        </div>

        {/* Timetable */}
        <div className="mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border-2 border-gray-400 px-3 py-2 text-sm font-bold text-gray-900 text-center">DATE</th>
                  {allDepartments.map(dept => (
                    <th key={dept} className="border-2 border-gray-400 px-3 py-2 text-sm font-bold text-gray-900 text-center">
                      {departmentCodes[dept] || dept}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dates.map(date => (
                  <tr key={date} className="hover:bg-gray-50">
                    <td className="border-2 border-gray-400 px-3 py-2 text-sm font-bold text-gray-900 text-center">
                      {formatDate(date)}
                    </td>
                    {allDepartments.map(dept => {
                      const schedule = schedulesByDate[date]?.find(s => s.department === dept);
                      return (
                        <td key={dept} className="border-2 border-gray-400 px-3 py-2 text-sm text-gray-700 text-center">
                          {schedule ? (
                            <div>
                              <div className="font-bold text-base">{schedule.subjectCode}</div>
                              <div className="text-xs text-gray-600 mt-1">{schedule.subjectName}</div>
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

        {/* Notes */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-4 text-base">NOTES:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Exam Duration: {timetableData.examDuration}</li>
            <li>Students should be available inside the respective exam halls at {timetableData.studentArrival}</li>
            <li>Seating arrangement will be displayed on the notice board just before the day of the first Exam</li>
          </ol>
        </div>

        {/* Distribution */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-4 text-base">COPY TO:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>The head of the department</li>
            <li>To be read in all classes</li>
            <li>Main notice board</li>
            <li>File copy</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-12">
          <div className="flex items-center space-x-4">
            <div className="w-28 h-28 border-2 border-gray-400 rounded-full flex items-center justify-center text-center">
              <div className="text-xs">
                <div className="font-bold">CONTROLLER OF</div>
                <div className="font-bold">EXAMINATIONS</div>
                <div className="text-xs mt-1">CHENNAI 600 069</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-4">
              <div className="w-40 h-0.5 bg-gray-900 mb-2"></div>
              <p className="text-sm font-bold">Dr. A. RAMESH, M.E., Ph.D.,</p>
              <p className="text-sm font-medium">Principal</p>
            </div>
            <div className="text-xs text-gray-600">
              <p className="font-medium">CHENNAI INSTITUTE OF TECHNOLOGY (AUTONOMOUS)</p>
              <p>Sarathy Nagar, Nandampakkam Post,</p>
              <p>Kondrathur, Chennai-600 069</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { 
            margin: 0; 
            padding: 20px;
            font-family: 'Times New Roman', serif;
          }
          .print\\:shadow-none { 
            box-shadow: none !important; 
            border: none !important;
            background: white !important;
          }
          table { 
            page-break-inside: avoid;
            border-collapse: collapse;
          }
          th, td { 
            border: 2px solid #666 !important;
            padding: 8px !important;
          }
          .bg-gray-200 { 
            background-color: #e5e7eb !important;
          }
          .text-center { 
            text-align: center !important;
          }
          .font-bold { 
            font-weight: bold !important;
          }
        }
      `}</style>
    </div>
  );
}; 