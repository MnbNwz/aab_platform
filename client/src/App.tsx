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
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import OTPVerification from "./components/auth/OTPVerification";
import OTPVerificationGuard from "./components/auth/OTPVerificationGuard";
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
  // Don't show loading screen on auth pages
  const isAuthPage = window.location.pathname.match(
    /\/(login|signup|register)/
  );

  useEffect(() => {
    dispatch(restoreSessionThunk());
  }, [dispatch]);

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
        <Route
          path="/otp-verification"
          element={
            <AuthGuard>
              <OTPVerification />
            </AuthGuard>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthGuard>
              <ForgotPassword />
            </AuthGuard>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthGuard>
              <ResetPassword />
            </AuthGuard>
          }
        />

        {/* Protected Routes - Single Dashboard for all roles */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OTPVerificationGuard>
                <RevokeStatusGate>
                  <PendingApproval>
                    <MembershipGate>
                      <Dashboard />
                    </MembershipGate>
                  </PendingApproval>
                </RevokeStatusGate>
              </OTPVerificationGuard>
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
      <Toaster
        toastOptions={{
          style: {
            zIndex: 99999,
          },
        }}
        containerStyle={{
          zIndex: 99999,
        }}
      />
    </Provider>
  );
};

export default App;
