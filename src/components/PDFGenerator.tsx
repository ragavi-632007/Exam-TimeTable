import React, { useState, useEffect, useMemo } from "react";
import { Download, Calendar } from "lucide-react";
import jsPDF from "jspdf";

import { examService } from "../services/examService";
import { departmentService } from "../services/departmentService";
import { useExams } from "../context/ExamContext";

// Define departments for PDF generation (fallback if API fails)
const defaultDepartments = [
  { code: "ACT", name: "Actuarial Science" },
  { code: "AIDS", name: "Artificial Intelligence & Data Science" },
  { code: "AIML", name: "Artificial Intelligence & Machine Learning" },
  { code: "BME", name: "Biomedical Engineering" },
  { code: "CE", name: "Civil Engineering" },
  { code: "CSBS", name: "Computer Science & Business Systems" },
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "CYBER", name: "Cyber Security" },
  { code: "ECE", name: "Electronics & Communication Engineering" },
  { code: "EEE", name: "Electrical & Electronics Engineering" },
  { code: "IT", name: "Information Technology" },
  { code: "MCT", name: "Mechatronics" },
  { code: "MECH", name: "Mechanical Engineering" },
  { code: "VLSI", name: "VLSI Design" },
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
  // selectedAlert,
}) => {
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState("IA2");
  const [scheduledExams, setScheduledExams] = useState<any[]>([]);
  const [departments, setDepartments] = useState(defaultDepartments);
  const [loading, setLoading] = useState(true);
  const { alerts } = useExams();

  // Compute dynamic REF from the latest matching alert (by alertDate or createdAt)
  const dynamicRefId = useMemo(() => {
    if (!alerts || alerts.length === 0) return null;
    const yearNum = Number(selectedYear);
    const semNum = selectedSemester ? Number(selectedSemester) : null;
    const typeSel = selectedExam;
    // Prefer alerts matching selected year (and semester if chosen)
    const candidates = alerts
      .filter((a: any) => (isNaN(yearNum) ? true : Number(a.year) === yearNum))
      .filter((a: any) => (semNum == null ? true : Number(a.semester) === semNum))
      .filter((a: any) => {
        const t = a.examType || a.exam_type;
        return t ? t === typeSel : true;
      });
    const byDate = (a: any) => new Date(a.alertDate || a.createdAt || 0).getTime();
    const match = candidates.length
      ? candidates.slice().sort((x, y) => byDate(y) - byDate(x))[0]
      : null; // Do NOT fallback to other years
    return match?.refId || null;
  }, [alerts, selectedYear, selectedSemester, selectedExam]);
  // Find the latest matching alert for dynamic sentence pieces (exam type + year)
  const matchedAlert = useMemo(() => {
    if (!alerts || alerts.length === 0) return null;
    const yearNum = Number(selectedYear);
    const semNum = selectedSemester ? Number(selectedSemester) : null;
    const typeSel = selectedExam;
    const candidates = alerts
      .filter((a: any) => (isNaN(yearNum) ? true : Number(a.year) === yearNum))
      .filter((a: any) => (semNum == null ? true : Number(a.semester) === semNum))
      .filter((a: any) => {
        const t = a.examType || a.exam_type;
        return t ? t === typeSel : true;
      });
    const byDate = (a: any) => new Date(a.alertDate || a.createdAt || 0).getTime();
    return candidates.length ? candidates.slice().sort((x, y) => byDate(y) - byDate(x))[0] : null;
  }, [alerts, selectedYear, selectedSemester, selectedExam]);

  // Sync filters from the matched alert when available to avoid empty previews due to mismatched filters
  useEffect(() => {
    if (!matchedAlert) return;
    const aType = (matchedAlert as any).examType || (matchedAlert as any).exam_type;
    const aYear = (matchedAlert as any).year;
    const aSem = (matchedAlert as any).semester;
    // Apply exam type
    if (aType && aType !== selectedExam) setSelectedExam(aType);
    // Apply year
    if (aYear && String(aYear) !== selectedYear) setSelectedYear(String(aYear));
    // Apply semester if valid for that year
    if (aSem != null) {
      const semStr = String(aSem);
      if (semStr !== selectedSemester) setSelectedSemester(semStr);
    }
  }, [matchedAlert]);

  // Compute dynamic Start Date from alerts (fallback when no scheduled exams yet)
  const dynamicStartDate = useMemo(() => {
    if (!alerts || alerts.length === 0) return null;
    const yearNum = Number(selectedYear);
    const semNum = selectedSemester ? Number(selectedSemester) : null;
    const typeSel = selectedExam;
    const candidates = alerts
      .filter((a: any) => (isNaN(yearNum) ? true : Number(a.year) === yearNum))
      .filter((a: any) => (semNum == null ? true : Number(a.semester) === semNum))
      .filter((a: any) => {
        const t = a.examType || a.exam_type;
        return t ? t === typeSel : true;
      })
      .filter((a: any) => !!(a.startDate || a.exam_start_date));
    const byDate = (a: any) => new Date(a.alertDate || a.createdAt || a.startDate || a.exam_start_date || 0).getTime();
    const latest = candidates.length
      ? candidates.slice().sort((x, y) => byDate(y) - byDate(x))[0]
      : null; // Do NOT fallback to other years
    const raw = (latest?.startDate || (latest as any)?.exam_start_date) as string | undefined;
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-GB");
  }, [alerts, selectedYear, selectedSemester, selectedExam]);

  // Reset semester if it becomes invalid for the selected year
  useEffect(() => {
    const allowed =
      selectedYear === "1"
        ? ["1", "2"]
        : selectedYear === "2"
        ? ["3", "4"]
        : selectedYear === "3"
        ? ["5", "6"]
        : selectedYear === "4"
        ? ["7", "8"]
        : [];
    if (selectedSemester && !allowed.includes(selectedSemester)) {
      setSelectedSemester("");
    }
  }, [selectedYear]);

  // Compute the first (earliest) scheduled date for the preview based on filters
  // Removed unused firstPreviewDate

  // Align preview logic with PDF export logic
  const previewScheduleMap = useMemo(() => {
    const map = new Map();
    scheduledExams.forEach((exam) => {
      const dateRaw = (exam.scheduledDate || exam.examDate) as string | undefined;
      if (!dateRaw || !exam.department) return;
      const examYear = Number(exam.year ?? exam.subject_detail?.year);
      if (String(examYear) !== selectedYear) return;
      if (selectedSemester && String(exam.semester ?? exam.sem ?? "") !== selectedSemester) return;
      // Match selected exam type if available
      const type = exam.examType || exam.exam_type;
      if (type !== selectedExam) return; // require exact match
      const date = new Date(dateRaw).toLocaleDateString("en-GB");
      if (!map.has(date)) map.set(date, {});
      map.get(date)[exam.department] = exam;
    });
    return map;
  }, [scheduledExams, selectedYear, selectedSemester, selectedExam]);
  const previewSortedDates = Array.from(previewScheduleMap.keys()).sort((a, b) => {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
  });

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
  // Removed unused pageHeight
      let y = 12;
      // Helper to load image from public as base64 (not used currently)
      // const loadImageAsBase64 = (url: string): Promise<string> => {
      //   return new Promise((resolve, reject) => {
      //     const img = new window.Image();
      //     img.crossOrigin = "Anonymous";
      //     img.onload = function () {
      //       const canvas = document.createElement("canvas");
      //       canvas.width = img.width;
      //       canvas.height = img.height;
      //       const ctx = canvas.getContext("2d");
      //       ctx?.drawImage(img, 0, 0);
      //       resolve(canvas.toDataURL("image/png"));
      //     };
      //     img.onerror = function () {
      //       reject(new Error("Failed to load image"));
      //     };
      //     img.src = url;
      //   });
      // };

      // --- Accurate PDF Header (matching previous version) ---
      // Add CIT logo (left side) using base64 for synchronous PDF generation
      let logoBase64 = null;
      try {
        // Fetch logo.jpg as base64
        const response = await fetch('/cit_logo.jpg');
        const blob = await response.blob();
        const reader = new window.FileReader();
        logoBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        // If logo fails, skip
      }
      // Header layout: logo (left), college name (right, same line), then details below
      const headerY = y + 1;
      if (logoBase64) {
        // Increase logo size and align with text
        pdf.addImage(typeof logoBase64 === 'string' ? logoBase64 : String(logoBase64), 'JPEG', 18, headerY - 2, 50, 28);
      }
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      // Center align college name
      pdf.text("CHENNAI INSTITUTE OF TECHNOLOGY", pageWidth / 2, headerY + 8, { align: "center" });
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("(Autonomous Institution, Affiliated to Anna University, Chennai)", pageWidth / 2, headerY + 20, { align: "center" });
      pdf.setFontSize(11);
      pdf.text("OFFICE OF THE CONTROLLER OF EXAMINATIONS", pageWidth / 2, headerY + 30, { align: "center" });
      // Reference and Date
      pdf.setFontSize(10);
      const refText = dynamicRefId ? `REF: ${dynamicRefId}` : `REF: CIT/COE /____/____/____`;
      pdf.text(refText, 18, headerY + 40);
      pdf.text(`DATE: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth - 50, headerY + 40);
      // Circular title
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("CIRCULAR", pageWidth / 2, headerY + 45, { align: "center" });
      y = headerY + 50;

      // --- Circular content (dynamic, similar to preview page) ---
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      // Find the earliest exam date for the selected year and exam type
      let minExamDate: Date | null = null;
      scheduledExams
        .filter((exam) => {
          const examYear = Number(exam.year ?? exam.subject_detail?.year);
          const matchesYear = String(examYear) === selectedYear;
          const type = exam.examType || exam.exam_type;
          const matchesType = type === selectedExam; // require exact match
          const hasDate = Boolean(exam.scheduledDate || exam.examDate);
          const matchesSem = selectedSemester ? String(exam.semester ?? exam.sem ?? "") === selectedSemester : true;
          return matchesYear && matchesSem && matchesType && hasDate;
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
          : dynamicStartDate || "____";
      // Use selectedExam and selectedYear for circular text, match preview page wording
      const alertExamType = (matchedAlert?.examType || (matchedAlert as any)?.exam_type) as string | undefined;
      const alertYear = matchedAlert?.year as number | string | undefined;
      const effectiveExamType = alertExamType || selectedExam;
      const effectiveYearStr = String(alertYear ?? selectedYear);
      const examName = effectiveExamType === "IA1" ? "Internal Assessment-I" : effectiveExamType === "IA2" ? "Internal Assessment-II" : effectiveExamType === "IA3" ? "Internal Assessment-III" : effectiveExamType;
      const yearText = effectiveYearStr === "1" ? "I" : effectiveYearStr === "2" ? "II" : effectiveYearStr === "3" ? "III" : effectiveYearStr === "4" ? "IV" : effectiveYearStr;
      const circularText = `The ${examName} Exam for ${yearText} year students starts from ${startDateStr} onwards. All the students are hereby informed to take the exams seriously. The marks secured in these tests will be considered for awarding the internal marks. The schedule for the exams is as follows.`;
      const lines = pdf.splitTextToSize(circularText, pageWidth - 40);
      pdf.text(lines, 12, y + 8);


      // Dynamic Table
      const tableY = y + 20;
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

      // Build schedule data: group by date, then by department (filtered by year and semester)
      const scheduleMap = new Map();
      scheduledExams.forEach((exam) => {
        const dateRaw = (exam.scheduledDate || exam.examDate) as string | undefined;
        if (!dateRaw || !exam.department) return;
        // Filter by selected year
        const examYear = Number(exam.year ?? exam.subject_detail?.year);
        if (String(examYear) !== selectedYear) return;
        if (selectedSemester && String(exam.semester ?? exam.sem ?? "") !== selectedSemester) return;
        // Filter by selected exam type if provided
        const type = exam.examType || exam.exam_type;
        if (type !== selectedExam) return; // require exact match
        const date = new Date(dateRaw).toLocaleDateString("en-GB");
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
  } // <-- Close generatePDF function properly

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
                    <option value="1">I Year</option>
                    <option value="2">II Year</option>
                    <option value="3">III Year</option>
                    <option value="4">IV Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Semesters</option>
                    {selectedYear === "1" && (
                      <>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </>
                    )}
                    {selectedYear === "2" && (
                      <>
                        <option value="3">Semester 3</option>
                        <option value="4">Semester 4</option>
                      </>
                    )}
                    {selectedYear === "3" && (
                      <>
                        <option value="5">Semester 5</option>
                        <option value="6">Semester 6</option>
                      </>
                    )}
                    {selectedYear === "4" && (
                      <>
                        <option value="7">Semester 7</option>
                        <option value="8">Semester 8</option>
                      </>
                    )}
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
                    <option value="IA1">IA1 - Internal Assessment I</option>
                    <option value="IA2">IA2 - Internal Assessment II</option>
                    <option value="IA3">IA3 - Internal Assessment III</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Scheduled Exams Table Preview */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-green-500 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Year {selectedYear} Exam Schedule
                      </h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      {previewSortedDates[0] || dynamicStartDate || ""}
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
                        {departments.map((dept) => (
                          <th
                            key={dept.code}
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border"
                          >
                            {dept.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {previewSortedDates.length === 0 ? (
                        <tr>
                          <td colSpan={departments.length + 1} className="px-4 py-8 text-center text-gray-500">
                            No exams scheduled yet
                          </td>
                        </tr>
                      ) : (
                        previewSortedDates.map((date) => (
                          <tr key={date} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border">
                              {date}
                            </td>
                            {departments.map((dept) => {
                              const exam = previewScheduleMap.get(date)[dept.code];
                              return (
                                <td key={dept.code} className="px-4 py-3 text-sm text-center border">
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
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>
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
}
