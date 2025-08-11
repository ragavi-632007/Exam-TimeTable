import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/teacher" 
                  element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <TeacherDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
            
            {/* Footer */}
            <footer className="bg-blue-900 text-white py-4">
              <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <div className="text-sm">
                  Copyright © Chennai Institute of Technology 2025. All rights reserved.
                </div>
                <div className="text-sm">
                  Examination Management System
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </ExamProvider>
    </AuthProvider>
  );
}

export default App;