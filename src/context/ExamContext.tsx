import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exam, ExamAlert } from '../types';
import { examService } from '../services/examService';


interface ExamContextType {
  exams: Exam[];
  alerts: ExamAlert[];
  scheduledExams: any[];
  loading: boolean;
  refreshExams: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshScheduledExams: () => Promise<void>;
  updateExam: (examId: string, updates: Partial<Exam>) => Promise<void>;
  createExam: (examData: Omit<Exam, 'id'>) => Promise<void>;
  deleteExam: (examId: string) => Promise<void>;
  scheduleExam: (subjectId: string, examDate: string, assignedBy: string, examType?: 'IA1' | 'IA2' | 'MODEL') => Promise<void>;
  createAlert: (alertData: Omit<ExamAlert, 'id' | 'createdAt'>) => Promise<void>;
  updateAlert: (alertId: string, updates: Partial<ExamAlert>) => Promise<void>;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const useExams = () => {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExams must be used within an ExamProvider');
  }
  return context;
};

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [alerts, setAlerts] = useState<ExamAlert[]>([]);
  const [scheduledExams, setScheduledExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshExams = async () => {
    try {
      const examData = await examService.getExams();
      setExams(examData);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const refreshAlerts = async () => {
    try {
      console.log('Fetching exam alerts...');
      const alertData = await examService.getExamAlerts();
      console.log('Raw alert data:', JSON.stringify(alertData, null, 2));
      
      // Filter out any alerts with invalid years
      const validAlerts = alertData.filter(alert => {
        const year = Number(alert.year);
        if (isNaN(year) || year < 1 || year > 4) {
          console.warn('Filtering out alert with invalid year:', alert);
          return false;
        }
        return true;
      });
      
      console.log('Setting alerts state with:', JSON.stringify(validAlerts, null, 2));
      setAlerts(validAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const refreshScheduledExams = async () => {
    try {
      const scheduledData = await examService.getScheduledExams();
      setScheduledExams(scheduledData);
    } catch (error) {
      console.error('Error fetching scheduled exams:', error);
    }
  };

  const updateExam = async (examId: string, updates: Partial<Exam>) => {
    try {
      // Mock update - just update the local state
      setExams(prevExams => 
        prevExams.map(exam => 
          exam.id === examId ? { ...exam, ...updates } : exam
        )
      );
    } catch (error) {
      console.error('Error updating exam:', error);
      throw error;
    }
  };

  const createExam = async (examData: Omit<Exam, 'id'>) => {
    try {
      const newExam = { ...examData, id: `exam-${Date.now()}` };
      setExams(prevExams => [newExam, ...prevExams]);
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  };

  const deleteExam = async (examId: string) => {
    try {
      setExams(prevExams => prevExams.filter(exam => exam.id !== examId));
    } catch (error) {
      console.error('Error deleting exam:', error);
      throw error;
    }
  };

  const scheduleExam = async (subjectId: string, examDate: string, assignedBy: string, examType: 'IA1' | 'IA2' | 'MODEL' = 'IA1') => {
    try {
      await examService.scheduleExam(subjectId, examDate, assignedBy, examType);
      
      // Refresh scheduled exams after scheduling
      await refreshScheduledExams();
      // Also refresh exams to update their status
      await refreshExams();
    } catch (error) {
      console.error('Error scheduling exam:', error);
      throw error;
    }
  };

  const createAlert = async (alertData: Omit<ExamAlert, 'id' | 'createdAt'>) => {
    try {
      const newAlert = await examService.createExamAlert(alertData);
      setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  };

  const updateAlert = async (alertId: string, updates: Partial<ExamAlert>) => {
    try {
      const updatedAlert = await examService.updateExamAlert(alertId, updates);
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? updatedAlert : alert
        )
      );
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([refreshExams(), refreshAlerts(), refreshScheduledExams()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <ExamContext.Provider value={{
      exams,
      alerts,
      scheduledExams,
      loading,
      refreshExams,
      refreshAlerts,
      refreshScheduledExams,
      updateExam,
      createExam,
      deleteExam,
      scheduleExam,
      createAlert,
      updateAlert,
    }}>
      {children}
    </ExamContext.Provider>
  );
}; 