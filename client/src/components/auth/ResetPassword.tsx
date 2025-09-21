import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Key, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "../../services/apiService";
import { showToast } from "../../utils/toast";

// Strong password validation schema
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPassword = watch("newPassword");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      showToast.error("Invalid reset link");
      navigate("/login", { replace: true });
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams, navigate]);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) {
      showToast.error("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      await api.auth.resetPassword(token, data.newPassword);
      setIsSuccess(true);
      showToast.success("Password reset successfully!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Password reset successful! Please sign in with your new password.",
          },
        });
      }, 3000);
    } catch (error: any) {
      console.error("Reset password error:", error);

      if (error.message?.includes("Invalid or expired")) {
        setError("newPassword", {
          type: "manual",
          message:
            "This reset link is invalid or has expired. Please request a new one.",
        });
        showToast.error("Reset link expired");
      } else if (error.message?.includes("Password is too weak")) {
        setError("newPassword", {
          type: "manual",
          message: "Password is too weak. Please add more character variety.",
        });
        showToast.error("Password too weak");
      } else {
        setError("newPassword", {
          type: "manual",
          message: "Failed to reset password. Please try again.",
        });
        showToast.error("Reset failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              Password Reset Successful!
            </h2>

            <p className="text-white/80 mb-6 leading-relaxed">
              Your password has been successfully updated. You can now sign in
              with your new password.
            </p>

            <div className="bg-green-50/10 border border-green-200/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-white/70">
                🎉 <strong>Success!</strong> Redirecting you to the login page
                in a few seconds...
              </p>
            </div>

            <Link
              to="/login"
              className="block w-full py-3 px-4 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              Invalid Reset Link
            </h2>

            <p className="text-white/80 mb-6">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>

            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="block w-full py-3 px-4 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors"
              >
                Request New Reset Link
              </Link>

              <div className="text-center">
                <p className="text-white/80">
                  Go back to{" "}
                  <Link
                    to="/login"
                    className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 px-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <Key className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>

          <p className="text-white/80">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("newPassword")}
                placeholder="Enter your new password"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-colors"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-2 text-red-300 text-sm">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder="Confirm your new password"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-colors"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-red-300 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="bg-white/5 border border-white/20 rounded-lg p-3">
              <p className="text-xs text-white/70 mb-2">
                Password Requirements:
              </p>
              <div className="space-y-1 text-xs">
                <div
                  className={`flex items-center ${
                    newPassword.length >= 8 ? "text-green-300" : "text-red-300"
                  }`}
                >
                  <span className="mr-2">
                    {newPassword.length >= 8 ? "✓" : "✗"}
                  </span>
                  At least 8 characters
                </div>
                <div
                  className={`flex items-center ${
                    /[A-Z]/.test(newPassword)
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                >
                  <span className="mr-2">
                    {/[A-Z]/.test(newPassword) ? "✓" : "✗"}
                  </span>
                  One uppercase letter
                </div>
                <div
                  className={`flex items-center ${
                    /[a-z]/.test(newPassword)
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                >
                  <span className="mr-2">
                    {/[a-z]/.test(newPassword) ? "✓" : "✗"}
                  </span>
                  One lowercase letter
                </div>
                <div
                  className={`flex items-center ${
                    /[0-9]/.test(newPassword)
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                >
                  <span className="mr-2">
                    {/[0-9]/.test(newPassword) ? "✓" : "✗"}
                  </span>
                  One number
                </div>
                <div
                  className={`flex items-center ${
                    /[^A-Za-z0-9]/.test(newPassword)
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                >
                  <span className="mr-2">
                    {/[^A-Za-z0-9]/.test(newPassword) ? "✓" : "✗"}
                  </span>
                  One special character
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Resetting Password...
              </>
            ) : (
              <>
                <Key className="w-5 h-5 mr-2" />
                Reset Password
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/80">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
