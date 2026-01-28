# Quick Reference: Exam Scheduling Logic

## ✅ What's New

### 1. Same Name OR Code Scheduling
- Subjects with **same name** OR **same code** must be scheduled on the same date across all departments
- Error thrown if attempting to schedule on different dates
- Applies to both staff-subjects and regular subjects

### 2. Edit Functionality
- Admin Dashboard now displays scheduled exams
- Click any date to expand and see exams
- ✏️ **Edit button**: Opens modal to change date/type
- 🗑️ **Delete button**: Removes the schedule

### 3. Conflict Resolution on Edit
- **Same Department**: Auto-swaps conflicting exams to different dates
- **Other Departments with Same Subject**: Automatically released (deleted) so they can be rescheduled on the new date
- **Cross-Department**: Prevents scheduling on different dates (error message)

### 4. Clear Error Messages
- All errors explain what went wrong and why
- Includes subject codes in error messages
- Help text explains multi-department implications

---

## 🎯 How to Use

### View Scheduled Exams
1. Admin Dashboard → Dashboard tab
2. Scroll to "Exam Schedule Overview"
3. Click any date to expand

### Edit a Schedule
1. Find the exam in the expanded date view
2. Click the ✏️ Edit button
3. Change the date (not Sunday)
4. Click "Update Schedule"
5. If same subject in other depts: they're auto-released

### Delete a Schedule
1. Find the exam in the expanded date view
2. Click the 🗑️ Delete button
3. Confirm deletion
4. Done!

---

## 🔍 Subject Matching Logic

| Scenario | Matching | Result |
|----------|----------|--------|
| Same Name | "Database Systems" in CSE + "Database Systems" in IT | Must be same date |
| Same Code | "CS301" in CSE + "CS301" in ECE | Must be same date |
| Name + Code | "Database Systems" (CS301) in both | Must be same date |
| Different | "DBMS" vs "DB" | Can be different dates |

---

## ⚙️ Technical Summary

### Files Changed
- `src/services/examService.ts` - Core scheduling logic
- `src/components/ExamScheduleTable.tsx` - New expandable schedule view
- `src/components/EditExamSchedule.tsx` - Enhanced with info box
- `src/components/AdminDashboard.tsx` - Integrated ExamScheduleTable

### Key Methods
- `scheduleExam()` - Enhanced with name/code matching
- `updateExamSchedule()` - Complete rewrite with conflict resolution
- `deleteExamSchedule()` - New deletion method

---

## 📋 Error Messages Guide

| Error | Meaning | Fix |
|-------|---------|-----|
| "Subject must be scheduled on X date as it is already scheduled by Y department" | Cross-dept constraint violation | Use the date shown |
| "Sunday is not allowed for exams" | Selected a Sunday | Pick a weekday |
| "Failed to delete exam schedule" | Database error | Try again or contact admin |

---

## 🛡️ Safety Features

✅ Sunday prevention - Cannot schedule on Sundays  
✅ Cross-dept validation - Prevents inconsistent scheduling  
✅ Auto-swap - No data loss on conflicts  
✅ Auto-release - Orphaned schedules automatically cleaned up  
✅ Confirmations - Delete requires confirmation  
✅ Clear messages - Every error explains the issue  

---

## 🚀 Auto-Release Example

**Scenario**: You change CSE's Database exam from Jan 15 to Jan 20

**What happens**:
1. System checks if other departments have "Database" scheduled
2. Finds IT department also has it on Jan 15
3. Automatically releases IT's schedule (deletes it)
4. IT can now reschedule Database for Jan 20 (or another date)
5. CSE's schedule is updated to Jan 20

**Why**: If all departments must have same subject on same date, we can't keep IT's orphaned schedule on the old date.

---

## 💡 Best Practices

1. **When Scheduling a Subject**
   - Check if other departments teach it first
   - Schedule on a date that works for everyone
   - System will auto-create schedules for all departments

2. **When Editing a Schedule**
   - Remember other departments' schedules might be auto-released
   - Choose a date that accommodates the subject across all departments
   - Inform other department coordinators of the change

3. **When Deleting**
   - Only delete if you're sure (confirmation required)
   - Other departments won't be auto-affected
   - They can re-schedule as needed

---

## 📞 Questions?

Refer to `SCHEDULING_LOGIC_IMPLEMENTATION.md` for detailed technical documentation.
