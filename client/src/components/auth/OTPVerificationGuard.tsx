import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getVerificationStateThunk } from "../../store/thunks/verificationThunks";
import type { RootState, AppDispatch } from "../../store";
import OTPVerification from "./OTPVerification";

interface OTPVerificationGuardProps {
  children: React.ReactNode;
}

const OTPVerificationGuard: React.FC<OTPVerificationGuardProps> = ({
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const { userVerification, isLoading } = useSelector(
    (state: RootState) => state.verification
  );

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
      return;
    }

    // Get verification state for the user
    if (user.email) {
      dispatch(getVerificationStateThunk({ email: user.email }));
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  // If user is not authenticated, don't render anything
  if (!isAuthenticated || !user) {
    return null;
  }

  // If loading verification state, show loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // If userVerification is not loaded yet, show loading
  if (!userVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking verification status...</p>
        </div>
      </div>
    );
  }

  // If user verification is not verified, show OTP verification
  if (!userVerification.isVerified) {
    return <OTPVerification email={user.email} />;
  }

  // If email is verified, render the protected content
  return <>{children}</>;
};

export default OTPVerificationGuard;
