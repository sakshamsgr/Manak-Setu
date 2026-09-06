import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/authApi';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; name: string; dob?: string; } | null;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // FIX 1: Added dob to the allowed state type
  const [user, setUser] = useState<{ email: string; name: string; dob?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      const data = await authApi.getMe();
      // FIX 2: Actually capture and save the dob from the backend
      setUser({ email: data.email, name: data.name, dob: data.dob });
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      
      // FIX 3: Aggressively wipe local browser memory to prevent account data leaking
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, checkSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};