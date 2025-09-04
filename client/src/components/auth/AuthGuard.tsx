import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

// Component to prevent authenticated users from accessing login/signup pages
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isInitialized } = useSelector((state: RootState) => state.auth);

  // Don't redirect until we know the auth state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading AAS Platform...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    console.log('🔒 User already authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show the login/signup page
  return <>{children}</>;
};

export default AuthGuard;
