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
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.email && !userVerification && !isLoading) {
      dispatch(getVerificationStateThunk({ email: user.email }));
    }
  }, [isAuthenticated, user, navigate, dispatch, userVerification, isLoading]);

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isLoading || !userVerification) {
    return null;
  }

  // If user verification is not verified, show OTP verification
  if (!userVerification.isVerified) {
    return <OTPVerification email={user.email} />;
  }

  // If email is verified, render the protected content
  return <>{children}</>;
};

export default OTPVerificationGuard;
