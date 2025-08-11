import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, Eye, EyeOff, MapPin, Phone, Mail as MailIcon, Award, Building, BookOpen, Users, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/teacher'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - CIT Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 p-8 flex-col justify-between">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-900 font-bold text-xl">CIT</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Chennai Institute of Technology</h1>
              <p className="text-blue-200 text-lg">Best Engineering College in Chennai</p>
            </div>
          </div>

          {/* Institution Details */}
          <div className="text-blue-200">
            <p className="text-lg">Autonomous Institution • TNEA Code: 1399</p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-700 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Excellence in Education</h3>
                <p className="text-blue-200">Providing quality technical education with industrial exposure.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-700 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">12 Departments</h3>
                <p className="text-blue-200">Comprehensive engineering programs across all disciplines.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-700 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Research & Innovation</h3>
                <p className="text-blue-200">State-of-the-art research centers and innovation hubs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Examination Management Portal</h2>
              <p className="text-gray-600">Sign in to access your dashboard</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Help Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Need help? Contact your system administrator</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use your registered email and password to access the system
                </p>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
};