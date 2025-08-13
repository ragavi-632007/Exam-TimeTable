import React, { useState, useEffect, useMemo } from "react";
import { Download, Calendar } from "lucide-react";
import jsPDF from "jspdf";

import { examService } from "../services/examService";
import { departmentService } from "../services/departmentService";

// Define departments for PDF generation (fallback if API fails)
const defaultDepartments = [
  { code: "CE", name: "Civil Engineering" },
  { code: "CS", name: "Computer Science & Engineering" },
  { code: "EC", name: "Electronics & Communication Engineering" },
  { code: "IT", name: "Information Technology" },
  { code: "ME", name: "Mechanical Engineering" },
];

// Accepts optional selectedAlert prop for dynamic data injection
interface PDFGeneratorProps {
  selectedAlert?: {
    referenceCode?: string;
    year?: string;
    examName?: string;
    [key: string]: any;
  };
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  selectedAlert,
}) => {
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2");
  const [selectedExam, setSelectedExam] = useState("IA2");
  const [scheduledExams, setScheduledExams] = useState<any[]>([]);
  const [departments, setDepartments] = useState(defaultDepartments);
  const [loading, setLoading] = useState(true);

  // Compute the first (earliest) scheduled date for the preview based on filters
  const firstPreviewDate = useMemo(() => {
    const dates: Date[] = scheduledExams
      .filter((exam) => {
        const matchesYear = String(exam.year) === selectedYear;
        const type = exam.examType || exam.exam_type; // support both keys
        const matchesType = type ? type === selectedExam : true; // if missing, don't filter out
        const hasDate = Boolean(exam.scheduledDate || exam.examDate);
        return matchesYear && matchesType && hasDate;
      })
      .map((exam) => new Date((exam.scheduledDate || exam.examDate) as string))
      .filter((d) => !isNaN(d.getTime()));

    if (dates.length === 0) return null;
    dates.sort((a, b) => a.getTime() - b.getTime());
    return dates[0];
  }, [scheduledExams, selectedYear, selectedExam]);

  // Load scheduled exams and departments
  useEffect(() => {
    const loadData = async () => {
      try {
        const [exams, deptData] = await Promise.all([
          examService.getScheduledExams(),
          departmentService.getAllDepartments(),
        ]);

        console.log("Loaded exams:", exams);
        console.log("Loaded departments:", deptData);
        console.log(
          "Sample exam data structure:",
          exams.length > 0 ? exams[0] : "No exams"
        );

        if (exams.length === 0) {
          console.log("Warning: No exams returned from getScheduledExams()");
        }

        // Log any exams without required fields
        exams.forEach((exam) => {
          if (
            !exam.subjectName ||
            !exam.subjectCode ||
            !exam.department ||
            !exam.examDate
          ) {
            console.log("Warning: Exam missing required fields:", exam);
          }
        });

        setScheduledExams(exams);

        // Convert department data to the format expected by PDF
        const formattedDepts = deptData.map((dept) => ({
          code: dept.code,
          name: dept.name,
        }));
        setDepartments(
          formattedDepts.length > 0 ? formattedDepts : defaultDepartments
        );
      } catch (error) {
        console.error("Error loading data:", error);
        // Use default departments if API fails
        setDepartments(defaultDepartments);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: "landscape" });
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      let y = 12;

      // Helper to load image from public as base64
      const loadImageAsBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "Anonymous";
          img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = reject;
          img.src = url;
        });
      };

      // Add logo (left) from public folder
      try {
        const logoBase64 = await loadImageAsBase64("/cit_logo.jpg");
        pdf.addImage(logoBase64, "JPEG", 12, 8, 28, 28);
      } catch (e) {}

      // Header (no border)
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("CHENNAI", 45, y + 2);
      pdf.text("INSTITUTE OF TECHNOLOGY", 45, y + 10);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        "(Autonomous Institution, Affiliated to Anna University, Chennai)",
        45,
        y + 16
      );
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "OFFICE OF THE CONTROLLER OF EXAMINATIONS",
        pageWidth / 2,
        y + 28,
        { align: "center" }
      );

      // Reference and date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      // Use dynamic reference code and exam name if available, and get year/exam type from dropdowns
      const refCode = selectedAlert?.referenceCode || "CIT/COE /2025-26/ODD/04";
      // Get exam name from dropdown selection
      let examName = "Internal Assessment";
      if (selectedExam === "IA1") examName = "Internal Assessment-I";
      else if (selectedExam === "IA2") examName = "Internal Assessment-II";
      else if (selectedExam === "IA3") examName = "Internal Assessment-III";
      // Get year text from dropdown selection
      let yearText = "II year";
      if (selectedYear === "3") yearText = "III year";
      else if (selectedYear === "4") yearText = "IV year";
      pdf.text(`REF: ${refCode}`, 12, y + 38);
      // Use today's date for the circular
      const today = new Date();
      const dateStr = today.toLocaleDateString("en-GB");
      pdf.text(`DATE: ${dateStr}`, pageWidth - 12, y + 38, { align: "right" });

      // Circular title
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("CIRCULAR", pageWidth / 2, y + 48, { align: "center" });

      // Circular content (dynamic start date, exam name, year)
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      // Find the earliest exam date for the selected year and exam type (supporting multiple key names)
      let minExamDate: Date | null = null;
      scheduledExams
        .filter((exam) => {
          const matchesYear = String(exam.year) === selectedYear;
          const type = exam.examType || exam.exam_type; // support both keys
          const matchesType = type ? type === selectedExam : true; // if type missing, don't exclude
          const hasDate = Boolean(exam.scheduledDate || exam.examDate);
          return matchesYear && matchesType && hasDate;
        })
        .forEach((exam) => {
          const raw = (exam.scheduledDate || exam.examDate) as string;
          const d = new Date(raw);
          if (!isNaN(d.getTime())) {
            if (!minExamDate || d.getTime() < (minExamDate as Date).getTime()) {
              minExamDate = d;
            }
          }
        });
      let startDateStr =
        minExamDate && !isNaN((minExamDate as Date).getTime())
          ? (minExamDate as Date).toLocaleDateString("en-GB")
          : "____";
      const circularText = `The ${examName} Exam for ${yearText} students starts from ${startDateStr} onwards. All the students are hereby informed to take the exams seriously. The marks secured in these tests will be considered for awarding the internal marks. The schedule for the exams is as follows.`;
      const lines = pdf.splitTextToSize(circularText, pageWidth - 40);
      pdf.text(lines, 12, y + 56);

      // Dynamic Table
      const tableY = y + 65;
      const tableX = 12;
      const tableWidth = pageWidth - 24;
      // Dynamic department codes for headers (sorted by code)
      const deptHeaders = departments.map((d) => d.code);
      // Use department names for table headers
      const colHeaders = ["DATE", ...departments.map((d) => d.name)];
      // Calculate column widths (date column + equal width for each department)
      const dateColWidth = 28;
      const deptColWidth = (tableWidth - dateColWidth) / deptHeaders.length;
      const colWidths = [
        dateColWidth,
        ...Array(deptHeaders.length).fill(deptColWidth),
      ];
      let colX = tableX;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setFillColor(220, 220, 220);
      // Header row
      for (let i = 0; i < colHeaders.length; i++) {
        pdf.setDrawColor(0, 0, 0);
        pdf.setFillColor(220, 220, 220);
        pdf.rect(colX, tableY, colWidths[i], 10, "F");
        pdf.setTextColor(0, 0, 0);
        pdf.text(colHeaders[i], colX + 2, tableY + 7, {
          maxWidth: colWidths[i] - 4,
        });
        colX += colWidths[i];
      }

      // Build schedule data: group by date, then by department
      const scheduleMap = new Map();
      scheduledExams.forEach((exam) => {
        if (!exam.scheduledDate || !exam.department) return;
        const date = new Date(exam.scheduledDate).toLocaleDateString("en-GB");
        if (!scheduleMap.has(date)) scheduleMap.set(date, {});
        scheduleMap.get(date)[exam.department] = exam;
      });
      // Always show all department columns, even if no data for that department
      const sortedDates = Array.from(scheduleMap.keys()).sort((a, b) => {
        // dd/mm/yyyy to yyyy-mm-dd for sort
        const [da, ma, ya] = a.split("/").map(Number);
        const [db, mb, yb] = b.split("/").map(Number);
        return (
          new Date(ya, ma - 1, da).getTime() -
          new Date(yb, mb - 1, db).getTime()
        );
      });

      // Table rows
      let rowY = tableY + 10;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      // Find all common subject names for each date (appearing in more than one department)
      const commonSubjectsByDate: Record<string, Set<string>> = {};
      for (const date of sortedDates) {
        const examsForDate = Object.values(
          scheduleMap.get(date) || {}
        ) as any[];
        const nameCount: Record<string, number> = {};
        examsForDate.forEach((exam: any) => {
          if (!exam || !exam.subjectName) return;
          nameCount[exam.subjectName] = (nameCount[exam.subjectName] || 0) + 1;
        });
        commonSubjectsByDate[date] = new Set(
          Object.entries(nameCount)
            .filter(([_, count]) => (count as number) > 1)
            .map(([name]) => name)
        );
      }
      for (const date of sortedDates) {
        colX = tableX;
        pdf.rect(colX, rowY, colWidths[0], 10);
        pdf.text(date, colX + 2, rowY + 7);
        colX += colWidths[0];
        for (let d = 0; d < deptHeaders.length; d++) {
          const dept = deptHeaders[d];
          pdf.rect(colX, rowY, colWidths[d + 1], 10);
          const exam = scheduleMap.get(date)[dept];
          if (exam) {
            const code = exam.subjectCode || "-";
            const name = exam.subjectName || "-";
            // If this subject name is common for this date, make it bold
            if (commonSubjectsByDate[date].has(name)) {
              pdf.setFont("helvetica", "bold");
              pdf.text(code, colX + 2, rowY + 4);
              pdf.text(name, colX + 2, rowY + 8);
              pdf.setFont("helvetica", "normal");
            } else {
              pdf.text(code, colX + 2, rowY + 4);
              pdf.text(name, colX + 2, rowY + 8);
            }
          } else {
            pdf.text("-", colX + 2, rowY + 7);
          }
          colX += colWidths[d + 1];
        }
        rowY += 10;
      }

      // Notes
      const notesY = rowY + 6;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("Note:", tableX, notesY);
      pdf.text("1. Exam Duration: 08.00 AM to 09.30 AM.", tableX, notesY + 6);
      pdf.text(
        "2. Students should be available inside the respective exam halls at 07.45 AM.",
        tableX,
        notesY + 12
      );
      pdf.text(
        "3. Seating arrangement will be displayed in the notice board just before the day of first Exam.",
        tableX,
        notesY + 18
      );

      // Copy To
      const copyY = notesY + 25;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("Copy To:", tableX, copyY);
      // Single-line copy list with dotted separators
      pdf.setFontSize(8);
      const copyLine =
        "1. The head of the department  2. To be read in all classes  3. Main notice board. 4. File copy. ";
      pdf.text(copyLine, tableX + 22, copyY);

      // Signature block (only 'PRINCIPAL')
      const sigY = copyY + 5;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("PRINCIPAL", pageWidth - 40, sigY);

      // Save the PDF
      pdf.save("CIT_Exam_Circular.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Generate Examination Timetable PDF
        </h3>
        <p className="text-gray-600 mb-6">
          Create official CIT examination circular with complete schedule.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            PDF Preview
          </h4>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading scheduled exams...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="2">II Year</option>
                    <option value="3">III Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Examination Type
                  </label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {selectedYear === "2" && (
                      <>
                        <option value="IA1">IA1 - Internal Assessment I</option>
                        <option value="IA2">
                          IA2 - Internal Assessment II
                        </option>
                        <option value="IA3">
                          IA3 - Internal Assessment III
                        </option>
                      </>
                    )}
                    {selectedYear === "3" && (
                      <>
                        <option value="IA1">IA1 - Internal Assessment I</option>
                        <option value="IA2">
                          IA2 - Internal Assessment II
                        </option>
                        <option value="IA3">
                          IA3 - Internal Assessment III
                        </option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Dynamic Scheduled Exams Table Preview */}
              {scheduledExams.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start mb-1">
                    <Calendar className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <h5 className="text-sm font-medium text-green-800">
                      Scheduled Exams Table Preview
                    </h5>
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Start date:{" "}
                    {firstPreviewDate
                      ? firstPreviewDate.toLocaleDateString("en-GB")
                      : "-"}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-green-200 rounded-lg">
                      <thead>
                        <tr className="bg-green-100">
                          <th className="px-2 py-2 border">Date</th>
                          {departments.map((dept) => (
                            <th key={dept.code} className="px-2 py-2 border">
                              {dept.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Build schedule data: group by date, then by department, just like PDF */}
                        {(() => {
                          // Build scheduleMap: { date: { deptCode: exam } }
                          const scheduleMap = new Map();
                          scheduledExams.forEach((exam) => {
                            if (!exam.scheduledDate || !exam.department) return;
                            const date = new Date(
                              exam.scheduledDate
                            ).toLocaleDateString("en-GB");
                            if (!scheduleMap.has(date))
                              scheduleMap.set(date, {});
                            scheduleMap.get(date)[exam.department] = exam;
                          });
                          const sortedDates = Array.from(
                            scheduleMap.keys()
                          ).sort((a, b) => {
                            // dd/mm/yyyy to yyyy-mm-dd for sort
                            const [da, ma, ya] = a.split("/").map(Number);
                            const [db, mb, yb] = b.split("/").map(Number);
                            return (
                              new Date(ya, ma - 1, da).getTime() -
                              new Date(yb, mb - 1, db).getTime()
                            );
                          });
                          return sortedDates.map((date) => (
                            <tr key={date} className="bg-white">
                              <td className="px-2 py-2 border font-semibold">
                                {date}
                              </td>
                              {departments.map((dept) => {
                                const exam = scheduleMap.get(date)[dept.code];
                                return (
                                  <td
                                    key={dept.code}
                                    className="px-2 py-2 border"
                                  >
                                    {exam ? (
                                      <div>
                                        <span className="font-medium text-gray-900">
                                          {exam.subjectCode}
                                        </span>
                                        <br />
                                        <span className="text-gray-700">
                                          {exam.subjectName}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {scheduledExams.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-yellow-800">
                        No Scheduled Exams
                      </h5>
                      <p className="text-sm text-yellow-700 mt-1">
                        No exams have been scheduled yet. Teachers can schedule
                        exams from their dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={generatePDF}
                  disabled={generating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
