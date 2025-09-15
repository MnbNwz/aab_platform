import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

// Component to prevent authenticated users from accessing login/signup pages
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated or still initializing, show the login/signup page
  return <>{children}</>;
};

export default AuthGuard;
