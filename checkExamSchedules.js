const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hraenkqpvlcgshodaabr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYWVua3FwdmxjZ3Nob2RhYWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODIxMjcsImV4cCI6MjA2OTk1ODEyN30.ei_0ls_fz7hMakTTY8-VdGt7zTwvBnimqFdHPj0-9zY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExamSchedules() {
  try {
    console.log('🔍 Checking exam_schedules table...\n');

    // Get all exam schedules with related data
    const { data: examSchedules, error } = await supabase
      .from('exam_schedules')
      .select(`
        *,
        subject_detail (
          id,
          name,
          subcode,
          department,
          year
        ),
        departments (
          id,
          name,
          code
        ),
        staff_details!exam_schedules_assigned_by_fkey (
          id,
          name,
          department
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching exam schedules:', error);
      return;
    }

    console.log(`📊 Found ${examSchedules.length} exam schedule(s) in the database:\n`);

    if (examSchedules.length === 0) {
      console.log('📭 No exam schedules found in the database.');
      return;
    }

    // Display each exam schedule
    examSchedules.forEach((schedule, index) => {
      console.log(`📅 Exam Schedule #${index + 1}:`);
      console.log(`   ID: ${schedule.id}`);
      console.log(`   Exam Date: ${schedule.exam_date}`);
      console.log(`   Exam Type: ${schedule.exam_type || 'Not specified'}`);
      console.log(`   Created: ${schedule.created_at}`);
      console.log(`   Updated: ${schedule.updated_at}`);
      
      if (schedule.subject_detail) {
        console.log(`   Subject: ${schedule.subject_detail.name} (${schedule.subject_detail.subcode})`);
        console.log(`   Subject Department: ${schedule.subject_detail.department}`);
        console.log(`   Subject Year: ${schedule.subject_detail.year}`);
      } else {
        console.log(`   Subject: Not found (ID: ${schedule.subject_id})`);
      }
      
      if (schedule.departments) {
        console.log(`   Department: ${schedule.departments.name} (${schedule.departments.code})`);
      } else {
        console.log(`   Department: Not found (ID: ${schedule.department_id})`);
      }
      
      if (schedule.staff_details) {
        console.log(`   Assigned By: ${schedule.staff_details.name} (${schedule.staff_details.department})`);
      } else {
        console.log(`   Assigned By: Not found (ID: ${schedule.assigned_by})`);
      }
      
      console.log(`   Priority Department: ${schedule.priority_department || 'None'}`);
      console.log(''); // Empty line for readability
    });

    // Show summary statistics
    console.log('📈 Summary:');
    console.log(`   Total Schedules: ${examSchedules.length}`);
    
    const uniqueSubjects = new Set(examSchedules.map(s => s.subject_detail?.name).filter(Boolean));
    console.log(`   Unique Subjects: ${uniqueSubjects.size}`);
    
    const uniqueDepartments = new Set(examSchedules.map(s => s.departments?.name).filter(Boolean));
    console.log(`   Unique Departments: ${uniqueDepartments.size}`);
    
    const uniqueDates = new Set(examSchedules.map(s => s.exam_date));
    console.log(`   Unique Dates: ${uniqueDates.size}`);
    
    const examTypes = examSchedules.reduce((acc, s) => {
      const type = s.exam_type || 'Not specified';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    console.log(`   Exam Types:`, examTypes);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkExamSchedules();
