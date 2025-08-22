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
import React, { useState } from "react";
import { X, Save, AlertTriangle, Calendar, Users } from "lucide-react";
import { ExamAlert } from "../types";
import { examService } from "../services/examService";

interface EditExamAlertProps {
  alert: ExamAlert;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditExamAlert: React.FC<EditExamAlertProps> = ({
  alert,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    title: alert.title,
    startDate: alert.startDate,
    endDate: alert.endDate,
    year: alert.year,
    semester: alert.semester,
    refId: alert.refId || "",
    examType: alert.examType || "",
    alertDate: alert.alertDate || new Date().toISOString().slice(0, 10),
    deadline: alert.deadline || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update the exam alert
      await examService.updateExamAlert(alert.id, {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        year: formData.year,
        semester: formData.semester,
        refId: formData.refId,
        examType: formData.examType,
        alertDate: formData.alertDate,
        deadline: formData.deadline,
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Failed to update exam alert:", error);
      setError(error.message || "Failed to update exam alert");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Edit Exam Alert</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    Update Error
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Internal Assessment-II - III Year"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type
                </label>
                <select
                  value={formData.examType}
                  onChange={(e) => handleInputChange("examType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Exam Type</option>
                  <option value="Internal Assessment-I">Internal Assessment-I</option>
                  <option value="Internal Assessment-II">Internal Assessment-II</option>
                  <option value="Model Exam">Model Exam</option>
                  <option value="End Semester">End Semester</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Date
                </label>
                <input
                  type="date"
                  value={formData.alertDate}
                  onChange={(e) => handleInputChange("alertDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    handleInputChange("year", newYear);
                    // Set semester to first valid for new year
                    handleInputChange("semester", yearSemesterMap[newYear][0]);
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
                    handleInputChange("semester", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearSemesterMap[formData.year]?.map((sem) => (
                    <option key={sem} value={sem}>
                      {semesterLabels[sem]}
                    </option>
                  ))}
                </select>
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
                onChange={(e) => handleInputChange("refId", e.target.value)}
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
                onChange={(e) => handleInputChange("deadline", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    await examService.deleteExamAlert(alert.id);
                    onUpdate();
                    onClose();
                  } catch (error: any) {
                    setError(error.message || "Failed to delete exam alert");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>{loading ? "Deleting..." : "Delete Alert"}</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? "Updating..." : "Update Alert"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
