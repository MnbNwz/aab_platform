import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Mail,
  Clock,
} from "lucide-react";
import OtpInput from "react-otp-input";
import {
  verifyOTPThunk as verifyOTPVerificationThunk,
  resendOTPThunk as resendOTPVerificationThunk,
  getVerificationStateThunk,
} from "../../store/thunks/verificationThunks";
import { clearError } from "../../store/slices/authSlice";
import { logoutThunk } from "../../store/thunks/authThunks";
import { clearError as clearVerificationError } from "../../store/slices/verificationSlice";
import type { RootState, AppDispatch } from "../../store";
import UserDropdown from "../ui/UserDropdown";

interface OTPVerificationProps {
  email?: string;
  onBack?: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  email: propEmail,
  onBack,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const { error, isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const {
    userVerification,
    error: verificationError,
    isVerifying,
    isResending,
  } = useSelector((state: RootState) => state.verification);

  // Get email from props, location state, or use a default
  const email = propEmail || location.state?.email || "";

  const [otp, setOtp] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearVerificationError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user && userVerification?.isVerified) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, userVerification, navigate]);

  // Load verification state when component mounts
  useEffect(() => {
    if (email) {
      dispatch(getVerificationStateThunk({ email }));
    }
  }, [email, dispatch]);

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // OTP validation
  const isValidOTP = (otp: string): boolean => {
    return otp.length === 6 && /^\d{6}$/.test(otp);
  };

  // Calculate remaining time based on backend data
  const calculateRemainingTime = (): number => {
    // Use otpExpiresAt if available (new API response)
    if (userVerification?.otpExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(userVerification.otpExpiresAt);
      const remaining = Math.floor(
        (expiresAt.getTime() - now.getTime()) / 1000
      );
      return Math.max(0, remaining);
    }

    // Fallback to otpExpiresInSeconds if available
    if (userVerification?.otpExpiresInSeconds) {
      return Math.max(0, userVerification.otpExpiresInSeconds);
    }

    // No fallback needed - we always have backend data
    return 0;
  };

  // Check if OTP is expired based on backend data
  const isOTPExpired = (): boolean => {
    return calculateRemainingTime() <= 0;
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Single timer that updates from API data
  useEffect(() => {
    if (userVerification?.otpExpiresAt) {
      const updateTimer = () => {
        const now = new Date();
        const expiresAt = new Date(userVerification.otpExpiresAt!);
        const remaining = Math.floor(
          (expiresAt.getTime() - now.getTime()) / 1000
        );
        setOtpExpiry(Math.max(0, remaining));
      };

      // Update immediately
      updateTimer();

      // Update every second
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    } else if (userVerification?.otpExpiresInSeconds) {
      // Fallback to otpExpiresInSeconds if otpExpiresAt is not available
      setOtpExpiry(userVerification.otpExpiresInSeconds);
    }
  }, [userVerification?.otpExpiresAt, userVerification?.otpExpiresInSeconds]);

  // Handle OTP change from library
  const handleOtpChange = (value: string) => {
    try {
      // Only allow digits, completely reject alphabets and other characters
      const digitsOnly = value.replace(/[^0-9]/g, "").slice(0, 6);

      // Only update if the value actually changed (preserves library's internal state)
      if (digitsOnly !== otp) {
        setOtp(digitsOnly);
      }

      // Clear error when user starts typing
      if (verificationStatus === "error") {
        setVerificationStatus("idle");
      }
    } catch (error) {
      console.error("Error in handleOtpChange:", error);
      // Fallback: just set the value as is
      setOtp(value.slice(0, 6));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email || !isValidEmail(email)) {
      setVerificationStatus("error");
      return;
    }

    // Validate OTP
    if (!isValidOTP(otp)) {
      setVerificationStatus("error");
      return;
    }

    // Check if OTP has expired
    if (isOTPExpired()) {
      setVerificationStatus("error");
      return;
    }

    setVerificationStatus("idle");

    try {
      await dispatch(
        verifyOTPVerificationThunk({
          email,
          otpCode: otp,
        })
      ).unwrap();

      setVerificationStatus("success");

      // Clear redirect timer on success

      // Redirect after a short delay to show success state
      redirectTimerRef.current = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    } catch (error) {
      setVerificationStatus("error");
      // Clear OTP on error
      setOtp("");
    }
  };

  const handleResendOTP = async () => {
    // Validate email before resending
    if (!email || !isValidEmail(email)) {
      setVerificationStatus("error");
      return;
    }

    // Check cooldown
    if (
      userVerification?.cooldownSeconds &&
      userVerification.cooldownSeconds > 0
    )
      return;

    setVerificationStatus("idle");

    try {
      await dispatch(resendOTPVerificationThunk({ email })).unwrap();

      // Clear current OTP
      setOtp("");

      // Timer will be updated automatically by the useEffect that watches userVerification.otpExpiresInSeconds
    } catch (error) {
      console.error("Failed to resend OTP:", error);
      setVerificationStatus("error");
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-primary-800 flex items-center justify-center p-4 relative">
      {/* User Dropdown outside modal */}
      {user && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50">
          <UserDropdown
            user={user}
            onLogout={handleLogout}
            logoutLabel="Logout"
            prominent={true}
          />
        </div>
      )}

      <div className="max-w-lg w-full">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 sm:p-8 lg:p-10">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="flex justify-center mb-6 sm:mb-8">
              <Mail className="h-14 w-14 sm:h-16 sm:w-16 text-accent-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
              Verify Your Email
            </h1>
            <div className="mb-6 sm:mb-8">
              <p className="text-white/80 text-sm sm:text-base mb-2">{email}</p>
            </div>
          </div>

          {/* Back Button */}
          {onBack && (
            <div className="flex justify-center mb-6 sm:mb-8">
              <button
                onClick={handleBack}
                className="flex items-center text-white/70 hover:text-white transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to registration
              </button>
            </div>
          )}

          {/* Verification Message */}
          {userVerification?.message && (
            <div className="mb-6 sm:mb-8 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-sm sm:text-base">
                {userVerification.message}
              </p>
            </div>
          )}

          {/* Success Message */}
          {verificationStatus === "success" && (
            <div className="mb-6 sm:mb-8 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                <p className="text-green-200 text-sm sm:text-base">
                  Email verified successfully! Redirecting...
                </p>
              </div>
            </div>
          )}

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
            {/* OTP Input Fields */}
            <div className="flex justify-center">
              <OtpInput
                value={otp}
                onChange={handleOtpChange}
                numInputs={6}
                shouldAutoFocus={true}
                renderInput={(props) => (
                  <input
                    {...props}
                    type="text"
                    className={`w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-400/50 ${
                      verificationStatus === "error"
                        ? "border-red-500 bg-red-500/10 text-red-200"
                        : verificationStatus === "success"
                        ? "border-green-500 bg-green-500/10 text-green-200"
                        : otp.length > 0
                        ? "border-accent-400 bg-accent-400/10 text-white"
                        : "border-white/30 bg-white/5 text-white/70 hover:border-white/50"
                    }`}
                    disabled={isVerifying || verificationStatus === "success"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    onPaste={(e) => {
                      try {
                        // Prevent pasting non-numeric content
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData("text");
                        const digitsOnly = pastedData
                          .replace(/[^0-9]/g, "")
                          .slice(0, 6);
                        if (digitsOnly) {
                          setOtp(digitsOnly);
                        }
                      } catch (error) {
                        console.error("Error in paste handler:", error);
                      }
                    }}
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      textAlign: "center",
                      letterSpacing: "0.1em",
                    }}
                  />
                )}
                containerStyle="flex justify-center space-x-2 sm:space-x-3"
                placeholder=""
              />
            </div>
          </form>

          {/* Timer Display */}
          {!(otpExpiry !== null && otpExpiry <= 0) && (
            <div className="mt-8 sm:mt-10 text-center">
              <div
                className={`border rounded-lg p-3 sm:p-4 ${
                  otpExpiry !== null && otpExpiry > 0
                    ? "bg-white/5 border-white/10"
                    : otpExpiry !== null && otpExpiry <= 0
                    ? "bg-orange-500/10 border-orange-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-center text-center">
                  <div className="inline-flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-sm ${
                        otpExpiry !== null && otpExpiry > 0
                          ? "text-white/80"
                          : otpExpiry !== null && otpExpiry <= 0
                          ? "text-orange-200"
                          : "text-white/80"
                      }`}
                    >
                      {otpExpiry !== null && otpExpiry > 0 ? (
                        <>
                          Verification code will expires in{" "}
                          <span className="font-bold text-accent-400 text-base sm:text-lg">
                            {formatTime(otpExpiry)}
                          </span>
                        </>
                      ) : otpExpiry !== null && otpExpiry <= 0 ? (
                        <>
                          Time is up! Please click{" "}
                          <span className="font-bold text-orange-400 text-base sm:text-lg">
                            Resend
                          </span>
                          .
                        </>
                      ) : (
                        <span className="invisible">
                          Verification code sent to your email.
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Verify and Resend at the bottom */}
          <div className="mt-8 sm:mt-10 flex flex-row gap-3 sm:gap-4 justify-center items-center">
            {/* Verify Button */}
            <button
              onClick={handleSubmit}
              disabled={
                isVerifying ||
                verificationStatus === "success" ||
                !isValidOTP(otp) ||
                isOTPExpired()
              }
              className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-w-[100px] sm:min-w-[120px] text-sm sm:text-base ${
                isVerifying ||
                verificationStatus === "success" ||
                !isValidOTP(otp) ||
                isOTPExpired()
                  ? "bg-white/10 text-white/50 cursor-not-allowed border border-white/20"
                  : "bg-accent-600 hover:bg-accent-700 text-white border border-accent-500 hover:border-accent-400 shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              {isVerifying ? (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : verificationStatus === "success" ? (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Verified!</span>
                </div>
              ) : (
                <span>Verify OTP</span>
              )}
            </button>

            {/* Resend Button */}
            <button
              onClick={handleResendOTP}
              disabled={
                isResending ||
                (userVerification?.cooldownSeconds &&
                  userVerification.cooldownSeconds > 0) ||
                !userVerification?.canResend ||
                !email ||
                !isValidEmail(email)
              }
              className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-w-[100px] sm:min-w-[120px] text-sm sm:text-base ${
                isResending ||
                (userVerification?.cooldownSeconds &&
                  userVerification.cooldownSeconds > 0) ||
                !userVerification?.canResend ||
                !email ||
                !isValidEmail(email)
                  ? "bg-white/10 text-white/50 cursor-not-allowed border border-white/20"
                  : "bg-orange-600 hover:bg-orange-700 text-white border border-orange-500 hover:border-orange-400 shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              {isResending ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : userVerification?.cooldownSeconds &&
                userVerification.cooldownSeconds > 0 ? (
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Wait {userVerification.cooldownSeconds}s</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Resend Code</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
