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
import Loader from "../ui/Loader";
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
  const [otpExpiry, setOtpExpiry] = useState(0); // OTP expiry timer
  const [otpCreatedAt, setOtpCreatedAt] = useState<Date | null>(null); // OTP creation time (used in calculateRemainingTime)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null); // Last time we synced with backend (for future debugging/analytics)

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Update timer when verification state changes
  useEffect(() => {
    if (userVerification?.cooldownSeconds !== undefined) {
      // Clear existing timer
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }

      // Start new timer if there's a cooldown
      if (userVerification.cooldownSeconds > 0) {
        startCooldownTimer(userVerification.cooldownSeconds);
      }
    }
  }, [userVerification?.cooldownSeconds]);

  // Start cooldown timer based on backend response
  const startCooldownTimer = (_seconds: number) => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setInterval(() => {
      // This will be handled by the verification state update
    }, 1000);
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // OTP validation
  const isValidOTP = (otp: string): boolean => {
    return otp.length === 6 && /^\d{6}$/.test(otp);
  };

  // Check if OTP is complete
  const isOTPComplete = otp.length === 6;

  // Calculate remaining time based on backend data
  const calculateRemainingTime = (): number => {
    if (userVerification?.otpExpiresInSeconds) {
      return Math.max(0, userVerification.otpExpiresInSeconds);
    }
    // Fallback to local calculation if backend data not available
    if (otpCreatedAt) {
      const now = new Date();
      const elapsed = Math.floor(
        (now.getTime() - otpCreatedAt.getTime()) / 1000
      );
      return Math.max(0, 600 - elapsed); // 10 minutes = 600 seconds
    }
    return 0;
  };

  // Check if OTP is expired based on backend data
  const isOTPExpired = (): boolean => {
    return calculateRemainingTime() <= 0;
  };

  // Start OTP expiry timer based on backend data
  const startOtpExpiryTimer = (createdAt?: Date) => {
    const creationTime = createdAt || new Date();
    setOtpCreatedAt(creationTime);

    const remaining = calculateRemainingTime();
    setOtpExpiry(remaining);

    if (expiryTimerRef.current) {
      clearInterval(expiryTimerRef.current);
    }

    if (remaining > 0) {
      expiryTimerRef.current = setInterval(() => {
        setOtpExpiry((prev) => {
          if (prev <= 1) {
            if (expiryTimerRef.current) {
              clearInterval(expiryTimerRef.current);
              expiryTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
      if (expiryTimerRef.current) {
        clearInterval(expiryTimerRef.current);
      }
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Start OTP expiry timer when component mounts
  useEffect(() => {
    if (email && isValidEmail(email)) {
      // Start timer with current time (will be updated by backend response)
      startOtpExpiryTimer(new Date());
    }
  }, [email]);

  // Update expiry timer when verification state changes
  useEffect(() => {
    if (
      userVerification?.message &&
      userVerification.message.includes("expires in 10 minutes")
    ) {
      // Reset timer with new creation time when new OTP is sent
      startOtpExpiryTimer(new Date());
    }
  }, [userVerification?.message]);

  // Consolidated timer and sync management
  useEffect(() => {
    if (userVerification?.otpExpiresInSeconds !== undefined) {
      const remaining = Math.max(0, userVerification.otpExpiresInSeconds);
      setOtpExpiry(remaining);

      // Restart timer if there's time remaining
      if (remaining > 0) {
        if (expiryTimerRef.current) {
          clearInterval(expiryTimerRef.current);
        }

        expiryTimerRef.current = setInterval(() => {
          setOtpExpiry((prev) => {
            if (prev <= 1) {
              if (expiryTimerRef.current) {
                clearInterval(expiryTimerRef.current);
                expiryTimerRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    // Tab visibility and focus handlers
    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        userVerification?.otpExpiresInSeconds !== undefined
      ) {
        setLastSyncTime(new Date());
        dispatch(getVerificationStateThunk({ email }));
      }
    };

    const handleFocus = () => {
      if (userVerification?.otpExpiresInSeconds !== undefined) {
        setLastSyncTime(new Date());
        dispatch(getVerificationStateThunk({ email }));
      }
    };

    // Periodic sync interval
    let syncInterval: NodeJS.Timeout | null = null;
    if (
      userVerification?.otpExpiresInSeconds !== undefined &&
      userVerification.otpExpiresInSeconds > 0
    ) {
      syncInterval = setInterval(() => {
        setLastSyncTime(new Date());
        dispatch(getVerificationStateThunk({ email }));
      }, 30000);
    }

    // Event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Debug logging
    if (lastSyncTime) {
      console.log("OTP Timer synced at:", lastSyncTime.toLocaleTimeString());
    }

    // Cleanup
    return () => {
      if (expiryTimerRef.current) {
        clearInterval(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [dispatch, email, userVerification?.otpExpiresInSeconds, lastSyncTime]);

  // Handle OTP change from library
  const handleOtpChange = (value: string) => {
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
    if (otpExpiry <= 0 || isOTPExpired()) {
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

      // Clear all timers on success
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      if (expiryTimerRef.current) {
        clearInterval(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }

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

      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <Mail className="h-12 w-12 sm:h-16 sm:w-16 text-accent-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              Verify Your Email
            </h1>
            <div className="mb-4 sm:mb-6">
              <p className="text-white/80 text-xs sm:text-sm mb-1 sm:mb-2">
                We've sent a 6-digit code to
              </p>
              <p className="text-base sm:text-lg font-semibold text-white">
                {email}
              </p>
            </div>
          </div>

          {/* Back Button */}
          {onBack && (
            <div className="flex justify-center mb-4 sm:mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-white/70 hover:text-white transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to registration
              </button>
            </div>
          )}

          {/* Error Display */}
          {(error || verificationError) && (
            <div className="mb-4 sm:mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                <p className="text-red-200 text-sm">
                  {error || verificationError}
                </p>
              </div>
            </div>
          )}

          {/* Verification Message */}
          {userVerification?.message && (
            <div className="mb-4 sm:mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-sm">
                {userVerification.message}
              </p>
            </div>
          )}

          {/* Success Message */}
          {verificationStatus === "success" && (
            <div className="mb-4 sm:mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <p className="text-green-200 text-sm">
                  Email verified successfully! Redirecting...
                </p>
              </div>
            </div>
          )}

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                      // Prevent pasting non-numeric content
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData("text");
                      const digitsOnly = pastedData
                        .replace(/[^0-9]/g, "")
                        .slice(0, 6);
                      if (digitsOnly) {
                        setOtp(digitsOnly);
                      }
                    }}
                    style={{
                      fontSize: "18px",
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

            {/* Error Messages */}
            {verificationStatus === "error" && !error && (
              <div className="text-center">
                {!email || !isValidEmail(email) ? (
                  <p className="text-red-400 text-sm">Invalid email address</p>
                ) : !isValidOTP(otp) ? (
                  <p className="text-red-400 text-sm">
                    Please enter a valid 6-digit code
                  </p>
                ) : otpExpiry <= 0 ? (
                  <p className="text-red-400 text-sm">
                    OTP has expired. Please request a new one.
                  </p>
                ) : (
                  <p className="text-red-400 text-sm">
                    Please enter a valid 6-digit code
                  </p>
                )}
              </div>
            )}

            {/* OTP Expired State */}
            {otpExpiry <= 0 &&
              userVerification &&
              !userVerification.isVerified && (
                <div className="text-center space-y-4">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-2">
                      <svg
                        className="w-6 h-6 text-red-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="text-red-400 font-semibold text-lg">
                        OTP Expired
                      </h3>
                    </div>
                    <p className="text-red-200 text-sm mb-3">
                      Your verification code has expired. Please request a new
                      one to continue.
                    </p>
                    <button
                      onClick={handleResendOTP}
                      disabled={isResending || !userVerification.canResend}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        isResending || !userVerification.canResend
                          ? "bg-white/10 text-white/50 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                    >
                      {isResending ? (
                        <div className="flex items-center justify-center">
                          <Loader size="small" color="white" />
                          <span className="ml-2">Sending...</span>
                        </div>
                      ) : (
                        "Request New OTP"
                      )}
                    </button>
                  </div>
                </div>
              )}

            {/* Submit Button - Only show when OTP is not expired */}
            {otpExpiry > 0 && (
              <button
                type="submit"
                disabled={
                  !isOTPComplete ||
                  isVerifying ||
                  verificationStatus === "success"
                }
                className={`w-full text-white font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  !isOTPComplete ||
                  isVerifying ||
                  verificationStatus === "success"
                    ? "bg-white/10 text-white/50 cursor-not-allowed"
                    : "bg-accent-600 hover:bg-accent-700 disabled:opacity-50"
                } text-sm sm:text-base`}
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center">
                    <Loader size="small" color="white" />
                    <span className="ml-2">Verifying...</span>
                  </div>
                ) : verificationStatus === "success" ? (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Verified!</span>
                  </div>
                ) : (
                  "Verify Email"
                )}
              </button>
            )}
          </form>

          {/* Resend OTP - Only show when OTP is not expired */}
          {otpExpiry > 0 && (
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-white/70 text-sm mb-2">
                Didn't receive the code?
              </p>
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
                className={`text-sm font-medium transition-colors ${
                  isResending ||
                  (userVerification?.cooldownSeconds &&
                    userVerification.cooldownSeconds > 0) ||
                  !userVerification?.canResend ||
                  !email ||
                  !isValidEmail(email)
                    ? "text-white/50 cursor-not-allowed"
                    : "text-accent-400 hover:text-accent-300"
                }`}
              >
                {isResending ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : userVerification?.cooldownSeconds &&
                  userVerification.cooldownSeconds > 0 ? (
                  <div className="flex items-center justify-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Resend in {userVerification.cooldownSeconds}s</span>
                  </div>
                ) : (
                  "Resend Code"
                )}
              </button>
            </div>
          )}

          {/* OTP Expiry Timer */}
          {otpExpiry > 0 && (
            <div className="mt-4 text-center">
              <p className="text-white/60 text-xs">
                Code expires in{" "}
                <span className="font-semibold text-accent-400">
                  {formatTime(otpExpiry)}
                </span>
              </p>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <p className="text-white/60 text-xs text-center">
              Check your email inbox and spam folder. The code will expire in 10
              minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
