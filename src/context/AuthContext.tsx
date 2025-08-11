import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService, AuthUser } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            role: currentUser.role,
            department: currentUser.department,
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const authUser = await authService.signIn(email, password);
      const user: User = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
        department: authUser.department,
      };
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};