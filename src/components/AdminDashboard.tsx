import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useExams } from "../context/ExamContext";
import { ExamAlert } from "../types";

import {
  Calendar,
  FileText,
  Users,
  AlertTriangle,
  Plus,
  Download,
  Home,
  Building,
  Bell,
  User,
  LogOut,
  Clock,
  Edit,
} from "lucide-react";
import { CreateExamAlert } from "./CreateExamAlert";
import { EditExamAlert } from "./EditExamAlert";
import { EditExamSchedule } from "./EditExamSchedule";
import { ExamScheduleTable } from "./ExamScheduleTable";
import { PDFGenerator } from "./PDFGenerator";
import { StaffManagement } from "./StaffManagement";
import { SubjectManagement } from "./SubjectManagement";

import { examService } from "../services/examService";

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { exams, scheduledExams } = useExams();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "alerts" | "overview" | "pdf" | "staff" | "subjects"
  >("dashboard");
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [editingAlert, setEditingAlert] = useState<ExamAlert | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);

  const [alerts, setAlerts] = useState<ExamAlert[]>([]);

  // Fetch alerts from DB on mount
  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const dbAlerts = await examService.getExamAlerts();
        setAlerts(dbAlerts);
      } catch (err) {
        console.error("Failed to fetch exam alerts:", err);
      }
    };
    fetchAlerts();
  }, []);

  const handleCreateAlert = async () => {
    // After creating, re-fetch alerts from DB
    try {
      const dbAlerts = await examService.getExamAlerts();
      setAlerts(dbAlerts);
    } catch (err) {
      console.error("Failed to fetch exam alerts:", err);
    }
    setShowCreateAlert(false);
  };

  const handleUpdateAlert = async () => {
    // Always re-fetch alerts from DB after update or delete
    try {
      const dbAlerts = await examService.getExamAlerts();
      setAlerts(dbAlerts);
    } catch (err) {
      console.error("Failed to fetch exam alerts:", err);
    }
    setEditingAlert(null);
  };

  const handleUpdateSchedule = async () => {
    // Refresh scheduled exams data from the database
    try {
      // This will trigger a re-render with updated data
      // The useExams context should handle the refresh
      setEditingSchedule(null);
    } catch (error) {
      console.error("Error refreshing schedule data:", error);
    }
  };

  const testExamSchedulesAccess = async () => {
    try {
      await examService.testExamSchedulesAccess();
      alert(
        "Successfully accessed exam_schedules table! Check console for details."
      );
    } catch (error) {
      console.error("Test failed:", error);
      alert(
        "Failed to access exam_schedules table. Check console for details."
      );
    }
  };
  const scheduledExamsCount = exams.filter(
    (exam) => exam.status === "scheduled"
  ).length;
  const pendingExamsCount = exams.filter(
    (exam) => exam.status === "pending"
  ).length;

  const stats = [
    {
      label: "Total Exam Alerts",
      value: alerts.length.toString(),
      icon: AlertTriangle,
      color: "text-blue-600 bg-blue-100",
      progress: 25,
    },
    {
      label: "Scheduled Exams",
      value: scheduledExams.length.toString(),
      icon: Calendar,
      color: "text-green-600 bg-green-100",
      progress: Math.min(scheduledExams.length * 10, 100),
    },
    {
      label: "Active Alerts",
      value: alerts.filter((a) => a.status === "active").length.toString(),
      icon: Calendar,
      color: "text-orange-600 bg-orange-100",
      progress: 25,
    },
    {
      label: "Completion Rate",
      value: `${Math.round((scheduledExams.length / exams.length) * 100)}%`,
      icon: FileText,
      color: "text-purple-600 bg-purple-100",
      progress: Math.min((scheduledExams.length / exams.length) * 100, 100),
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
                {user?.name?.charAt(0) || "A"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.name || "Administrator"}
              </h3>
              <p className="text-sm text-gray-600">Administration</p>
              <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full mt-1">
                Administrator
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
                onClick={() => setActiveTab("alerts")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "alerts"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
                <span>Exam Alerts</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "overview"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Overview</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("pdf")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "pdf"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Download className="h-5 w-5" />
                <span>PDF Generation</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("staff")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "staff"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Staff Management</span>
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
                <FileText className="h-5 w-5" />
                <span>Subject Management</span>
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
                Administrator
              </span>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {user?.name || "Administrator"}
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
            <span>Administration</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Dashboard</span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      Administrative Dashboard
                    </h1>
                    <p className="text-blue-100 mb-1">
                      Manage examination schedules and notifications
                    </p>
                    <p className="text-blue-200 text-sm">
                      Chennai Institute of Technology • Examination Management
                      System
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold">14 Departments</div>
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
                {/* Department Overview */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Department Overview
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Examination status across all departments
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      "CSE",
                      "ECE",
                      "EEE",
                      "MECH",
                      "IT",
                      "AIDS",
                      "AIML",
                      "CSBS",
                      "CYBER",
                      "VLSI",
                      "ACT",
                      "MCT",
                      "BME",
                    ].map((dept: string) => (
                      <div
                        key={dept}
                        className="bg-blue-50 rounded-lg p-6 text-center text-base"
                      >
                        <p className="text-sm font-medium text-blue-900">
                          {dept}
                        </p>
                        <p className="text-xs text-blue-700">Department</p>
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Active
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Alerts Tab */}
          {activeTab === "alerts" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Examination Alerts
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCreateAlert(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Alert</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-6">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {alert.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Year {alert.year} • Semester {alert.semester}
                        </p>
                        <p className="text-sm text-gray-600">
                          Duration: {alert.startDate} to {alert.endDate}
                        </p>
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">
                            Departments:{" "}
                          </span>
                          {alert.departments.map((dept, index) => (
                            <span
                              key={dept}
                              className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1"
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            alert.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {alert.status}
                        </span>
                        <button
                          onClick={() => setEditingAlert(alert)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Edit Alert"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showCreateAlert && (
                <CreateExamAlert
                  onClose={() => setShowCreateAlert(false)}
                  onSubmit={handleCreateAlert}
                />
              )}

              {editingAlert && (
                <EditExamAlert
                  alert={editingAlert}
                  onClose={() => setEditingAlert(null)}
                  onUpdate={handleUpdateAlert}
                />
              )}

              {editingSchedule && (
                <EditExamSchedule
                  schedule={editingSchedule}
                  onClose={() => setEditingSchedule(null)}
                  onUpdate={handleUpdateSchedule}
                />
              )}
            </div>
          )}
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Exam Schedule Overview
                </h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab("pdf")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Generate PDF</span>
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Total Scheduled
                    </h3>
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {scheduledExams.length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Active exam schedules
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Departments
                    </h3>
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {
                      new Set(scheduledExams.map((exam) => exam.department))
                        .size
                    }
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    With active schedules
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Next Exam
                    </h3>
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  {scheduledExams.length > 0 ? (
                    <>
                      <p className="text-xl font-bold text-gray-900">
                        {new Date(
                          scheduledExams[0].examDate
                        ).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">No upcoming exams</p>
                  )}
                </div>
              </div>

              {/* Scheduled Exams List */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Scheduled Exams by Department
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-600">
                        Latest Updates
                      </span>
                    </div>
                  </div>
                </div>

                {scheduledExams.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No exams scheduled yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Teachers can schedule exams from their dashboard
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 max-h-[50vh] overflow-auto">
                    {scheduledExams.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="px-6 py-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-base font-medium text-gray-900">
                                {schedule.subjectName}
                              </h4>
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {schedule.subjectCode}
                              </span>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {schedule.department}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Date:</span>{" "}
                                {new Date(
                                  schedule.examDate
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-600"></p>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <p className="text-xs text-gray-500">
                                Scheduled by: {schedule.assignedBy}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                              Confirmed
                            </span>
                            <button
                              onClick={() => setEditingSchedule(schedule)}
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

              {/* Department-wise Schedule Table */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Detailed Schedule
                  </h3>
                </div>
                <div className="p-6">
                  <ExamScheduleTable
                    exams={exams}
                    scheduledExams={scheduledExams}
                  />
                </div>
              </div>
            </div>
          )}
          {/* PDF Generation Tab */}
          {activeTab === "pdf" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Generate Examination Timetable PDF
              </h2>
              <PDFGenerator />
            </div>
          )}
          {/* Staff Management Tab */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              <StaffManagement />
            </div>
          )}
          {/* Subject Management Tab */}
          {activeTab === "subjects" && (
            <div className="space-y-6">
              <SubjectManagement />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
