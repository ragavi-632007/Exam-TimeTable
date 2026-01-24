import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Calendar } from 'lucide-react';
import { ExamAlert } from '../types';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { useExams } from '../context/ExamContext';

interface AlertScheduleCardProps {
  alert: ExamAlert;
  pendingExams: any[];
  scheduledExams: any[];
  userDepartment: string;
  onScheduleExam: (examId: string, date: string) => Promise<void>;
}

export const AlertScheduleCard: React.FC<AlertScheduleCardProps> = ({
  alert,
  pendingExams,
  scheduledExams,
  userDepartment,
  onScheduleExam,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});
  const [schedulingLoading, setSchedulingLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get year label
  const getYearLabel = (year: number): string => {
    const labels: Record<number, string> = {
      1: '1ST', 2: '2ND', 3: '3RD', 4: '4TH',
    };
    return labels[year] || `${year}`;
  };

  // Get exam type label
  const getExamTypeLabel = (examType?: string): string => {
    const labelMap: Record<string, string> = {
      'Internal Assessment-I': 'IA 1',
      'Internal Assessment-II': 'IA 2',
      'Model Exam': 'MODEL',
      'IA1': 'IA 1',
      'IA2': 'IA 2',
      'MODEL': 'MODEL',
    };
    return labelMap[examType || ''] || examType || 'Unknown';
  };

  // Get semester label
  const getSemesterLabel = (sem: number): string => {
    const labels: Record<number, string> = {
      1: 'SEM 1', 2: 'SEM 2', 3: 'SEM 3', 4: 'SEM 4',
      5: 'SEM 5', 6: 'SEM 6', 7: 'SEM 7', 8: 'SEM 8',
    };
    return labels[sem] || `SEM ${sem}`;
  };

  // Generate user-friendly alert title
  const getAlertTitle = (): string => {
    const year = getYearLabel(alert.year);
    const sem = getSemesterLabel(alert.semester);
    const examType = getExamTypeLabel(alert.examType);
    return `${year} YEAR ${sem} ${examType}`;
  };

  // Filter exams for this alert
  const relevantExams = useMemo(() => {
    return pendingExams.filter(
      (exam) =>
        exam.year === alert.year &&
        exam.semester === alert.semester &&
        exam.department?.trim().toLowerCase() === userDepartment?.trim().toLowerCase()
    );
  }, [pendingExams, alert.year, alert.semester, userDepartment]);

  // Get pending exams (those with status === "pending")
  const pendingExamsForAlert = useMemo(() => {
    return relevantExams.filter((exam) => exam.status === "pending");
  }, [relevantExams]);

  // Get scheduled exams (those with status === "scheduled" or those in scheduledExams prop)
  const scheduledExamsForAlert = useMemo(() => {
    return relevantExams.filter((exam) => exam.status === "scheduled");
  }, [relevantExams]);

  const parseYMD = (dateStr?: string | null): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  };

  const handleScheduleExam = async (examId: string, date: string) => {
    setError(null);
    setSuccess(null);
    
    if (!date) {
      setError('Please select a date first.');
      return;
    }

    try {
      setSchedulingLoading(prev => ({ ...prev, [examId]: true }));
      
      // Call the parent's schedule handler
      const exam = pendingExamsForAlert.find(e => e.id === examId);
      if (!exam) {
        setError('Exam not found');
        return;
      }

      // Wait for the scheduling to complete
      await onScheduleExam(examId, date);
      
      // Add a small delay to ensure data is refreshed in parent
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccess(`${exam.subjectName} scheduled successfully for ${date}`);
      setSelectedDates(prev => ({ ...prev, [examId]: '' }));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule exam');
      console.error('Scheduling error:', err);
    } finally {
      setSchedulingLoading(prev => ({ ...prev, [examId]: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getAlertTitle()}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">
                  {alert.startDate && new Date(alert.startDate).toLocaleDateString()} - {alert.endDate && new Date(alert.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="ml-4">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Card Content - Visible when expanded */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4 space-y-4 bg-gray-50">
          {/* Alert Details */}
          <div className="bg-white rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Exam Period</p>
                <p className="font-medium text-gray-900">{alert.startDate} to {alert.endDate}</p>
              </div>
              <div>
                <p className="text-gray-600">Ref ID</p>
                <p className="font-medium text-gray-900">{alert.refId || 'N/A'}</p>
              </div>
              {alert.deadline && (
                <div>
                  <p className="text-gray-600">Deadline</p>
                  <p className="font-medium text-gray-900">{alert.deadline}</p>
                </div>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Exams to Schedule */}
          {pendingExamsForAlert.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800">
                No pending exams to schedule for Year {alert.year}, {getSemesterLabel(alert.semester)}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Exams to Schedule</h4>
              <div className="space-y-3">
                {pendingExamsForAlert.map((exam) => {
                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {exam.subjectName}
                          </h5>
                          <p className="text-xs text-gray-600 mt-1">
                            Code: {exam.subjectCode}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DatePicker
                            selected={
                              selectedDates[exam.id]
                                ? parseYMD(selectedDates[exam.id])
                                : null
                            }
                            onChange={(d: Date | null) => {
                              const value = d ? format(d, 'yyyy-MM-dd') : '';
                              setSelectedDates((prev) => ({
                                ...prev,
                                [exam.id]: value,
                              }));
                            }}
                            minDate={parseYMD(alert.startDate) ?? undefined}
                            maxDate={parseYMD(alert.endDate) ?? undefined}
                            filterDate={(d: Date) => {
                              // Exclude Sundays
                              if (d.getDay() === 0) return false;
                              const ds = format(d, 'yyyy-MM-dd');
                              // Exclude already scheduled dates for same dept+year
                              const scheduledSet = new Set(
                                scheduledExams
                                  .filter(
                                    (se) =>
                                      se.department === exam.department &&
                                      se.year === exam.year
                                  )
                                  .map((se) => se.scheduledDate)
                                  .filter(Boolean)
                              );
                              if (scheduledSet.has(ds)) return false;
                              return true;
                            }}
                            placeholderText="Select date"
                            dateFormat="yyyy-MM-dd"
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <button
                            onClick={async () => {
                              await handleScheduleExam(
                                exam.id,
                                selectedDates[exam.id]
                              );
                            }}
                            disabled={
                              !selectedDates[exam.id] ||
                              !!schedulingLoading[exam.id]
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {schedulingLoading[exam.id]
                              ? 'Scheduling...'
                              : 'Schedule'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scheduled Exams Section */}
          {scheduledExamsForAlert.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Scheduled Exams</h4>
              <div className="space-y-3">
                {scheduledExamsForAlert.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white rounded-lg p-3 border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">
                          {exam.subjectName}
                        </h5>
                        <p className="text-xs text-gray-600 mt-1">
                          Code: {exam.subjectCode}
                        </p>
                        <p className="text-xs font-medium text-green-600 mt-2">
                          Scheduled for: {exam.scheduledDate}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                        Confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
