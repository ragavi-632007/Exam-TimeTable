import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Upload,
  Download,
} from "lucide-react";
import {CreateSubjectData, subjectService, Subject} from "../services/subjectService";
import {examService} from "../services/examService";

interface SubjectWithSchedule extends Subject {
  isScheduled: boolean;
  scheduledDate?: string;
  assignedBy?: string;
}

export const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectWithSchedule[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "scheduled" | "pending"
  >("all");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedSemester, setSelectedSemester] = useState<number | "all">("all");
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([]);
  const [bulkUploadSummary, setBulkUploadSummary] = useState<{
    inserted: number;
  } | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [newSubject, setNewSubject] = useState({
    subcode: "",
    name: "",
    year: 1,
    semester: 1,
    department: ""
  });

  // Get unique years and semesters from subjects
  const uniqueSemesters = [...new Set(subjects.map((s) => s.semester))].sort();

  // Allowed semesters depend on selected year
  const allowedSemesters: number[] =
    selectedYear === 1
      ? [1, 2]
      : selectedYear === 2
      ? [3, 4]
      : selectedYear === 3
      ? [5, 6]
      : selectedYear === 4
      ? [7, 8]
      : uniqueSemesters;

  useEffect(() => {
    loadSubjects();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showYearDropdown || showSemesterDropdown) {
        const target = event.target as Element;
        if (!target.closest(".dropdown-container")) {
          setShowYearDropdown(false);
          setShowSemesterDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showYearDropdown, showSemesterDropdown]);

  // Ensure semester selection stays valid when year changes
  useEffect(() => {
    if (
      selectedSemester !== "all" &&
      !allowedSemesters.includes(selectedSemester)
    ) {
      setSelectedSemester("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const subjectsData = await subjectService.getAllSubjects();

      // Try to get scheduled exams, but don't fail if there are none
      let scheduledExams: any[] = [];
      try {
        scheduledExams = await examService.getScheduledExams();
      } catch (scheduleError) {
        console.log("No scheduled exams found yet:", scheduleError);
      }

      // Create a map of scheduled exams by subject ID
      const scheduledMap = new Map();
      scheduledExams.forEach((schedule) => {
        scheduledMap.set(schedule.subjectId, {
          date: schedule.examDate,
          assignedBy: schedule.assignedBy,
        });
      });

      // Combine subject data with scheduling status
      const subjectsWithSchedule: SubjectWithSchedule[] = subjectsData.map(
        (subject) => ({
          ...subject,
          isScheduled: scheduledMap.has(subject.id),
          scheduledDate: scheduledMap.get(subject.id)?.date,
          assignedBy: scheduledMap.get(subject.id)?.assignedBy,
        })
      );

      setSubjects(subjectsWithSchedule);
    } catch (error) {
      console.error("Error loading subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetBulkUploadState = () => {
    setBulkUploadErrors([]);
    setBulkUploadSummary(null);
    setSelectedFileName("");
    setIsBulkUploading(false);
  };

  const downloadTemplate = () => {
    const header = "subcode,name,department,year,semester\n";
    const sampleRows = [
      "CS101,Programming Fundamentals,CSE,1,1",
      "MA101,Calculus I,Mathematics,1,1",
    ].join("\n");
    const blob = new Blob([`${header}${sampleRows}\n`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "subject_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const splitCsvLine = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (char === "," && !insideQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    cells.push(current);
    return cells;
  };

  const parseCsv = (
    csvText: string
  ): { records: CreateSubjectData[]; errors: string[] } => {
    const errors: string[] = [];
    const trimmed = csvText.trim();

    if (!trimmed) {
      errors.push("The CSV file is empty.");
      return { records: [], errors };
    }

    const lines = trimmed
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      errors.push("No data rows found in the CSV.");
      return { records: [], errors };
    }

    const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const requiredHeaders = ["subcode", "name", "department", "year", "semester"];
    const missing = requiredHeaders.filter((header) => !headers.includes(header));

    if (missing.length) {
      errors.push(`Missing columns: ${missing.join(", ")}`);
      return { records: [], errors };
    }

    const records: CreateSubjectData[] = [];

    lines.slice(1).forEach((line, index) => {
      if (!line.trim()) return;

      const values = splitCsvLine(line).map((value) => value.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? "";
      });

      const year = Number(row.year);
      const semester = Number(row.semester);

      if (
        !row.subcode ||
        !row.name ||
        !row.department ||
        Number.isNaN(year) ||
        Number.isNaN(semester)
      ) {
        errors.push(`Row ${index + 2}: Missing or invalid data.`);
        return;
      }

      records.push({
        subcode: row.subcode,
        name: row.name,
        department: row.department,
        year,
        semester,
        is_shared: row.is_shared?.toLowerCase() === "true",
      });
    });

    return { records, errors };
  };

  const handleBulkFile = (file: File) => {
    setBulkUploadErrors([]);
    setBulkUploadSummary(null);
    setIsBulkUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = (reader.result as string) || "";
        const { records, errors } = parseCsv(text);

        if (errors.length) {
          setBulkUploadErrors(errors);
          return;
        }

        if (!records.length) {
          setBulkUploadErrors(["No valid rows found in the CSV."]);
          return;
        }

        const created = await subjectService.bulkCreateSubjects(records);
        setBulkUploadSummary({ inserted: created.length });
        await loadSubjects();
      } catch (error) {
        console.error("Bulk upload failed:", error);
        setBulkUploadErrors([
          error instanceof Error ? error.message : "Failed to upload subjects.",
        ]);
      } finally {
        setIsBulkUploading(false);
      }
    };
    reader.onerror = () => {
      setBulkUploadErrors(["Unable to read the selected file."]);
      setIsBulkUploading(false);
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    handleBulkFile(file);
    event.target.value = "";
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "scheduled" && subject.isScheduled) ||
      (filterStatus === "pending" && !subject.isScheduled);

    const matchesYear = selectedYear === "all" || subject.year === selectedYear;
    const matchesSemester =
      selectedSemester === "all"
        ? selectedYear === 1
          ? [1, 2].includes(subject.semester)
          : selectedYear === 2
          ? [3, 4].includes(subject.semester)
          : selectedYear === 3
          ? [5, 6].includes(subject.semester)
          : selectedYear === 4
          ? [7, 8].includes(subject.semester)
          : true
        : subject.semester === selectedSemester;

    // If a specific semester is selected, only show subjects for that semester
    // This ensures strict filtering for cases like 2nd year, sem 3

    // Debug logging
    if (selectedYear !== "all" || selectedSemester !== "all") {
      console.log("Filtering subject:", subject.name, {
        year: subject.year,
        selectedYear,
        semester: subject.semester,
        selectedSemester,
        matchesYear,
        matchesSemester,
      });
    }

    return matchesSearch && matchesFilter && matchesYear && matchesSemester;
  });

  const getStatusBadge = (isScheduled: boolean) => {
    if (isScheduled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1" />
          Scheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-4 w-4 mr-1" />
        Pending
      </span>
    );
  };

  // Edit functionality removed

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await subjectService.deleteSubject(id);
        // Refresh the subjects list
        await loadSubjects();
      } catch (error) {
        console.error("Error deleting subject:", error);
      }
    }
  };

  // Add subject functionality removed per requirements


  // Removed unused aggregate stats (using filtered stats instead)

  // Update stats based on current filters (excluding text search)
  const getFilteredStats = () => {
    const yearFiltered = subjects.filter(
      (s) => selectedYear === "all" || s.year === selectedYear
    );
    const semesterFiltered = yearFiltered.filter((s) => {
      if (selectedSemester === "all") {
        if (selectedYear === 1) return [1, 2].includes(s.semester);
        if (selectedYear === 2) return [3, 4].includes(s.semester);
        if (selectedYear === 3) return [5, 6].includes(s.semester);
        if (selectedYear === 4) return [7, 8].includes(s.semester);
        return true;
      }
      return s.semester === selectedSemester;
    });
    const totalYearSem = semesterFiltered.length;
    const scheduled = semesterFiltered.filter((s) => s.isScheduled).length;
    const pending = totalYearSem - scheduled;
    return {
      total: subjects.length,
      totalYearSem,
      scheduled,
      pending,
    };
  };

  const currentStats = getFilteredStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subjectService.createSubject(newSubject);
      setShowAddForm(false);
      setNewSubject({
        subcode: "",
        name: "",
        year: 1,
        semester: 1,
        department: ""
      });
      await loadSubjects(); // Refresh the list
    } catch (error) {
      console.error("Error adding subject:", error);
      alert("Failed to add subject. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Subject Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage subjects and view their scheduling status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              resetBulkUploadState();
              setShowBulkUpload(true);
            }}
            className="px-4 py-2 border border-blue-200 text-blue-700 bg-white rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Upload CSV</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Subject
          </button>
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Subject</h3>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                <input
                  type="text"
                  required
                  value={newSubject.subcode}
                  onChange={(e) => setNewSubject({ ...newSubject, subcode: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <select
                  required
                  value={newSubject.year}
                  onChange={(e) => setNewSubject({ ...newSubject, year: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4].map((year) => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Semester</label>
                <select
                  required
                  value={newSubject.semester}
                  onChange={(e) => setNewSubject({ ...newSubject, semester: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  required
                  value={newSubject.department}
                  onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Bulk Upload Subjects</h3>
                <p className="text-sm text-gray-600">
                  Upload a CSV file with columns: subcode, name, department, year, semester.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBulkUpload(false);
                  resetBulkUploadState();
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close bulk upload"
              >
                X
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-800">
              <p className="font-semibold">Tips</p>
              <ul className="list-disc list-inside space-y-1">
                <li>One subject per row.</li>
                <li>Year and semester must be numbers.</li>
                <li>Existing subject codes are ignored to avoid duplicates.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-gray-700">
                  Need a starting point? Download a ready-to-fill template.
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  <span>Download template</span>
                </button>
              </div>

              <label className="flex items-center justify-between w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Upload className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Choose CSV file</p>
                    <p className="text-xs text-gray-500">
                      {selectedFileName || "Only .csv files are supported"}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>

              {isBulkUploading && (
                <div className="text-sm text-blue-700">Uploading subjects...</div>
              )}

              {bulkUploadSummary && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3">
                  Successfully uploaded {bulkUploadSummary.inserted} subjects.
                </div>
              )}

              {bulkUploadErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 space-y-1">
                  {bulkUploadErrors.map((error, idx) => (
                    <div key={idx}>• {error}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBulkUpload(false);
                  resetBulkUploadState();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Subjects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentStats.totalYearSem}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentStats.scheduled}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentStats.pending}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Visible Results
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredSubjects.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        {(selectedYear !== "all" || selectedSemester !== "all") && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Showing results for:</span>
            {selectedYear !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Year {selectedYear}
              </span>
            )}
            {selectedSemester !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Semester {selectedSemester}
              </span>
            )}
            <button
              onClick={() => {
                setSelectedYear("all");
                setSelectedSemester("all");
              }}
              className="text-blue-600 hover:text-blue-800 underline text-xs"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search subjects by name, code, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Year Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center justify-between w-40 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <span>
                {selectedYear === "all" ? "All Years" : `Year ${selectedYear}`}
              </span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            {showYearDropdown && (
              <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    setSelectedYear("all");
                    setShowYearDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                >
                  All Years
                </button>
                {[1, 2, 3, 4].map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    Year {year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Semester Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
              className="flex items-center justify-between w-40 px-2 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <span>
                {selectedSemester === "all"
                  ? "All Semesters"
                  : `Semester ${selectedSemester}`}
              </span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            {showSemesterDropdown && (
              <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    setSelectedSemester("all");
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

          {/* Status Filter Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({currentStats.totalYearSem})
            </button>
            <button
              onClick={() => setFilterStatus("scheduled")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "scheduled"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Scheduled ({currentStats.scheduled})
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "pending"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending ({currentStats.pending})
            </button>
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SUBJECT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DEPARTMENT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  YEAR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SEMESTER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SCHEDULE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subject.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subject.subcode}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {subject.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Year {subject.year}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Semester {subject.semester}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(subject.isScheduled)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {subject.isScheduled ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {new Date(
                              subject.scheduledDate!
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        {subject.assignedBy && (
                          <div className="text-xs text-gray-500">
                            Assigned by: {subject.assignedBy}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Not scheduled</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500">No subjects found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "No subjects available"}
          </p>
        </div>
      )}
    </div>
  );
};
