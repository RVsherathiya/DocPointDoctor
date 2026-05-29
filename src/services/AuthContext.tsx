import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin';
  status: 'active' | 'blocked';
  isProfileCompleted?: boolean;
  verificationStatus?: 'pending_upload' | 'pending_approval' | 'approved' | 'rejected';
  doctorProfile?: {
    profilePhoto?: string;
    gender?: string;
    dob?: string;
    address?: string;
    specialization?: string;
    experience?: number;
    qualification?: string;
    licenseNumber?: string;
    clinicName?: string;
    clinicAddress?: string;
    consultationFee?: number;
  };
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = () => {
      try {
        const savedToken = localStorage.getItem('doctor_token');
        const savedUserStr = localStorage.getItem('doctor_user');

        if (savedToken && savedUserStr) {
          const savedUser = JSON.parse(savedUserStr) as User;
          
          // Verify role is doctor
          if (savedUser.role === 'doctor') {
            setToken(savedToken);
            setUser(savedUser);
          } else {
            // Purge non-doctor session if exists by mistake
            localStorage.removeItem('doctor_token');
            localStorage.removeItem('doctor_user');
          }
        }
      } catch (e) {
        console.error('Error loading doctor session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = (newToken: string, newUser: User) => {
    if (newUser.role !== 'doctor') {
      throw new Error('Access denied. Only doctors can sign in to this portal.');
    }
    if (newUser.status === 'blocked') {
      throw new Error('Access denied. Your doctor account is currently blocked.');
    }

    localStorage.setItem('doctor_token', newToken);
    localStorage.setItem('doctor_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('doctor_token');
    localStorage.removeItem('doctor_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('doctor_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
