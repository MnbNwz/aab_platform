import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginThunk } from "../../store/thunks/authThunks";
import { clearError } from "../../store/slices/authSlice";
import type { RootState, AppDispatch } from "../../store";
import { loginSchema, type LoginData } from "../../schemas/authSchemas";

const LoginForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to dashboard
      console.log("🎯 Navigating to dashboard for user:", user.role);
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data: LoginData) => {
    try {
      await dispatch(
        loginThunk({
          email: data.email,
          password: data.password,
          rememberMe: false,
        })
      );
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-primary-800 flex items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-10 border border-white/20">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="mx-auto h-24 w-24 mb-6 flex items-center justify-center">
              <img
                src="https://aasquebec.com/wp-content/uploads/2025/07/aasquebec-logo.svg"
                alt="AAS Quebec Logo"
                className="h-24 w-24 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Welcome Back</h1>
            <p className="text-white/80 text-lg">Sign in to your AAS account</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                {...register("email")}
                type="email"
                className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors ${
                  errors.email
                    ? "border-red-400 focus:border-red-500"
                    : "border-white/20 focus:border-accent-500"
                } focus:ring-2 focus:ring-accent-500/20`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-red-300 text-xs">
                  {String(errors.email.message)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors pr-12 ${
                    errors.password
                      ? "border-red-400 focus:border-red-500"
                      : "border-white/20 focus:border-accent-500"
                  } focus:ring-2 focus:ring-accent-500/20`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-red-300 text-xs">
                  {String(errors.password.message)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="ml-2 text-white text-sm" />
              </div>
              <Link
                to="/forgot-password"
                className="text-accent-400 hover:text-accent-300 text-sm"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/80">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-accent-400 hover:text-accent-300 font-medium"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
