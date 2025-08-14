import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useExams } from "../context/ExamContext";
import { Exam } from "../types";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Home,
  Building,
  User,
  LogOut,
  FileText,
  Edit,
  ChevronDown,
} from "lucide-react";
import { ExamScheduler } from "./ExamScheduler";
import { EditExamSchedule } from "./EditExamSchedule";
import { ExamTimetablePreview } from "./ExamTimetablePreview";
import { examService } from "../services/examService";

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { exams, scheduledExams, loading, refreshExams, refreshScheduledExams } = useExams();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "subjects" | "schedule" | "timetable"
  >("dashboard");
  const [selectedYear, setSelectedYear] = useState<2 | 3>(2);
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [selectedExamType, setSelectedExamType] = useState<
    "IA1" | "IA2" | "IA3"
  >("IA1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [examStartDate, setExamStartDate] = useState<string>("");
  const [examEndDate, setExamEndDate] = useState<string>("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSemesterDropdown) {
        const target = event.target as Element;
        if (!target.closest('.dropdown-container')) {
          setShowSemesterDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSemesterDropdown]);

  // Allowed semesters depend on selected year
  const allowedSemesters: number[] =
    selectedYear === 2
      ? [3, 4]
      : selectedYear === 3
      ? [5, 6]
      : [1, 2, 3, 4, 5, 6, 7, 8];

  // Ensure semester selection stays valid when year changes
  useEffect(() => {
    if (selectedSemester !== 'all' && !allowedSemesters.includes(selectedSemester)) {
      setSelectedSemester('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Log when ExamScheduler modal is opened
  useEffect(() => {
    if (selectedExam) {
      console.log("[TeacherDashboard] ExamScheduler modal opened", {
        exam: selectedExam,
        timestamp: new Date().toISOString(),
      });
    }
  }, [selectedExam]);

  const examTypes = [
    { value: "IA1", label: "Internal Assessment 1" },
    { value: "IA2", label: "Internal Assessment 2" },
    { value: "IA3", label: "Internal Assessment 3" },
  ];

  // Load exam alerts to get exam period dates
  useEffect(() => {
    const fetchExamAlerts = async () => {
      try {
        const examAlerts = await examService.getExamAlerts();
        if (examAlerts && examAlerts.length > 0) {
          setExamStartDate(examAlerts[0].startDate || "");
          setExamEndDate(examAlerts[0].endDate || "");
        }
      } catch (err) {
        console.error("Error fetching exam alerts:", err);
      }
    };
    fetchExamAlerts();
  }, []);

  // Only show subjects for the teacher's department (case-insensitive and trim whitespace)
  const departmentSubjects = exams.filter(
    (exam: any) =>
      exam.department?.trim().toLowerCase() ===
      user?.department?.trim().toLowerCase() &&
      (selectedSemester === 'all' || exam.semester === selectedSemester)
  );
  
  const pendingExams = departmentSubjects.filter(
    (exam: any) => exam.status === "pending"
  );

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

      setSelectedExam(null);

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
    (exam: any) => 
      exam.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase() &&
      (selectedSemester === 'all' || exam.semester === selectedSemester)
  );
  
  const completionRate =
    departmentSubjects.length > 0
      ? Math.round((teacherScheduledExams.length / departmentSubjects.length) * 100)
      : 0;

  const stats = [
    {
      label: "Available Subjects",
      value: departmentSubjects.length.toString(),
      icon: BookOpen,
      color: "text-blue-600 bg-blue-100",
      progress: 0,
    },
    {
      label: "Scheduled Exams",
      value: teacherScheduledExams.length.toString(),
      icon: Calendar,
      color: "text-green-600 bg-green-100",
      progress: 0,
    },
    {
      label: "Pending Schedules",
      value: pendingExams.length.toString(),
      icon: Clock,
      color: "text-orange-600 bg-orange-100",
      progress: 0,
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: FileText,
      color: "text-purple-600 bg-purple-100",
      progress: completionRate,
    },
  ];

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
                onClick={() => setActiveTab("subjects")}
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
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold">12 Departments</div>
                        <div className="text-2xl font-bold">150+ Faculty</div>
                        <div className="text-2xl font-bold">3000+ Students</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-lg ${stat.color}`}>
                            <stat.icon className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-gray-900">
                            {stat.value}
                          </p>
                          <p className="text-sm text-gray-600">{stat.label}</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stat.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Content Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Recent Activity
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Latest examination alerts and schedules
                      </p>
                      <div className="text-center py-8">
                        <p className="text-gray-500">No recent activity</p>
                      </div>
                    </div>

                    {/* My Department */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Building className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          My Department
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Your department status
                      </p>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-blue-900">
                            {user?.department || "Department"}
                          </p>
                          <p className="text-sm text-blue-700">
                            Your Department
                          </p>
                          <p className="text-sm text-green-600 font-medium">
                            ✓ Active
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
                          setSelectedYear(Number(e.target.value) as 2 | 3)
                        }
                        className="form-select rounded-lg border-gray-300 text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={2}>II Year</option>
                        <option value={3}>III Year</option>
                      </select>
                      
                      <label className="text-sm font-medium text-gray-700">
                        Select Semester:
                      </label>
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                          className="flex items-center justify-between w-40 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <span>{selectedSemester === 'all' ? 'All Semesters' : `Semester ${selectedSemester}`}</span>
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </button>
                        {showSemesterDropdown && (
                          <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                            <button
                              onClick={() => {
                                setSelectedSemester('all');
                                setShowSemesterDropdown(false);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                            >
                              All Semesters
                            </button>
                            {allowedSemesters.map((semester) => (
                              <button
                                key={semester}
                                onClick={() => {
                                  setSelectedSemester(semester);
                                  setShowSemesterDropdown(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                              >
                                Semester {semester}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        Available Subjects for Year {selectedYear} (
                        {
                          departmentSubjects.filter(
                            (subj: any) => subj.year === selectedYear
                          ).length
                        }
                        )
                      </h3>
                      {selectedSemester !== 'all' && (
                        <p className="text-sm text-gray-600 mt-1">
                          Filtered by Semester {selectedSemester}
                        </p>
                      )}
                    </div>
                    {departmentSubjects.filter(
                      (subj: any) => subj.year === selectedYear
                    ).length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500">
                          No subjects available for Year {selectedYear}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {departmentSubjects
                          .filter((subj: any) => subj.year === selectedYear)
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
                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-red-800">
                            Scheduling Error
                          </h3>
                          <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                        <button
                          onClick={() => setError(null)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <span className="sr-only">Dismiss</span>
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Success Display */}
                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-green-800">
                            Success!
                          </h3>
                          <p className="text-sm text-green-700 mt-1">
                            {success}
                          </p>
                        </div>
                        <button
                          onClick={() => setSuccess(null)}
                          className="text-green-400 hover:text-green-600"
                        >
                          <span className="sr-only">Dismiss</span>
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Schedule Exams
                      </h2>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Year:
                          </label>
                          <select
                            value={selectedYear}
                            onChange={(e) =>
                              setSelectedYear(Number(e.target.value) as 2 | 3)
                            }
                            className="w-full form-select rounded-lg border-gray-300 text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value={2}>II Year</option>
                            <option value={3}>III Year</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Semester:
                          </label>
                          <div className="relative dropdown-container">
                            <button
                              onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                              className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <span>{selectedSemester === 'all' ? 'All Semesters' : `Semester ${selectedSemester}`}</span>
                              <ChevronDown className="h-4 w-4 ml-2" />
                            </button>
                            {showSemesterDropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                <button
                                  onClick={() => {
                                    setSelectedSemester('all');
                                    setShowSemesterDropdown(false);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                                >
                                  All Semesters
                                </button>
                                {allowedSemesters.map((semester) => (
                                  <button
                                    key={semester}
                                    onClick={() => {
                                      setSelectedSemester(semester);
                                      setShowSemesterDropdown(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    Semester {semester}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Exam Type:
                          </label>
                          <select
                            value={selectedExamType}
                            onChange={(e) =>
                              setSelectedExamType(
                                e.target.value as "IA1" | "IA2" | "IA3"
                              )
                            }
                            className="w-full form-select rounded-lg border-gray-300 text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {examTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pending Exams Section */}
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Exams Requiring Schedule (
                          {
                            pendingExams.filter(
                              (exam: any) => exam.year === selectedYear
                            ).length
                          }
                          )
                        </h3>
                      </div>
                    </div>

                    {pendingExams.filter(
                      (exam: any) => exam.year === selectedYear
                    ).length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500">
                          No pending exams to schedule for Year {selectedYear}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {pendingExams
                          .filter((exam: any) => exam.year === selectedYear)
                          .map((exam: any) => (
                            <div key={exam.id} className="px-6 py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <h3 className="text-base font-medium text-gray-900">
                                      {exam.subjectName}
                                    </h3>
                                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                      {exam.subjectCode}
                                    </span>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      Year {exam.year}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Department: {exam.department} • Course ID:{" "}
                                    {exam.courseId}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Schedule between: {exam.startDate} -{" "}
                                    {exam.endDate}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setSelectedExam(exam)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Schedule Date
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Scheduled Exams Section */}
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Scheduled Exams 
                        </h3>
                      </div>
                    </div>

                    {scheduledExams
                      .filter((exam) => 
                        exam.year === selectedYear && 
                        exam.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase() &&
                        (selectedSemester === 'all' || exam.semester === selectedSemester)
                      )
                      .length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500">
                          No scheduled exams yet for Year {selectedYear}
                          {selectedSemester !== 'all' ? ` Semester ${selectedSemester}` : ''}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {scheduledExams
                          .filter((exam) => 
                            exam.year === selectedYear && 
                            exam.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase() &&
                            (selectedSemester === 'all' || exam.semester === selectedSemester)
                          )
                          .map((exam) => (
                            <div key={exam.id} className="px-6 py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <h3 className="text-base font-medium text-gray-900">
                                      {exam.subjectName}
                                    </h3>
                                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                      {exam.subjectCode}
                                    </span>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      Year {exam.year}
                                    </span>
                                    {exam.semester && (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Sem {exam.semester}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Department: {exam.department} • Course ID:{" "}
                                    {exam.courseId}
                                  </p>
                                  <p className="text-sm font-medium text-green-600">
                                    Scheduled for: {exam.scheduledDate}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                    Confirmed
                                  </span>
                                  <button
                                    onClick={() => setEditingSchedule(exam)}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                    title="Edit Schedule"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Exam Scheduler Modal */}
                  {selectedExam && (
                    <ExamScheduler
                      exam={{
                        ...selectedExam,
                        startDate: examStartDate || "",
                        endDate: examEndDate || "",
                      }}
                      onClose={() => setSelectedExam(null)}
                      onSchedule={handleScheduleExam}
                    />
                  )}

                  {/* Edit Exam Schedule Modal */}
                  {editingSchedule && (
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
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                       Timetable Preview
                    </h2>
                    
                  </div>
                  
                  {/* ExamTimetablePreview Component */}
                  <ExamTimetablePreview scheduledExams={scheduledExams} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
