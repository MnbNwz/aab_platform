import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

import { store } from "./store";
import { restoreSessionThunk } from "./store/thunks/authThunks";
import { authSlice } from "./store/slices/authSlice";
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import AuthGuard from "./components/auth/AuthGuard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import MembershipGate from "./components/membership/MembershipGate";
import RevokeStatusGate from "./components/auth/RevokeStatusGate";
import type { RootState, AppDispatch } from "./store";
import { PendingApproval } from "./components";

// App Content Component (needs to be inside Provider)
const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const currentPath = window.location.pathname;
    // Only try to restore session if not on auth pages
    if (
      !currentPath.includes("/login") &&
      !currentPath.includes("/signup") &&
      !currentPath.includes("/register")
    ) {
      dispatch(restoreSessionThunk());
    } else {
      // Immediately set initialized for auth pages
      dispatch(authSlice.actions.setInitialized());
    }
  }, [dispatch]);

  // Don't show loading screen on auth pages
  const isAuthPage = window.location.pathname.match(
    /\/(login|signup|register)/
  );
  if (!isInitialized && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-800">
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
        <Route
          path="/login"
          element={
            <AuthGuard>
              <LoginForm />
            </AuthGuard>
          }
        />
        <Route
          path="/register"
          element={
            <AuthGuard>
              <SignUpForm />
            </AuthGuard>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthGuard>
              <SignUpForm />
            </AuthGuard>
          }
        />

        {/* Protected Routes - Single Dashboard for all roles */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RevokeStatusGate>
                <PendingApproval>
                  <MembershipGate>
                    <Dashboard />
                  </MembershipGate>
                </PendingApproval>
              </RevokeStatusGate>
            </ProtectedRoute>
          }
        />

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
