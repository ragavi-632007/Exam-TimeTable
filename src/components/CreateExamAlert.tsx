import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Calendar, Users, Plus } from "lucide-react";
import { ExamAlert } from "../types";
import { examService } from "../services/examService";

// Define departments list directly instead of importing from mockData
const departments = [
  'ACT', 'AIDS', 'AIML', 'BME', 'CE', 'CSBS', 'CSE', 
  'CYBER', 'ECE', 'EEE', 'IT', 'MCT', 'MECH', 'VLSI'
];

interface CreateExamAlertProps {
  onClose: () => void;
  onSubmit: (alert: Omit<ExamAlert, "id" | "createdAt">) => void;
}

export const CreateExamAlert: React.FC<CreateExamAlertProps> = ({
  onClose,
  onSubmit,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    examType: "",
    academicYear: "",
    startDate: "",
    endDate: "",
    year: 1,
    semester: 1,
    refId: "",
    deadline: "",
  });

  // Map year to allowed semesters
  const yearSemesterMap: Record<number, number[]> = {
    1: [1, 2],
    2: [3, 4],
    3: [5, 6],
    4: [7, 8],
  };

  // Semester labels
  const semesterLabels: Record<number, string> = {
    1: "Semester 1",
    2: "Semester 2",
    3: "Semester 3",
    4: "Semester 4",
    5: "Semester 5",
    6: "Semester 6",
    7: "Semester 7",
    8: "Semester 8",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("User not found. Please log in.");
      return;
    }
    const alertData = {
      title:
        formData.title || `${formData.examType} - ${formData.academicYear}`,
      startDate: formData.startDate,
      endDate: formData.endDate,
      year: formData.year,
      semester: formData.semester,
      refId: formData.refId,
      examType: formData.examType,
      alertDate: new Date().toISOString().slice(0, 10),
      departments: [],
      status: "active" as const,
      createdBy: user.id,
    };
    try {
      await examService.createExamAlert(alertData);
      alert("Exam alert created successfully!");
      onSubmit(alertData);
      onClose();
    } catch (err) {
      alert("Failed to create exam alert. Please try again.");
      console.error(err);
    }
  };

  const handleDepartmentToggle = (deptCode: string) => {
    setFormData((prev) => ({
      ...prev,
      // departments logic removed
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">
              Create Examination Alert
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Examination Type
              </label>
              <select
                value={formData.examType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, examType: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Exam Type</option>
                <option value="Internal Assessment-I">
                  Internal Assessment-I
                </option>
                <option value="Internal Assessment-II">
                  Internal Assessment-II
                </option>
                <option value="Model Exam">Model Exam</option>
                <option value="End Semester">End Semester</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    academicYear: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Academic Year</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => {
                  const newYear = Number(e.target.value);
                  // Set semester to first valid for new year
                  setFormData((prev) => ({
                    ...prev,
                    year: newYear,
                    semester: yearSemesterMap[newYear][0],
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    semester: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {yearSemesterMap[formData.year].map((sem) => (
                  <option key={sem} value={sem}>
                    {semesterLabels[sem]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Ref ID Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ref ID
            </label>
            <input
              type="text"
              required
              value={formData.refId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, refId: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Reference ID"
            />
          </div>

          {/* Deadline Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline
            </label>
            <input
              type="date"
              value={formData.deadline || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deadline: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
