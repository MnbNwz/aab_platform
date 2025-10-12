import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CheckCircle } from "lucide-react";
import { api } from "../../services/apiService";
import { showToast } from "../../utils/toast";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);

    try {
      await api.auth.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
      showToast.success("Password reset link sent to your email!");
    } catch (error: any) {
      console.error("Forgot password error:", error);

      if (error.message?.includes("verify your email")) {
        setError("email", {
          type: "manual",
          message:
            "Please verify your email address first before requesting a password reset.",
        });
        showToast.error("Email verification required");
      } else if (error.message?.includes("wait")) {
        setError("email", {
          type: "manual",
          message: "Please wait before requesting another password reset.",
        });
        showToast.error(error.message);
      } else {
        setError("email", {
          type: "manual",
          message: "Failed to send password reset email. Please try again.",
        });
        showToast.error("Failed to send reset email");
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
              Check Your Email
            </h2>

            <p className="text-white/80 mb-6 leading-relaxed">
              We've sent a password reset link to{" "}
              <strong className="text-white">{submittedEmail}</strong>
            </p>

            <div className="bg-blue-50/10 border border-blue-200/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-white/70 mb-2">
                📧 <strong>Check your email</strong> and click the reset link to
                create a new password.
              </p>
              <p className="text-xs text-yellow-300">
                <em>Don't see it? Check your spam folder.</em>
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setSubmittedEmail("");
                }}
                className="block w-full py-3 px-4 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors border border-white/30"
              >
                Send to different email
              </button>

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
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            Forgot Password?
          </h2>

          <p className="text-white/80">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-colors"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-2 text-red-300 text-sm">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Sending Reset Link...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Send Reset Link
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

        <div className="mt-6 p-4 bg-blue-50/10 border border-blue-200/20 rounded-lg">
          <p className="text-xs text-white/60 text-center">
            <strong>Note:</strong> You must have a verified email address to
            reset your password.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
