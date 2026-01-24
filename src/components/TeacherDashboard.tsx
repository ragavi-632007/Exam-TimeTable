import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useExams } from "../context/ExamContext";
import { ExamAlert } from "../types";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Home,
  User,
  LogOut,
  FileText,
  Edit,
} from "lucide-react";
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { EditExamSchedule } from "./EditExamSchedule";
import { ExamTimetablePreview } from "./ExamTimetablePreview";
import { AlertScheduleCard } from "./AlertScheduleCard";
import { examService } from "../services/examService";

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { exams, scheduledExams, loading, refreshExams, refreshScheduledExams, alerts: ctxAlerts } = useExams();
  // selectedExam/modal removed; scheduling is inline now
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "subjects" | "schedule" | "timetable"
  >("dashboard");
  const [selectedYear, setSelectedYear] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [selectedExamType, setSelectedExamType] = useState<
    "IA1" | "IA2" | "MODEL"
  >("IA1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [examStartDate, setExamStartDate] = useState<string>("");
  const [examEndDate, setExamEndDate] = useState<string>("");
  const [alerts, setAlerts] = useState<ExamAlert[]>([]);
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});
  const [schedulingLoading, setSchedulingLoading] = useState<Record<string, boolean>>({});
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // ...existing code...

  const parseYMD = (dateStr?: string | null): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  };

  const examTypes = [
    { value: "IA1", label: "Internal Assessment 1" },
    { value: "IA2", label: "Internal Assessment 2" },
    { value: "MODEL", label: "Model Examination" },
  ];

  // Update exam dates based on selected year, semester, and exam type
  useEffect(() => {
    setAlerts(ctxAlerts || []);
    const alertExamType = mapExamTypeToAlertFormat(selectedExamType);
    const relevantAlerts = ctxAlerts?.filter(
      alert => alert.year === selectedYear && 
               alert.semester === selectedSemester && 
               alert.examType === alertExamType
    ) || [];
    
    if (relevantAlerts.length > 0) {
      setExamStartDate(relevantAlerts[0].startDate || "");
      setExamEndDate(relevantAlerts[0].endDate || "");
    } else {
      setExamStartDate("");
      setExamEndDate("");
    }
  }, [ctxAlerts, selectedYear, selectedSemester, selectedExamType, user?.department]);

  // Ensure semester options follow the selected year
  useEffect(() => {
    // Default to first semester for the chosen year
    const defaultSem = selectedYear === 1 ? 1 : selectedYear === 2 ? 3 : selectedYear === 3 ? 5 : 7;
    setSelectedSemester(defaultSem);
  }, [selectedYear]);

  // Only show subjects for the teacher's department (case-insensitive and trim whitespace)
  const departmentSubjects = exams.filter(
    (exam: any) =>
      exam.department?.trim().toLowerCase() ===
      user?.department?.trim().toLowerCase()
  );
  
  const pendingExams = departmentSubjects.filter(
    (exam: any) => exam.status === "pending"
  );
  
  // Per-year scoped arrays for the teacher's department
  const deptYear1Subjects = departmentSubjects.filter((e: any) => e.year === 1);
  const deptYear2Subjects = departmentSubjects.filter((e: any) => e.year === 2);
  const deptYear3Subjects = departmentSubjects.filter((e: any) => e.year === 3);
  const deptYear4Subjects = departmentSubjects.filter((e: any) => e.year === 4);

  const scheduledDeptYear1 = scheduledExams.filter(
    (e: any) => e.year === 1 && e.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase()
  );
  const scheduledDeptYear2 = scheduledExams.filter(
    (e: any) => e.year === 2 && e.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase()
  );
  const scheduledDeptYear3 = scheduledExams.filter(
    (e: any) => e.year === 3 && e.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase()
  );
  const scheduledDeptYear4 = scheduledExams.filter(
    (e: any) => e.year === 4 && e.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase()
  );

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
  const getAlertTitle = (alert: ExamAlert): string => {
    const year = getYearLabel(alert.year);
    const sem = getSemesterLabel(alert.semester);
    const examType = getExamTypeLabel(alert.examType);
    return `${year} YEAR ${sem} ${examType}`;
  };

  // Map selectedExamType to alert examType format
  const mapExamTypeToAlertFormat = (examType: string): string => {
    const typeMap: Record<string, string> = {
      "IA1": "Internal Assessment-I",
      "IA2": "Internal Assessment-II",
      "MODEL": "Model Exam"
    };
    return typeMap[examType] || examType;
  };

  const alertsYear1 = alerts.filter(
    (a) => a.year === 1
  );
  const alertsYear2 = alerts.filter(
    (a) => a.year === 2
  );
  const alertsYear3 = alerts.filter(
    (a) => a.year === 3
  );
  const alertsYear4 = alerts.filter(
    (a) => a.year === 4
  );

  // Get alerts for the selected semester and exam type
  const getSemesterAlerts = (year: number) => {
    const yearAlerts = year === 1 ? alertsYear1 : year === 2 ? alertsYear2 : year === 3 ? alertsYear3 : alertsYear4;
    const alertExamType = mapExamTypeToAlertFormat(selectedExamType);
    return yearAlerts.filter((a) => a.semester === selectedSemester && a.examType === alertExamType);
  };

  const handleUpdateSchedule = async () => {
    // Refresh data after update
    await refreshScheduledExams();
    setEditingSchedule(null);
  };

  const handleScheduleExam = async (examId: string, date: string) => {
    try {
      setError(null); // Clear any previous errors
      setSuccess(null); // Clear any previous success messages

      // Attempting to schedule exam with provided details
      await examService.scheduleExam(
        examId,
        date,
        user?.id || "",
        selectedExamType
      );

      // Update local state
      // Note: We don't need to manually update local state as the context will handle it
      
      // Refresh data from database to reflect changes
      await refreshScheduledExams();
      await refreshExams();

  // modal removed; nothing to close

      // Show success message
      setSuccess(`Exam scheduled successfully for ${date}!`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: any) {
      console.error("Failed to schedule exam:", error);

      // Extract error message from the error object
      let errorMessage = "Failed to schedule exam. Please try again.";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setError(errorMessage);
    }
  };

  // Calculate completion rate based on teacher's department only
  const teacherScheduledExams = scheduledExams.filter(
    (exam: any) => exam.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase()
  );
  
  const completionRate =
    departmentSubjects.length > 0
      ? Math.round((teacherScheduledExams.length / departmentSubjects.length) * 100)
      : 0;

  // Stats cards are rendered inline per year sections; no shared `stats` array needed.

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.name?.charAt(0) || "T"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.name || "Teacher"}
              </h3>
              <p className="text-sm text-gray-600">
                {user?.department || "Department"}
              </p>
              <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full mt-1">
                {user?.role === "admin" ? "Admin" : "Faculty Member"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab("subjects");
                  refreshExams(); // Refresh exams when switching to subjects tab
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "subjects"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <BookOpen className="h-5 w-5" />
                <span>My Subjects</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "schedule"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Schedule Exams</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("timetable")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "timetable"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Timetable Preview</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-600 space-y-1">
            <p>Chennai Institute of Technology</p>
            <p>Examination Management System</p>
            <p>TNEA Code: 1399</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">CIT</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Chennai Institute of Technology
                </h1>
                <p className="text-sm text-gray-600">
                  Examination Management System
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {user?.role === "admin" ? "Admin" : "Faculty Member"}
              </span>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {user?.name || "Teacher"}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Home className="h-4 w-4" />
            <span>/</span>
            <span>Faculty Portal</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "subjects" && "My Subjects"}
              {activeTab === "schedule" && "Schedule Exams"}
              {activeTab === "timetable" && "Timetable Preview"}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">
                          Faculty Dashboard
                        </h1>
                        <p className="text-blue-100 mb-1">
                          Schedule your examinations and view assignments
                        </p>
                        <p className="text-blue-200 text-sm">
                          Chennai Institute of Technology • Examination
                          Management System
                        </p>
                      </div>
                     
                    </div>
                  </div>

                  {/* Year 1 Stats */}
                  <div className="mb-8 w-full">
                    <h2 className="text-lg font-semibold mb-2 text-black">Year 1 Statistics</h2>
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Scheduled Exams */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-green-600 bg-green-100">
                            <Calendar className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{scheduledDeptYear1.length}</p>
                          <p className="text-sm text-gray-600">Scheduled Exams</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(scheduledDeptYear1.length * 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Completion Rate */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-purple-600 bg-purple-100">
                            <FileText className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">
                            {deptYear1Subjects.length > 0
                              ? `${Math.round((scheduledDeptYear1.length / deptYear1Subjects.length) * 100)}%`
                              : "0%"}
                          </p>
                          <p className="text-sm text-gray-600">Completion Rate</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${deptYear1Subjects.length > 0 ? Math.min((scheduledDeptYear1.length / deptYear1Subjects.length) * 100, 100) : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Alerts Stat */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-orange-600 bg-orange-100">
                            <AlertTriangle className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{getSemesterAlerts(1).length}</p>
                          <p className="text-sm text-gray-600">Total Alerts</p>
                        </div>
                      </div>

                      {/* Subjects Stat */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-blue-600 bg-blue-100">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{deptYear1Subjects.length}</p>
                          <p className="text-sm text-gray-600">Total Subjects</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Year 2 Stats */}
                  <div className="w-full">
                    <h2 className="text-lg font-semibold mb-2 text-black">Year 2 Statistics</h2>
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Scheduled Exams */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-green-600 bg-green-100">
                            <Calendar className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{scheduledDeptYear2.length}</p>
                          <p className="text-sm text-gray-600">Scheduled Exams</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(scheduledDeptYear2.length * 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Completion Rate */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-purple-600 bg-purple-100">
                            <FileText className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">
                            {deptYear2Subjects.length > 0
                              ? `${Math.round((scheduledDeptYear2.length / deptYear2Subjects.length) * 100)}%`
                              : "0%"}
                          </p>
                          <p className="text-sm text-gray-600">Completion Rate</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${deptYear2Subjects.length > 0 ? Math.min((scheduledDeptYear2.length / deptYear2Subjects.length) * 100, 100) : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Alerts Stat */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-orange-600 bg-orange-100">
                            <AlertTriangle className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{getSemesterAlerts(2).length}</p>
                          <p className="text-sm text-gray-600">Total Alerts</p>
                        </div>
                      </div>

                      {/* Subjects Stat */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-blue-600 bg-blue-100">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{deptYear2Subjects.length}</p>
                          <p className="text-sm text-gray-600">Total Subjects</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Year 3 Stats */}
                  <div className="w-full">
                    <h2 className="text-lg font-semibold mb-2 text-black">Year 3 Statistics</h2>
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Scheduled Exams */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-green-600 bg-green-100">
                            <Calendar className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{scheduledDeptYear3.length}</p>
                          <p className="text-sm text-gray-600">Scheduled Exams</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(scheduledDeptYear3.length * 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Completion Rate */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-purple-600 bg-purple-100">
                            <FileText className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">
                            {deptYear3Subjects.length > 0
                              ? `${Math.round((scheduledDeptYear3.length / deptYear3Subjects.length) * 100)}%`
                              : "0%"}
                          </p>
                          <p className="text-sm text-gray-600">Completion Rate</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${deptYear3Subjects.length > 0 ? Math.min((scheduledDeptYear3.length / deptYear3Subjects.length) * 100, 100) : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Alerts Stat */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-orange-600 bg-orange-100">
                            <AlertTriangle className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{getSemesterAlerts(3).length}</p>
                          <p className="text-sm text-gray-600">Total Alerts</p>
                        </div>
                      </div>

                      {/* Subjects Stat */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-blue-600 bg-blue-100">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{deptYear3Subjects.length}</p>
                          <p className="text-sm text-gray-600">Total Subjects</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Year 4 Stats */}
                  <div className="w-full">
                    <h2 className="text-lg font-semibold mb-2 text-black">Year 4 Statistics</h2>
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Scheduled Exams */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-green-600 bg-green-100">
                            <Calendar className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{scheduledDeptYear4.length}</p>
                          <p className="text-sm text-gray-600">Scheduled Exams</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(scheduledDeptYear4.length * 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Completion Rate */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-purple-600 bg-purple-100">
                            <FileText className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">
                            {deptYear4Subjects.length > 0
                              ? `${Math.round((scheduledDeptYear4.length / deptYear4Subjects.length) * 100)}%`
                              : "0%"}
                          </p>
                          <p className="text-sm text-gray-600">Completion Rate</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${deptYear4Subjects.length > 0 ? Math.min((scheduledDeptYear4.length / deptYear4Subjects.length) * 100, 100) : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Alerts Stat */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-orange-600 bg-orange-100">
                            <AlertTriangle className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{getSemesterAlerts(4).length}</p>
                          <p className="text-sm text-gray-600">Total Alerts</p>
                        </div>
                      </div>

                      {/* Subjects Stat */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg text-blue-600 bg-blue-100">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">{deptYear4Subjects.length}</p>
                          <p className="text-sm text-gray-600">Total Subjects</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content sections removed per requirements (Recent Activity and My Department) */}
                </div>
              )}

              {/* Subjects Tab */}
              {activeTab === "subjects" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      All Subjects
                    </h2>
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-gray-700">
                        Select Year:
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) =>
                          setSelectedYear(Number(e.target.value) as 1 | 2 | 3 | 4)
                        }
                        className="form-select rounded-lg border-gray-300 text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={1}>I Year</option>
                        <option value={2}>II Year</option>
                        <option value={3}>III Year</option>
                        <option value={4}>IV Year</option>
                      </select>
                      <label className="text-sm font-medium text-gray-700">
                        Select Semester:
                      </label>
                      <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(Number(e.target.value))}
                        className="form-select rounded-lg border-gray-300 text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        {(selectedYear === 1
                          ? [1, 2]
                          : selectedYear === 2
                          ? [3, 4]
                          : selectedYear === 3
                          ? [5, 6]
                          : [7, 8]
                        ).map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        Available Subjects for Year {selectedYear}, Semester {selectedSemester} (
                        {
                        departmentSubjects.filter(
                          (subj: any) => subj.year === selectedYear && (subj.semester == null || subj.semester === selectedSemester)
                        ).length
                      }
                        )
                      </h3>
                    </div>
                    {departmentSubjects.filter(
                      (subj: any) => subj.year === selectedYear && (subj.semester == null || subj.semester === selectedSemester)
                    ).length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500">
                          No subjects available for Year {selectedYear}, Semester {selectedSemester}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {departmentSubjects
                          .filter((subj: any) => subj.year === selectedYear && (subj.semester == null || subj.semester === selectedSemester))
                          .map((subj) => (
                            <div key={subj.id} className="px-6 py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <h3 className="text-base font-medium text-gray-900">
                                      {subj.subjectName}
                                    </h3>
                                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                      {subj.subjectCode}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {subj.department}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === "schedule" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Schedule Exams
                      </h2>
                    </div>

                    {/* Active Alerts */}
                    {alerts.length === 0 ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          No Exam Alerts Available
                        </h3>
                        <p className="text-blue-700">
                          No exam alerts have been created yet. Once the administration creates exam alerts, they will appear here for scheduling.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-600 text-sm">
                          Click on an alert to view details and schedule exams
                        </p>
                        <div className="grid gap-4">
                          {alerts.map((alert) => (
                            <AlertScheduleCard
                              key={alert.id}
                              alert={alert}
                              pendingExams={exams}
                              scheduledExams={scheduledExams}
                              userDepartment={user?.department || ""}
                              onScheduleExam={handleScheduleExam}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit Exam Schedule Modal (admins only) */}
                  {user?.role === "admin" && editingSchedule && (
                    <EditExamSchedule
                      schedule={editingSchedule}
                      onClose={() => setEditingSchedule(null)}
                      onUpdate={handleUpdateSchedule}
                    />
                  )}
                </div>
              )}

              {/* Timetable Tab */}
              {activeTab === "timetable" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Timetable Preview
                    </h2>
                  </div>

                  {/* Level 1: Year Selection */}
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Years">
                      <button
                        onClick={() => {
                          setSelectedYear(1);
                          setSelectedAlertId(null);
                        }}
                        className={`${
                          selectedYear === 1
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        1st Year
                      </button>
                      <button
                        onClick={() => {
                          setSelectedYear(2);
                          setSelectedAlertId(null);
                        }}
                        className={`${
                          selectedYear === 2
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        2nd Year
                      </button>
                      <button
                        onClick={() => {
                          setSelectedYear(3);
                          setSelectedAlertId(null);
                        }}
                        className={`${
                          selectedYear === 3
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        3rd Year
                      </button>
                      <button
                        onClick={() => {
                          setSelectedYear(4);
                          setSelectedAlertId(null);
                        }}
                        className={`${
                          selectedYear === 4
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        4th Year
                      </button>
                    </nav>
                  </div>

                  {/* Level 2: Alert Selection for Selected Year */}
                  {!selectedAlertId && (
                    <div className="space-y-3">
                      <p className="text-gray-600 text-sm font-medium">
                        Select an alert to view timetable:
                      </p>
                      {alerts.filter((a) => a.year === selectedYear).length === 0 ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-blue-800">
                            No alerts created for Year {selectedYear}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {alerts
                            .filter((a) => a.year === selectedYear)
                            .map((alert) => (
                              <button
                                key={alert.id}
                                onClick={() => setSelectedAlertId(alert.id)}
                                className="bg-white border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all text-left"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {getAlertTitle(alert)}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-2">
                                      {alert.startDate && new Date(alert.startDate).toLocaleDateString()} to {alert.endDate && new Date(alert.endDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-blue-600 text-lg">→</div>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Level 3: Timetable Preview for Selected Alert */}
                  {selectedAlertId && (
                    <div className="space-y-4">
                      <button
                        onClick={() => setSelectedAlertId(null)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        ← Back to Alerts
                      </button>
                      {(() => {
                        const selectedAlert = alerts.find((a) => a.id === selectedAlertId);
                        return (
                          <ExamTimetablePreview
                            scheduledExams={scheduledExams.filter(
                              (exam) =>
                                exam.year === selectedYear &&
                                exam.semester === selectedAlert?.semester
                            )}
                            startDate={selectedAlert?.startDate}
                            endDate={selectedAlert?.endDate}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
