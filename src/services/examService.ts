import { supabase } from "../lib/supabase";
import { Exam, ExamAlert } from "../types";

export const examService = {
  // Join staff_details and subject_detail by department
  async getStaffSubjectsByDepartment(): Promise<any[]> {
    const { data: staffData, error: staffError } = await supabase
      .from("staff_details")
      .select("*");
    if (staffError) {
      throw new Error(staffError.message);
    }

    const { data: subjectData, error: subjectError } = await supabase
      .from("subject_detail")
      .select("*");
    if (subjectError) {
      throw new Error(subjectError.message);
    }

    // Join in TypeScript by department
    const joined = [];
    for (const staff of staffData) {
      for (const subject of subjectData) {
        if (staff.department === subject.department) {
          joined.push({
            staff_id: staff.id,
            staff_name: staff.name,
            staff_department: staff.department,
            subject_id: subject.id,
            subject_name: subject.name,
            subject_department: subject.department,
          });
        }
      }
    }
    return joined;
  },
  // Test function to verify exam_schedules table access
  async testExamSchedulesAccess(): Promise<void> {
    try {
      console.log("Testing exam_schedules table access...");
      // Sample query to test access
      const { data, error } = await supabase
        .from("exam_schedules")
        .select("*")
        .limit(5);
      if (error) {
        console.error("Error accessing exam_schedules table:", error);
        throw new Error(error.message);
      }
      console.log("Successfully accessed exam_schedules table!");
      console.log("Sample data:", data);
      console.log("Total records found:", data?.length || 0);
      return;
    } catch (error) {
      console.error("Failed to access exam_schedules table:", error);
      throw error;
    }
  },

  // Get all subjects (mapped to Exam interface)
  async getExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("subject_detail")
      .select(
        `
        *,
        exam_schedules(*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Fetch all exam periods from exam_settings
    const { data: examSettings } = await supabase
      .from("exam_settings")
      .select("exam_start_date, exam_end_date, year")
      .order("created_at", { ascending: false });

    // Create a map of year to exam dates
    const examDatesByYear = (examSettings || []).reduce((map, setting) => {
      if (setting.year && setting.exam_start_date && setting.exam_end_date) {
        map[setting.year] = {
          startDate: setting.exam_start_date,
          endDate: setting.exam_end_date
        };
      }
      return map;
    }, {} as Record<number, { startDate: string, endDate: string }>);

    return data.map((subject) => ({
      id: subject.id,
      subjectCode: subject.subcode,
      subjectName: subject.name,
      courseId: subject.subcode, // Using subcode as courseId
      department: subject.department,
      year: subject.year,
      // Prefer 'sem' if present, else 'semester' field, else undefined
      semester: subject.sem ?? subject.semester ?? undefined,
      teacherId: "", // Will be set from exam_schedules
      teacherName: "", // Will be set from exam_schedules
      scheduledDate: subject.exam_schedules?.[0]?.exam_date || null,
      startDate: examDatesByYear[subject.year]?.startDate || "",
      endDate: examDatesByYear[subject.year]?.endDate || "",
      status: subject.exam_schedules?.[0]?.exam_date ? "scheduled" : "pending",
    }));
  },

  // Get subjects by teacher (staff member)
  async getExamsByTeacher(teacherId: string): Promise<Exam[]> {
    // For now, return all subjects since we don't have teacher assignments yet
    const { data, error } = await supabase
      .from("subject_detail")
      .select(
        `
        *,
        exam_schedules(*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Fetch exam period from exam_settings
    const { data: examSettings } = await supabase
      .from("exam_settings")
      .select("exam_start_date, exam_end_date")
      .order("created_at", { ascending: false })
      .limit(1);

    const startDate = examSettings?.[0]?.exam_start_date || "";
    const endDate = examSettings?.[0]?.exam_end_date || "";

    return data.map((subject) => ({
      id: subject.id,
      subjectCode: subject.subcode,
      subjectName: subject.name,
      courseId: subject.subcode,
      department: subject.department,
      year: subject.year,
      semester: subject.sem ?? subject.semester ?? undefined,
      teacherId: teacherId,
      teacherName: "", // Will need to fetch from staff_details
      scheduledDate: subject.exam_schedules?.[0]?.exam_date || null,
      startDate,
      endDate,
      status: subject.exam_schedules?.[0]?.exam_date ? "scheduled" : "pending",
    }));
  },

  // Schedule an exam with conflict checking and shared subject logic
  async scheduleExam(
    subjectId: string,
    examDate: string,
    assignedBy: string,
    selectedExamType: "IA1" | "IA2" | "IA3"
  ): Promise<void> {
    // First, get the subject details to know which year it belongs to
    let subjectYear: number;
    if (subjectId.startsWith("staff-subject-")) {
      const staffId = subjectId.replace("staff-subject-", "");
      const { data: staffData } = await supabase
        .from("staff_details")
        .select("subject_code")
        .eq("id", staffId)
        .single();

      const { data: subjectYearData } = await supabase
        .from("subject_detail")
        .select("year")
        .eq("subcode", staffData?.subject_code)
        .single();

      subjectYear = subjectYearData?.year;
    } else {
      const { data: subjectData } = await supabase
        .from("subject_detail")
        .select("year")
        .eq("id", subjectId)
        .single();

      subjectYear = subjectData?.year;
    }

    // Get exam settings for this specific year
    const { data: examSettings, error: settingsError } = await supabase
      .from("exam_settings")
      .select("*")
      .eq("year", subjectYear)
      .order("created_at", { ascending: false })
      .limit(1);

    if (settingsError) {
      throw new Error(`Failed to fetch exam settings: ${settingsError.message}`);
    }

    if (!examSettings || examSettings.length === 0) {
      throw new Error(`No exam settings found for year ${subjectYear}`);
    }

    // Check if the selected date falls within the year-specific exam period
    const examPeriod = examSettings[0];
    const selectedDate = new Date(examDate);
    const periodStart = new Date(examPeriod.exam_start_date);
    const periodEnd = new Date(examPeriod.exam_end_date);

    if (selectedDate < periodStart || selectedDate > periodEnd) {
      throw new Error(
        `Selected date must be between ${examPeriod.exam_start_date} and ${examPeriod.exam_end_date} for Year ${subjectYear}`
      );
    }
    // Get the current department's ID based on the staff member or subject
    let currentDepartmentId: string;
    // Removed unused subjectName variable
    if (subjectId.startsWith("staff-subject-")) {
      // Get department and subject_name from staff details
      const staffId = subjectId.replace("staff-subject-", "");
      const { data: staffData, error: staffError } = await supabase
        .from("staff_details")
        .select("department, subject_name")
        .eq("id", staffId)
        .single();

      if (staffError || !staffData) {
        throw new Error(`Staff member not found with ID: ${staffId}`);
      }

      const { data: deptData } = await supabase
        .from("departments")
        .select("id")
        .eq("name", staffData.department.trim())
        .single();
      currentDepartmentId = deptData?.id;
      // subjectName not used
    } else {
      // Get department from subject details
      const { data: subject, error: subjectError } = await supabase
        .from("subject_detail")
        .select("department, name")
        .eq("id", subjectId)
        .single();

      if (subjectError || !subject) {
        throw new Error(`Subject not found with ID: ${subjectId}`);
      }

      const { data: deptData } = await supabase
        .from("departments")
        .select("id")
        .eq("name", subject.department.trim())
        .single();
      currentDepartmentId = deptData?.id;
      // subjectName not used
    }

    // Get current department name first
    let currentDeptName: string;
    if (subjectId.startsWith("staff-subject-")) {
      const staffId = subjectId.replace("staff-subject-", "");
      const { data: staffData } = await supabase
        .from("staff_details")
        .select("department")
        .eq("id", staffId)
        .single();
      currentDeptName = staffData?.department;
    } else {
      const { data: subjectData } = await supabase
        .from("subject_detail")
        .select("department")
        .eq("id", subjectId)
        .single();
      currentDeptName = subjectData?.department;
    }

    // Check for same-day conflicts within the same department BEFORE any insert/update
    const { data: sameDayExams, error: sameDayError } = await supabase
      .from("exam_schedules")
      .select(
        `
        *,
        subject_detail(*),
        departments!exam_schedules_department_id_fkey(*)
      `
      )
      .eq("exam_date", examDate);

    if (sameDayError) {
      throw new Error(sameDayError.message);
    }

    // Get current subject's year
    let currentYear: number;
    if (subjectId.startsWith("staff-subject-")) {
      const staffId = subjectId.replace("staff-subject-", "");
      const { data: staffSubject } = await supabase
        .from("subject_detail")
        .select("year")
        .eq("subcode", staffData?.subject_code)
        .single();
      currentYear = staffSubject?.year || 0;
    } else {
      const { data: subjectData } = await supabase
        .from("subject_detail")
        .select("year")
        .eq("id", subjectId)
        .single();
      currentYear = subjectData?.year || 0;
    }

    // Filter exams by department name and year to ensure correct comparison
    const sameDeptAndYearExams =
      sameDayExams?.filter(
        (exam) =>
          exam.departments?.name === currentDeptName &&
          exam.subject_detail?.year === currentYear
      ) || [];

    // Debug: log all exams found for this department, year and date
    console.log("Exam conflict check BEFORE insert:", {
      examDate,
      currentDeptName,
      currentYear,
      sameDeptAndYearExams,
      allSameDayExams: sameDayExams,
    });

    if (sameDeptAndYearExams.length > 0) {
      throw new Error(
        `${currentDeptName} department already has an exam scheduled for year ${currentYear} on ${examDate}. Cannot schedule multiple exams for the same department and year on the same day.`
      );
    }

    // Check for time conflicts only within the same department and year
    const { data: timeConflicts, error: conflictError } = await supabase
      .from("exam_schedules")
      .select(
        `
        *,
        subject_detail(*),
        departments!exam_schedules_department_id_fkey(*)
      `
      )
      .eq("exam_date", examDate)
      .eq("department_id", currentDepartmentId);

    if (conflictError) {
      throw new Error(conflictError.message);
    }

    // Filter conflicts to only include same year
    const sameYearConflicts =
      timeConflicts?.filter(
        (conflict) => conflict.subject_detail?.year === currentYear
      ) || [];

    if (sameYearConflicts.length > 0) {
      throw new Error(
        `Conflict detected: Department already has an exam scheduled for year ${currentYear} on ${examDate}`
      );
    }

    // Check if this is a staff-subject ID (from staff_details table)
    if (subjectId.startsWith("staff-subject-")) {
      // Extract the staff ID from the subject ID
      const staffId = subjectId.replace("staff-subject-", "");

      // Get the staff member's subject details
      const { data: staffData, error: staffError } = await supabase
        .from("staff_details")
        .select("*")
        .eq("id", staffId)
        .single();

      if (staffError || !staffData) {
        throw new Error(`Staff member not found with ID: ${staffId}`);
      }

      if (!staffData.subject_name || !staffData.subject_code) {
        throw new Error(
          `Staff member ${staffData.name} has no assigned subject`
        );
      }

      // Check for shared subject conflicts BEFORE creating/finding the subject
      const { data: existingSchedules, error: scheduleCheckError } =
        await supabase.from("exam_schedules").select(`
          *,
          subject_detail(*),
          departments!exam_schedules_department_id_fkey(*)
        `);

      if (scheduleCheckError) {
        throw new Error(scheduleCheckError.message);
      }

      // Check if the same subject name is already scheduled
      const sameSubjectSchedules =
        existingSchedules?.filter(
          (schedule) => schedule.subject_detail?.name === staffData.subject_name
        ) || [];

      if (sameSubjectSchedules.length > 0) {
        // If the subject is already scheduled, force it to be on the same date
        const existingSchedule = sameSubjectSchedules[0];
        if (examDate !== existingSchedule.exam_date) {
          const scheduledDept =
            existingSchedule.departments?.name || "Unknown Department";
          throw new Error(
            `Subject "${staffData.subject_name}" must be scheduled on ${existingSchedule.exam_date} ` +
              `as it is already scheduled by ${scheduledDept} department. ` +
              `All departments teaching "${staffData.subject_name}" must have the exam on the same date.`
          );
        }
      }

      // First, create or find a subject record in subject_detail table
      let actualSubjectId = subjectId;

      // Check if subject already exists in subject_detail by subcode (which has unique constraint)
      const { data: existingSubject, error: findError } = await supabase
        .from("subject_detail")
        .select("*")
        .eq("subcode", staffData.subject_code)
        .maybeSingle();

      if (findError) {
        console.error("Error finding existing subject:", findError);
      }

      if (existingSubject) {
        // Use existing subject ID
        actualSubjectId = existingSubject.id;
        console.log("Using existing subject:", existingSubject);
      } else {
        // Create new subject record
        const { data: newSubject, error: createError } = await supabase
          .from("subject_detail")
          .insert([
            {
              name: staffData.subject_name,
              subcode: staffData.subject_code,
              department: staffData.department,
              year: 1, // Default year
              is_shared: true, // Mark as shared subject
              shared_subject_code: staffData.subject_code,
            },
          ])
          .select()
          .single();

        if (createError) {
          throw new Error(
            `Failed to create subject record: ${createError.message}`
          );
        }

        actualSubjectId = newSubject.id;
        console.log("Created new shared subject:", newSubject);
      }

      // Get department ID for the staff member's department
      // Trim any whitespace from the department name to handle trailing spaces
      const trimmedDepartment = staffData.department.trim();

      const { data: departmentData, error: deptError } = await supabase
        .from("departments")
        .select("id")
        .eq("name", trimmedDepartment)
        .single();

      if (deptError || !departmentData) {
        throw new Error(`Department not found: ${trimmedDepartment}`);
      }

      // Find other departments teaching the same subject
      const { data: otherDeptSubjects, error: otherDeptError } = await supabase
        .from("subject_detail")
        .select("*")
        .eq("name", staffData.subject_name)
        .neq("department", staffData.department);

      // Get department IDs for the other departments
      const departmentIds: { [dept: string]: string } = {};
      if (otherDeptSubjects) {
        const deptNames = otherDeptSubjects.map((s) => s.department.trim());
        const { data: deptData } = await supabase
          .from("departments")
          .select("id, name")
          .in("name", deptNames);

        if (deptData) {
          deptData.forEach((d) => {
            departmentIds[d.name] = d.id;
          });
        }
      }

      if (otherDeptError) {
        throw new Error(otherDeptError.message);
      }

      // Prepare exam schedules for all departments
      const schedulesToCreate = [
        {
          subject_id: actualSubjectId,
          exam_date: examDate,
          department_id: departmentData.id,
          assigned_by: assignedBy, // always use logged-in user's id
          priority_department: null,
          exam_type: selectedExamType,
        },
      ];

      // Add schedules for other departments
      if (otherDeptSubjects) {
        otherDeptSubjects.forEach((subject) => {
          const deptId = departmentIds[subject.department.trim()];
          if (deptId) {
            schedulesToCreate.push({
              subject_id: subject.id,
              exam_date: examDate,
              department_id: deptId,
              assigned_by: assignedBy, // always use logged-in user's id
              priority_department: departmentData.id, // Mark original department as priority
              exam_type: selectedExamType,
            });
          }
        });
      }

      // Debug: print assigned_by and all auth.users IDs before insert/update
      const { data: users, error: usersError } = await supabase
        .from("auth.users")
        .select("id");
      if (usersError) {
        console.error("Error fetching auth.users:", usersError);
      } else {
        console.log(
          "auth.users IDs:",
          users.map((u) => u.id)
        );
      }
      schedulesToCreate.forEach((sch) => {
        console.log("assigned_by value for insert:", sch.assigned_by);
      });

      // Check for existing schedules and update them if they exist
      for (const schedule of schedulesToCreate) {
        // Check for any existing schedule for this subject and department (regardless of date)
        const { data: existingSchedule } = await supabase
          .from("exam_schedules")
          .select("*")
          .eq("subject_id", schedule.subject_id)
          .eq("department_id", schedule.department_id)
          .maybeSingle();

        if (existingSchedule) {
          // Block if schedule for this department and subject already exists (regardless of date)
          throw new Error(
            `This subject is already scheduled for this department on ${existingSchedule.exam_date}. Each subject can only be scheduled once per department.`
          );
        } else {
          // Create new schedule
          const { error: insertError } = await supabase
            .from("exam_schedules")
            .insert([schedule]);

          if (insertError) {
            // Check for specific constraint violation
            if (
              insertError.message.includes(
                "duplicate key value violates unique constraint"
              ) &&
              insertError.message.includes(
                "exam_schedules_subject_id_department_id_key"
              )
            ) {
              throw new Error(
                `This subject is already scheduled for this department. Each subject can only be scheduled once per department.`
              );
            }
            throw new Error(
              `Failed to create exam schedule: ${insertError.message}`
            );
          }
        }
      }

      // Notify other departments about the shared subject scheduling
      await this.notifySharedSubjectScheduling(staffData.subject_name, [
        {
          name: staffData.name,
          email: staffData.email,
          department: staffData.department,
        },
      ]);
    } else {
      // Handle regular subject_detail table subjects (existing logic)
      const { data: subjects, error: subjectError } = await supabase
        .from("subject_detail")
        .select("*")
        .eq("id", subjectId);

      if (subjectError) {
        throw new Error(subjectError.message);
      }

      if (!subjects || subjects.length === 0) {
        throw new Error(`Subject not found with ID: ${subjectId}`);
      }

      const subject = subjects[0];

      // Check for shared subject conflicts for regular subjects
      const { data: existingSchedules, error: scheduleCheckError } =
        await supabase.from("exam_schedules").select(`
          *,
          subject_detail(*),
          departments!exam_schedules_department_id_fkey(*)
        `);

      if (scheduleCheckError) {
        throw new Error(scheduleCheckError.message);
      }

      // Check if the same subject name is already scheduled
      const sameSubjectSchedules =
        existingSchedules?.filter(
          (schedule) => schedule.subject_detail?.name === subject.name
        ) || [];

      if (sameSubjectSchedules.length > 0) {
        // If the subject is already scheduled, force it to be on the same date
        const existingSchedule = sameSubjectSchedules[0];
        if (examDate !== existingSchedule.exam_date) {
          const scheduledDept =
            existingSchedule.departments?.name || "Unknown Department";
          throw new Error(
            `Subject "${subject.name}" must be scheduled on ${existingSchedule.exam_date} ` +
              `as it is already scheduled by ${scheduledDept} department. ` +
              `All departments teaching "${subject.name}" must have the exam on the same date.`
          );
        }
      }

      // Find other departments teaching the same subject
      const { data: otherDeptSubjects, error: otherDeptError } = await supabase
        .from("subject_detail")
        .select("*")
        .eq("name", subject.name)
        .eq("year", subject.year)
        .neq("department", subject.department);

      if (otherDeptError) {
        throw new Error(otherDeptError.message);
      }

      // Get department IDs for the other departments
      const departmentIds: { [dept: string]: string } = {};
      if (otherDeptSubjects && otherDeptSubjects.length > 0) {
        const deptNames = otherDeptSubjects.map((s) => s.department.trim());
        const { data: deptData } = await supabase
          .from("departments")
          .select("id, name")
          .in("name", deptNames);

        if (deptData) {
          deptData.forEach((d) => {
            departmentIds[d.name] = d.id;
          });
        }
      }

      // Prepare exam schedules for all departments teaching this subject
      const schedulesToCreate = [
        {
          subject_id: subjectId,
          exam_date: examDate,
          department_id: currentDepartmentId,
          assigned_by: assignedBy,
          priority_department: null,
          exam_type: selectedExamType,
        },
      ];

      // Add schedules for other departments teaching the same subject
      if (otherDeptSubjects && otherDeptSubjects.length > 0) {
        otherDeptSubjects.forEach((subject) => {
          const deptId = departmentIds[subject.department.trim()];
          if (deptId) {
            schedulesToCreate.push({
              subject_id: subject.id,
              exam_date: examDate,
              department_id: deptId,
              assigned_by: assignedBy,
              priority_department: null, // Mark original department as priority
              exam_type: selectedExamType,
            });
          }
        });
      }

      // Check for existing schedules and create them
      for (const schedule of schedulesToCreate) {
        const { data: existingSchedule } = await supabase
          .from("exam_schedules")
          .select("*")
          .eq("subject_id", schedule.subject_id)
          .eq("department_id", schedule.department_id)
          .maybeSingle();

        if (existingSchedule) {
          // Block if schedule for this department and subject already exists (regardless of date)
          throw new Error(
            `This subject is already scheduled for this department on ${existingSchedule.exam_date}. Each subject can only be scheduled once per department.`
          );
        } else {
          // Create new schedule
          const { error: insertError } = await supabase
            .from("exam_schedules")
            .insert([schedule]);

          if (insertError) {
            // Check for specific constraint violation
            if (
              insertError.message.includes(
                "duplicate key value violates unique constraint"
              ) &&
              insertError.message.includes(
                "exam_schedules_subject_id_department_id_key"
              )
            ) {
              throw new Error(
                `This subject is already scheduled for this department. Each subject can only be scheduled once per department.`
              );
            }
            throw new Error(
              `Failed to create exam schedule: ${insertError.message}`
            );
          }
        }
      }

      // Notify other departments about the shared subject scheduling
      if (otherDeptSubjects && otherDeptSubjects.length > 0) {
        await this.notifySharedSubjectScheduling(subject.name, [
          {
            name: subject.teacherName || "Unknown",
            email: "",
            department: subject.department,
          },
        ]);
      }
    }
  },

  // Get scheduled exams for admin dashboard
  async getScheduledExams(year?: number): Promise<any[]> {
    let query = supabase.from("exam_schedules").select(
      `
        *,
        subject_detail(*),
        departments!exam_schedules_department_id_fkey(*)
      `
    );

    // Filter by year if provided
    if (year !== undefined) {
      query = query.eq("subject_detail.year", year);
    }

    const { data, error } = await query.order("exam_date", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data.map((schedule) => ({
      id: schedule.id,
      subjectId: schedule.subject_id,
      subjectName: schedule.subject_detail?.name || "Unknown Subject",
      subjectCode: schedule.subject_detail?.subcode || "Unknown",
      department: schedule.departments?.name || "Unknown",
      scheduledDate: schedule.exam_date,
      examDate: schedule.exam_date,
      examType: schedule.exam_type,
      status: "scheduled",
      year: schedule.subject_detail?.year || 2,
      // Prefer 'sem' if present, else 'semester' field, else undefined
      semester:
        schedule.subject_detail?.sem ??
        schedule.subject_detail?.semester ??
        undefined,
      courseId: schedule.subject_detail?.subcode || "Unknown",
      teacherId: schedule.assigned_by,
      teacherName: "Unknown",
      startDate: "2025-02-04",
      endDate: "2025-02-15",
      assignedBy: schedule.assigned_by,
      priorityDepartment: schedule.priority_department,
    }));
  },

  // Get available dates (excluding weekends and holidays)
  async getAvailableDates(
    startDate: string,
    endDate: string
  ): Promise<string[]> {
    const availableDates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dayOfWeek = date.getDay();
      // Exclude weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        availableDates.push(date.toISOString().split("T")[0]);
      }
    }

    return availableDates;
  },

  // Create subject (mapped to Exam interface)
  async createExam(examData: Omit<Exam, "id">): Promise<Exam> {
    const { data, error } = await supabase
      .from("subject_detail")
      .insert([
        {
          subcode: examData.subjectCode,
          name: examData.subjectName,
          department: examData.department,
          year: examData.year,
          is_shared: false,
          shared_subject_code: null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      subjectCode: data.subcode,
      subjectName: data.name,
      courseId: data.subcode,
      department: data.department,
      year: data.year,
      semester: (data as any).sem ?? (data as any).semester ?? undefined,
      teacherId: examData.teacherId,
      teacherName: examData.teacherName,
      scheduledDate: examData.scheduledDate,
      startDate: examData.startDate,
      endDate: examData.endDate,
      status: examData.status,
    };
  },

  // Update exam schedule
  async updateExamSchedule(scheduleId: string, updates: any): Promise<void> {
    const updateData: any = {};
    if (updates.exam_date) updateData.exam_date = updates.exam_date;
    if (updates.exam_type) updateData.exam_type = updates.exam_type;
    if (updates.room) updateData.room = updates.room;
    if (updates.notes) updateData.notes = updates.notes;

    // Check for conflict: is there another exam scheduled for the new date?
    if (updates.exam_date) {
      // Get current exam's department to check for conflicts within same department
      const { data: currentExam, error: currentError } = await supabase
        .from("exam_schedules")
        .select("exam_date, department_id")
        .eq("id", scheduleId)
        .single();

      if (currentError) {
        throw new Error(currentError.message);
      }

      // Check for conflicts on the new date within the same department
      const { data: conflictExams, error: conflictError } = await supabase
        .from("exam_schedules")
        .select("id, exam_date")
        .eq("exam_date", updates.exam_date)
        .eq("department_id", currentExam.department_id)
        .neq("id", scheduleId);

      if (conflictError) {
        throw new Error(conflictError.message);
      }

      if (conflictExams && conflictExams.length > 0) {
        // Found a conflict in the same department, perform the swap
        const conflictExam = conflictExams[0]; // Take the first conflict if multiple exist

        // Update the conflicting exam to take the current exam's date
        const { error: swapError } = await supabase
          .from("exam_schedules")
          .update({ exam_date: currentExam.exam_date })
          .eq("id", conflictExam.id);

        if (swapError) {
          throw new Error(swapError.message);
        }
      }
    }

    const { error } = await supabase
      .from("exam_schedules")
      .update(updateData)
      .eq("id", scheduleId);
    if (error) {
      throw new Error(error.message);
    }
  },

  // Update subject
  async updateExam(examId: string, updates: Partial<Exam>): Promise<Exam> {
    const updateData: any = {};

    if (updates.subjectCode) updateData.subcode = updates.subjectCode;
    if (updates.subjectName) updateData.name = updates.subjectName;
    if (updates.department) updateData.department = updates.department;
    if (updates.year) updateData.year = updates.year;

    const { data, error } = await supabase
      .from("subject_detail")
      .update(updateData)
      .eq("id", examId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      subjectCode: data.subcode,
      subjectName: data.name,
      courseId: data.subcode,
      department: data.department,
      year: data.year,
      semester: (data as any).sem ?? (data as any).semester ?? undefined,
      teacherId: updates.teacherId || "",
      teacherName: updates.teacherName || "",
      scheduledDate: updates.scheduledDate || undefined,
      startDate: updates.startDate || "2025-02-04",
      endDate: updates.endDate || "2025-02-15",
      status: updates.status || "pending",
    };
  },

  // Delete subject
  async deleteExam(examId: string): Promise<void> {
    const { error } = await supabase
      .from("subject_detail")
      .delete()
      .eq("id", examId);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Get exam settings (mapped to ExamAlert interface)
  async getExamAlerts(): Promise<ExamAlert[]> {
    console.log('Fetching exam alerts...');
    const { data: settings, error: settingsError } = await supabase
      .from("exam_settings")
      .select("*")
      .order("created_at", { ascending: false });

    if (settingsError) {
      console.error('Error fetching exam settings:', settingsError);
      throw new Error(settingsError.message);
    }

    console.log('Raw exam settings data:', settings);

    // Get all departments (for mapping to alerts)
    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select("*");

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      throw new Error(deptError.message);
    }

    const alerts = settings
      .filter(setting => setting?.year && setting.exam_start_date && setting.exam_end_date)
      .map((setting): ExamAlert => ({
        id: setting.id,
        title: `Exam Settings - ${setting.exam_start_date} to ${setting.exam_end_date}`,
        startDate: setting.exam_start_date,
        endDate: setting.exam_end_date,
        year: Number(setting.year),
        semester: setting.semester || 0,
        refId: setting.refid || undefined,
        departments: departments.map(d => d.name),
        status: "active",
        createdAt: setting.created_at,
        examType: setting.exam_type,
        alertDate: setting.alert_date
      }));

    console.log('Processed exam alerts:', alerts);
    return alerts;
  },

  // Update exam setting
  async updateExamAlert(
    alertId: string,
    updates: Partial<ExamAlert>
  ): Promise<ExamAlert> {
    const updateData: any = {};

  if (updates.startDate) updateData.exam_start_date = updates.startDate;
  if (updates.endDate) updateData.exam_end_date = updates.endDate;
  if (updates.refId) updateData.refid = updates.refId;
  if (updates.year) updateData.year = updates.year;
  if (updates.semester) updateData.semester = updates.semester;
  if ((updates as any).examType) updateData.exam_type = (updates as any).examType;
  if ((updates as any).alertDate) updateData.alert_date = (updates as any).alertDate;

    const { data, error } = await supabase
      .from("exam_settings")
      .update(updateData)
      .eq("id", alertId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error(
        "No exam alert found or updated. Please check the alert ID."
      );
    }

    return {
      id: data.id,
      title: `Exam Settings - ${data.exam_start_date} to ${data.exam_end_date}`,
      startDate: data.exam_start_date,
      endDate: data.exam_end_date,
      year: 2,
      semester: 3,
      departments: [],
      status: "active",
      createdAt: data.created_at,
    };
  },

  // Create a new exam alert
  async createExamAlert(alertData: {
    startDate: string;
    endDate: string;
    year: number;
    semester: number;
    refId: string;
    examType: string;
    alertDate?: string;
    departments: string[];
    status: "active" | "closed";
    createdBy: string;
  }): Promise<ExamAlert> {
    const { data, error } = await supabase
      .from("exam_settings")
      .insert([
        {
          exam_start_date: alertData.startDate,
          exam_end_date: alertData.endDate,
          holidays: [],
          created_by: alertData.createdBy,
          refid: alertData.refId,
          year: alertData.year,
          semester: alertData.semester,
          exam_type: alertData.examType,
          alert_date: alertData.alertDate || new Date().toISOString().slice(0, 10),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: `Exam Settings - ${data.exam_start_date} to ${data.exam_end_date}`,
      startDate: data.exam_start_date,
      endDate: data.exam_end_date,
      year: data.year,
      semester: data.semester,
      departments: alertData.departments,
      status: alertData.status,
      createdAt: data.created_at,
    };
  },

  // Notify other departments about shared subject scheduling
  async notifySharedSubjectScheduling(
    subjectName: string,
    otherStaff: { name: string; email: string; department: string }[]
  ): Promise<void> {
    // In a real application, you would send emails/notifications here
    // For now, we'll just log the information
    otherStaff.forEach((staff) => {
      console.log(
        `📧 Notification sent to ${staff.name} (${staff.email}) in ${staff.department} department`
      );
    });
  },
  // Delete exam alert
  async deleteExamAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from("exam_settings")
      .delete()
      .eq("id", alertId);
    if (error) {
      throw new Error(error.message);
    }
  },
};
