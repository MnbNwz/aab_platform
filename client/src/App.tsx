import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { store } from './store';
import { restoreSessionThunk } from './store/thunks/authThunks';
import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm';
import AuthGuard from './components/auth/AuthGuard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './components/Dashboard';
import type { RootState, AppDispatch } from './store';

// App Content Component (needs to be inside Provider)
const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Try to restore session on app start
    dispatch(restoreSessionThunk());
  }, [dispatch]);

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

  return (
    <Router>
      <Routes>
        {/* Public Routes - Protected from authenticated users */}
        <Route path="/login" element={
          <AuthGuard>
            <LoginForm />
          </AuthGuard>
        } />
        <Route path="/register" element={
          <AuthGuard>
            <SignUpForm />
          </AuthGuard>
        } />
        <Route path="/signup" element={
          <AuthGuard>
            <SignUpForm />
          </AuthGuard>
        } />
        
        {/* Protected Routes - Single Dashboard for all roles */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
      <Toaster />
    </Provider>
  );
};

export default App;
