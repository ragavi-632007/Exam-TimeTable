# Subject Management - Year and Semester Filtering

## Overview
The Subject Management component now includes dropdown filters for Year and Semester, allowing administrators to easily filter subjects based on these criteria.

## Features Added

### 1. Year Dropdown Filter
- **Location**: Above the status filter buttons
- **Options**: 
  - "All Years" (default)
  - Year 1, Year 2, Year 3, etc. (based on available data)
- **Functionality**: Filters subjects to show only those from the selected year

### 2. Semester Dropdown Filter
- **Location**: Next to the Year dropdown
- **Options**:
  - "All Semesters" (default)
  - Semester 1 through Semester 8
- **Functionality**: Filters subjects to show only those from the selected semester

### 3. Combined Filtering
- Both filters work together - you can select a specific year AND semester
- Filters are applied in real-time as you make selections
- Search functionality works in combination with the filters

### 4. Enhanced Statistics
- **New "Filtered Results" card**: Shows the count of subjects matching current filters
- **Dynamic counts**: Status filter buttons now show counts based on current year/semester selection
- **Filter summary**: Visual indicators showing active filters with option to clear all

## Database Changes

### New Column Added
- `semester` column added to `subject_detail` table
- Default value: 1 for existing subjects
- Type: INTEGER, NOT NULL

### Migration
- Run `migrations/add_semester_column.sql` to add the semester column to existing databases
- Existing subjects will automatically get semester = 1

## Usage Instructions

### Basic Filtering
1. **Select Year**: Click the Year dropdown and choose a specific year or "All Years"
2. **Select Semester**: Click the Semester dropdown and choose a specific semester or "All Semesters"
3. **View Results**: The table will automatically update to show only matching subjects
4. **Clear Filters**: Use the "Clear filters" link below the dropdowns

### Advanced Filtering
- Combine year and semester filters for precise results
- Use search terms in combination with filters
- Apply status filters (All/Scheduled/Pending) on top of year/semester filters

### Filter Summary
- Active filters are displayed as colored badges below the dropdowns
- Shows exactly which filters are currently applied
- Quick access to clear all filters

## Technical Implementation

### State Management
- `selectedYear`: Current year filter selection
- `selectedSemester`: Current semester filter selection
- `showYearDropdown`: Controls year dropdown visibility
- `showSemesterDropdown`: Controls semester dropdown visibility

### Filtering Logic
```typescript
const filteredSubjects = subjects.filter(subject => {
  const matchesSearch = /* search logic */;
  const matchesFilter = /* status filter logic */;
  const matchesYear = selectedYear === 'all' || subject.year === selectedYear;
  const matchesSemester = selectedSemester === 'all' || subject.semester === selectedSemester;
  
  return matchesSearch && matchesFilter && matchesYear && matchesSemester;
});
```

### Performance
- Indexes added on `semester` and `(year, semester)` columns
- Filtering happens client-side for immediate response
- Dropdowns close automatically when clicking outside

## Future Enhancements
- Save filter preferences in localStorage
- Export filtered results to CSV
- Bulk operations on filtered subjects
- Advanced filtering options (date ranges, department combinations)

## Troubleshooting

### Common Issues
1. **No subjects showing**: Check if filters are too restrictive
2. **Dropdowns not closing**: Ensure proper click event handling
3. **Filter counts incorrect**: Verify semester data exists in database

### Debug Mode
- Console logging added for filter operations
- Check browser console for detailed filtering information
- Verify subject data structure includes semester field
