# Exam Scheduling Logic Implementation - Cross-Department Consistency

## Overview
This document details the implementation of enhanced exam scheduling logic that ensures subjects with the same name OR code are scheduled on the same date across all departments. Additionally, edit functionality has been enabled for administrators and department coordinators with intelligent conflict resolution.

## Key Features Implemented

### 1. **Cross-Department Subject Consistency**

#### What Changed:
- **Before**: Only subjects with the same name were enforced to be on the same date
- **After**: Subjects with the same **name OR code** are now enforced to be on the same date across all departments

#### Implementation Details:
In `examService.ts`, the `scheduleExam` method now checks for subject matches using **both** name and code:

```typescript
// Check if the same subject (by name OR code) is already scheduled in another department
const sameSubjectSchedules = existingSchedules?.filter(
  (schedule) => 
    schedule.subject_detail &&
    (schedule.subject_detail.name === subject.name || 
     schedule.subject_detail.subcode === subject.subcode)
) || [];

if (sameSubjectSchedules.length > 0) {
  const existingSchedule = sameSubjectSchedules[0];
  if (examDate !== existingSchedule.exam_date) {
    throw new Error(
      `Subject "${subject.name}" (Code: ${subject.subcode}) must be scheduled on ${existingSchedule.exam_date} ` +
      `as it is already scheduled by ${scheduledDept} department.`
    );
  }
}
```

This applies to:
- Staff-subject scheduling (from `staff_details` table)
- Regular subject-detail scheduling (from `subject_detail` table)

### 2. **Edit Functionality for Admins & Coordinators**

#### What Changed:
- **Before**: No direct edit UI for scheduled exams in the dashboard
- **After**: 
  - Enhanced `ExamScheduleTable` component with expandable date view
  - Edit and Delete buttons for each scheduled exam
  - Admin Dashboard displays scheduled exams with interactive controls
  - Dedicated `EditExamSchedule` modal for editing with validation

#### User Interface Improvements:
1. **Expandable Schedule View**: Click on any date to see all exams scheduled on that date
2. **Action Buttons**: 
   - ✏️ Edit button: Opens the edit modal
   - 🗑️ Delete button: Removes the schedule with confirmation
3. **Informative UI**: Clear instructions about cross-department constraints

### 3. **Intelligent Conflict Resolution on Date Change**

#### What Changed:
When a department coordinator or admin changes an exam date, the system now:

1. **Validates Cross-Department Constraints**
   - Ensures the same subject (by name/code) stays on the same date across all departments
   - Throws clear error if attempting to schedule on a different date than other departments

2. **Auto-Swaps Conflicting Exams**
   - If changing to a date with another exam from the same department
   - Automatically swaps the dates (the conflicting exam takes the original date)
   - No data is lost; exams are simply rescheduled

3. **Releases Previously Scheduled Subjects**
   - When a subject's date is changed, any other departments with the **same subject** are automatically released (deleted)
   - This is necessary because they must now be rescheduled on the new date
   - Prevents orphaned schedules

#### Implementation in `updateExamSchedule` Method:

```typescript
// Check if the same subject is scheduled elsewhere (by name OR code)
const otherDeptSameSubject = sameSubjectSchedules?.filter(
  (schedule) => 
    schedule.subject_detail &&
    (schedule.subject_detail.name === subject.name || 
     schedule.subject_detail.subcode === subject.subcode) &&
    schedule.subject_detail.id !== subject.id
) || [];

// Enforce same date
if (otherDeptSameSubject.length > 0) {
  const otherSchedule = otherDeptSameSubject[0];
  if (updates.exam_date !== otherSchedule.exam_date) {
    throw new Error(
      `Subject "${subject.name}" (${subject.subcode}) must be scheduled on ${otherSchedule.exam_date}...`
    );
  }
}

// If date is changed, release (delete) schedules for the same subject on the old date
if (oldDate !== updates.exam_date) {
  for (const scheduleToRelease of schedulesToRelease || []) {
    if (
      scheduleToRelease.subject_detail &&
      (scheduleToRelease.subject_detail.name === subject.name ||
       scheduleToRelease.subject_detail.subcode === subject.subcode)
    ) {
      // Delete the schedule
      const { error: deleteError } = await supabase
        .from("exam_schedules")
        .delete()
        .eq("id", scheduleToRelease.id);
    }
  }
}
```

### 4. **Enhanced Delete Functionality**

A new method `deleteExamSchedule` was added to allow removal of specific schedules:

```typescript
async deleteExamSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from("exam_schedules")
    .delete()
    .eq("id", scheduleId);
  
  if (error) {
    throw new Error(`Failed to delete exam schedule: ${error.message}`);
  }
}
```

## Modified Files

### 1. **src/services/examService.ts**
- ✅ Enhanced `scheduleExam()` method:
  - Now checks for subjects by **name OR code**
  - Applies to both staff-subject and regular subjects
  - Better error messages including subject code

- ✅ Completely rewritten `updateExamSchedule()` method:
  - Cross-department consistency validation
  - Auto-swap conflict resolution
  - Release/delete orphaned schedules when date changes
  - Comprehensive logging

- ✅ Added `deleteExamSchedule()` method:
  - Safe deletion of exam schedules

### 2. **src/components/ExamScheduleTable.tsx**
- ✅ Complete redesign:
  - Expandable date-based view (click to expand)
  - Shows all departments for each date
  - Added Edit and Delete buttons for each exam
  - Responsive table layout with actions
  - Shows assigned by, exam type, and other details
  - Integration with `EditExamSchedule` modal
  - Callback for updating parent when changes occur

### 3. **src/components/EditExamSchedule.tsx**
- ✅ Enhanced error handling:
  - Better error messages for cross-department constraints
  - Shows informative notice about multi-department implications
  - Clear instructions in the dialog

- ✅ Added info box explaining:
  - How changes affect other departments
  - Auto-swap mechanism
  - Date consistency requirement

### 4. **src/components/AdminDashboard.tsx**
- ✅ Added scheduled exams tracking:
  - New `scheduledExams` state
  - `fetchScheduledExams()` function
  - Automatic refresh on schedule updates

- ✅ Integrated `ExamScheduleTable`:
  - Displayed in the dashboard
  - Shows real-time scheduled exams
  - Callback to refresh when changes occur

- ✅ Imported `ExamScheduleTable` component

## Usage Workflow

### For Admins/Coordinators Editing Schedules:

1. **Access Dashboard**
   - Go to Admin Dashboard → Dashboard tab
   - Scroll down to "Exam Schedule Overview" section

2. **View Schedules**
   - See all scheduled exams grouped by date
   - Click on a date to expand and see details

3. **Edit a Schedule**
   - Click the ✏️ Edit button
   - Modal opens with current details
   - Change the date as needed
   - Informational notice explains cross-department impacts

4. **Submit Changes**
   - System validates:
     - Date is not Sunday
     - Cross-department subjects stay together
     - Conflicts are auto-swapped if in same department
     - Other departments' same-subject schedules are released
   - Success: Schedule is updated, view refreshes
   - Error: Clear message explains what went wrong

5. **Delete a Schedule**
   - Click the 🗑️ Delete button
   - Confirm deletion
   - Schedule is removed, view refreshes

## Error Handling

The system provides clear, actionable error messages:

1. **Cross-Department Constraint Violation**:
   ```
   Subject "Database Systems" (Code: CS301) must be scheduled on 2025-02-10 
   as it is already scheduled by CSE department. 
   All departments teaching this subject must have the exam on the same date.
   ```

2. **Sunday Selection**:
   ```
   Sunday is not allowed for exams. Please choose another date.
   ```

3. **Deletion Errors**:
   ```
   Failed to delete schedule: [reason]
   ```

## Database Behavior

### When Scheduling:
- Creates exam schedule for requesting department
- Automatically creates for all other departments teaching same subject (by name/code)
- All get the same date

### When Editing Date:
1. Validates new date is valid for the subject's year
2. Checks cross-department constraints
3. If conflict in same department: auto-swaps
4. If date changed: releases schedules for same subject in other departments
5. Updates the original schedule

### When Deleting:
- Only removes that specific department's schedule
- Other departments' schedules for different subjects are unaffected
- Same-subject schedules in other departments are NOT automatically deleted (admin must handle)

## Important Notes

### Auto-Release Behavior:
- When a department changes a subject's date, other departments with the **same subject** are automatically released
- This is intentional: all departments must be on the same date, so they need to reschedule anyway
- Prevents inconsistent scheduling of the same subject across departments

### Subject Matching:
- Uses **BOTH** name AND code for matching
- Examples:
  - "Database Systems" with code "CS301" matches all instances
  - "CS301" in CSE and "CS301" in IT → must be same date
  - "Database Systems" in CSE and "Database Systems" in AIDS → must be same date

### Edit Permissions:
- System assumes anyone accessing AdminDashboard has permission to edit
- In future, role-based access control can be added:
  - Admins: can edit any exam
  - Coordinators: can only edit exams in their department

## Testing Recommendations

1. **Cross-Department Scheduling**
   - Schedule subject in Dept A on date X
   - Try to schedule same subject in Dept B on date Y
   - Should fail with clear error

2. **Editing with Auto-Swap**
   - Schedule Exam1 and Exam2 in same dept on different dates
   - Edit Exam1 to Exam2's date
   - Should swap dates automatically

3. **Date Release**
   - Schedule "CS301" in CSE on Jan 15
   - Schedule "CS301" in IT on Jan 15 (auto-applied)
   - Edit CSE's date to Jan 20
   - Check that IT's schedule is released (can be deleted/rescheduled)

4. **Delete Confirmation**
   - Delete a schedule
   - Confirm in database that it's removed
   - Check that other departments' schedules remain

## Future Enhancements

1. **Bulk Operations**
   - Edit multiple exams at once
   - Move all exams from one date to another

2. **Conflict Resolution UI**
   - When auto-swap occurs, show which exams were swapped
   - Suggested alternative dates if schedule is full

3. **Validation Improvements**
   - Check for room availability
   - Check for staff availability
   - Prevent scheduling during holidays

4. **Notifications**
   - Email departments when their schedule is released
   - Email when schedules are changed

5. **History/Audit Trail**
   - Track who changed what and when
   - Allow reverting to previous schedules

6. **Role-Based Access Control**
   - Distinguish between admin and coordinator permissions
   - Restrict coordinators to editing their own department

## Conclusion

This implementation provides a robust, user-friendly system for managing exam schedules across multiple departments while ensuring consistency. The automatic conflict resolution and cross-department constraint enforcement prevent common scheduling errors and reduce administrative overhead.
