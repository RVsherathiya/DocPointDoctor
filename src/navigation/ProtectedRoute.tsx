import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--text)',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '4px solid var(--border)',
          borderTopColor: 'var(--primary-color)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Initializing DocPoint Doctor Workspace...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and save location to return to later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if profile setup is required
  if (!user?.isProfileCompleted) {
    if (location.pathname !== '/profile-setup') {
      return <Navigate to="/profile-setup" replace />;
    }
  } 
  // Check if verification documents upload / admin approval is required
  else if (user?.verificationStatus !== 'approved') {
    if (location.pathname !== '/verification') {
      return <Navigate to="/verification" replace />;
    }
  } 
  // If everything is complete, redirect away from setup/verification screens to dashboard
  else {
    if (location.pathname === '/profile-setup' || location.pathname === '/verification') {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
