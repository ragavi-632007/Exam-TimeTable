import React, { useState, useEffect } from 'react';
import { Search, Trash2, Calendar, AlertCircle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { subjectService, Subject } from '../services/subjectService';
import { examService } from '../services/examService';

interface SubjectWithSchedule extends Subject {
  isScheduled: boolean;
  scheduledDate?: string;
  assignedBy?: string;
}

export const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectWithSchedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'pending'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);

  // Get unique years and semesters from subjects
  const uniqueYears = [...new Set(subjects.map(s => s.year))].sort();
  const uniqueSemesters = [...new Set(subjects.map(s => s.sem))].sort();
  
  // Allowed semesters depend on selected year
  const allowedSemesters: number[] =
    selectedYear === 2
      ? [3, 4]
      : selectedYear === 3
      ? [5, 6]
      : uniqueSemesters;

  useEffect(() => {
    loadSubjects();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showYearDropdown || showSemesterDropdown) {
        const target = event.target as Element;
        if (!target.closest('.dropdown-container')) {
          setShowYearDropdown(false);
          setShowSemesterDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showYearDropdown, showSemesterDropdown]);

  // Ensure semester selection stays valid when year changes
  useEffect(() => {
    if (selectedSemester !== 'all' && !allowedSemesters.includes(selectedSemester)) {
      setSelectedSemester('all');
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
        console.log('No scheduled exams found yet:', scheduleError);
      }
      
      // Create a map of scheduled exams by subject ID
      const scheduledMap = new Map();
      scheduledExams.forEach(schedule => {
        scheduledMap.set(schedule.subjectId, {
          date: schedule.examDate,
          assignedBy: schedule.assignedBy
        });
      });

      // Combine subject data with scheduling status
      const subjectsWithSchedule: SubjectWithSchedule[] = subjectsData.map(subject => ({
        ...subject,
        isScheduled: scheduledMap.has(subject.id),
        scheduledDate: scheduledMap.get(subject.id)?.date,
        assignedBy: scheduledMap.get(subject.id)?.assignedBy
      }));

      setSubjects(subjectsWithSchedule);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'scheduled' && subject.isScheduled) ||
      (filterStatus === 'pending' && !subject.isScheduled);
    
    const matchesYear = selectedYear === 'all' || subject.year === selectedYear;
    const matchesSemester = selectedSemester === 'all'
      ? (selectedYear === 2
          ? [3, 4].includes(subject.sem)
          : selectedYear === 3
          ? [5, 6].includes(subject.sem)
          : true)
      : subject.sem === selectedSemester;
    
    // Debug logging
    if (selectedYear !== 'all' || selectedSemester !== 'all') {
      console.log('Filtering subject:', subject.name, {
        year: subject.year,
        selectedYear,
        semester: subject.sem,
        selectedSemester,
        matchesYear,
        matchesSemester
      });
    }
    
    return matchesSearch && matchesFilter && matchesYear && matchesSemester;
  });

  const getStatusIcon = (isScheduled: boolean) => {
    if (isScheduled) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

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
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectService.deleteSubject(id);
        // Refresh the subjects list
        await loadSubjects();
      } catch (error) {
        console.error('Error deleting subject:', error);
      }
    }
  };

  // Add subject functionality removed per requirements

  const refreshData = async () => {
    await loadSubjects();
  };

  const stats = {
    total: subjects.length,
    scheduled: subjects.filter(s => s.isScheduled).length,
    pending: subjects.filter(s => !s.isScheduled).length
  };

  // Update stats based on current filters (excluding text search)
  const getFilteredStats = () => {
    const yearFiltered = subjects.filter(s => 
      selectedYear === 'all' || s.year === selectedYear
    );
    const semesterFiltered = yearFiltered.filter(s => {
      if (selectedSemester === 'all') {
        if (selectedYear === 2) return [3, 4].includes(s.sem);
        if (selectedYear === 3) return [5, 6].includes(s.sem);
        return true;
      }
      return s.sem === selectedSemester;
    });
    const totalYearSem = semesterFiltered.length;
    const scheduled = semesterFiltered.filter(s => s.isScheduled).length;
    const pending = totalYearSem - scheduled;
    return {
      total: subjects.length,
      totalYearSem,
      scheduled,
      pending
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
          <p className="text-sm text-gray-600">Manage subjects and view their scheduling status</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{currentStats.totalYearSem}</p>
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
              <p className="text-2xl font-bold text-gray-900">{currentStats.scheduled}</p>
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
              <p className="text-2xl font-bold text-gray-900">{currentStats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Visible Results</p>
              <p className="text-2xl font-bold text-gray-900">{filteredSubjects.length}</p>
            </div>
          </div>
        </div>
        
        {/* Filter Summary */}
        {(selectedYear !== 'all' || selectedSemester !== 'all') && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Showing results for:</span>
            {selectedYear !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Year {selectedYear}
              </span>
            )}
            {selectedSemester !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Semester {selectedSemester}
              </span>
            )}
            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedSemester('all');
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
              <span>{selectedYear === 'all' ? 'All Years' : `Year ${selectedYear}`}</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            {showYearDropdown && (
              <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    setSelectedYear('all');
                    setShowYearDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                >
                  All Years
                </button>
                {uniqueYears.map((year) => (
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
              <span>{selectedSemester === 'all' ? 'All Semesters' : `Semester ${selectedSemester}`}</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            {showSemesterDropdown && (
              <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    setSelectedSemester('all');
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
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({currentStats.totalYearSem})
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'scheduled'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Scheduled ({currentStats.scheduled})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                      <div className="text-sm text-gray-500">{subject.subcode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{subject.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Year {subject.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Semester {subject.sem}</div>
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
                            {new Date(subject.scheduledDate!).toLocaleDateString()}
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
            {searchTerm ? 'Try adjusting your search criteria' : 'No subjects available'}
          </p>
        </div>
      )}
    </div>
  );
}; 