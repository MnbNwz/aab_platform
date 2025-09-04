import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerThunk } from "../../store/thunks/authThunks";
import { clearError } from "../../store/slices/authSlice";
import type { RootState, AppDispatch } from "../../store";
import type { UserRole } from "../../types";
import {
  customerRegistrationSchema,
  contractorRegistrationSchema,
  type CustomerRegistrationData,
  type ContractorRegistrationData,
} from "../../schemas/authSchemas";

const CONTRACTOR_SPECIALTIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Appliance Repair",
  "General Maintenance",
  "Cleaning",
  "Landscaping",
  "Security Systems",
  "Pest Control",
  "Roofing",
  "Painting",
  "Flooring",
];

type FormData = CustomerRegistrationData | ContractorRegistrationData;

const SignUpForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Set up form with conditional schema based on role
  const schema = selectedRole === "contractor" 
    ? contractorRegistrationSchema 
    : customerRegistrationSchema;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<any>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
      ...(selectedRole === "contractor" && {
        businessName: "",
        licenseNumber: "",
        specialties: [],
        serviceRadius: 25,
      }),
    },
  });

  const watchedSpecialties = watch("specialties");

  // Clear form and errors when role changes
  useEffect(() => {
    reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
      ...(selectedRole === "contractor" && {
        businessName: "",
        licenseNumber: "",
        specialties: [],
        serviceRadius: 25,
      }),
    });
    dispatch(clearError());
  }, [selectedRole, reset, dispatch]);

  // Handle redirect after successful registration
  useEffect(() => {
    if (isAuthenticated && user) {      
      console.log('🎯 Registration successful, navigating to dashboard for:', user.role);
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data: any) => {
    try {
      const submitData = {
        ...data,
        role: selectedRole,
      };
      
      await dispatch(registerThunk(submitData)).unwrap();
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    const currentSpecialties = watchedSpecialties || [];
    const newSpecialties = checked
      ? [...currentSpecialties, specialty]
      : currentSpecialties.filter((s: string) => s !== specialty);
    
    setValue("specialties", newSpecialties);
  };

  const roleConfigs: Record<'customer' | 'contractor', { title: string; bgClass: string; description: string }> = {
    customer: {
      title: "Create Customer Account",
      bgClass: "bg-orange-500",
      description: "Join AAS to get access to trusted home service professionals",
    },
    contractor: {
      title: "Join as a Contractor",
      bgClass: "bg-blue-700",
      description: "Partner with AAS to grow your service business",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4">
              <span className="text-blue-800 font-bold text-xl">AAS</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Create Your Account
            </h1>
            <p className="text-white/80">Join the AAS platform today</p>
          </div>

          {/* Role Selector */}
          <div className="mb-6">
            <div className="flex rounded-lg overflow-hidden bg-white/10">
              {(["customer", "contractor"] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${ 
                    selectedRole === role
                      ? "bg-white text-blue-800"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {role === "customer" ? "Customer" : "Contractor"}
                </button>
              ))}
            </div>
          </div>

          {/* Current Role Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              {roleConfigs[selectedRole as 'customer' | 'contractor'].title}
            </h2>
            <p className="text-white/70 text-sm">
              {roleConfigs[selectedRole as 'customer' | 'contractor'].description}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  First Name *
                </label>
                <input
                  {...register("firstName")}
                  type="text"
                  className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors ${
                    errors.firstName
                      ? "border-red-400 focus:border-red-500"
                      : "border-white/20 focus:border-orange-500"
                  } focus:ring-2 focus:ring-orange-500/20`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-red-300 text-xs">
                    {String(errors.firstName.message)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Last Name *
                </label>
                <input
                  {...register("lastName")}
                  type="text"
                  className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors ${
                    errors.lastName
                      ? "border-red-400 focus:border-red-500"
                      : "border-white/20 focus:border-orange-500"
                  } focus:ring-2 focus:ring-orange-500/20`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-red-300 text-xs">
                    {String(errors.lastName.message)}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
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
                    : "border-white/20 focus:border-orange-500"
                } focus:ring-2 focus:ring-orange-500/20`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-red-300 text-xs">{String(errors.email.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Phone Number *
              </label>
              <input
                {...register("phone")}
                type="tel"
                className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors ${
                  errors.phone
                    ? "border-red-400 focus:border-red-500"
                    : "border-white/20 focus:border-orange-500"
                } focus:ring-2 focus:ring-orange-500/20`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-red-300 text-xs">{String(errors.phone.message)}</p>
              )}
            </div>

            {/* Contractor Specific Fields */}
            {selectedRole === "contractor" && (
              <>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Business Name *
                  </label>
                  <input
                    {...register("businessName" as keyof FormData)}
                    type="text"
                    className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors ${
                      errors.businessName
                        ? "border-red-400 focus:border-red-500"
                        : "border-white/20 focus:border-orange-500"
                    } focus:ring-2 focus:ring-orange-500/20`}
                    placeholder="Enter your business name"
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-red-300 text-xs">
                      {String(errors.businessName.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    License Number *
                  </label>
                  <input
                    {...register("licenseNumber" as keyof FormData)}
                    type="text"
                    className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors ${
                      errors.licenseNumber
                        ? "border-red-400 focus:border-red-500"
                        : "border-white/20 focus:border-orange-500"
                    } focus:ring-2 focus:ring-orange-500/20`}
                    placeholder="Enter your license number"
                  />
                  {errors.licenseNumber && (
                    <p className="mt-1 text-red-300 text-xs">
                      {String(errors.licenseNumber.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Service Specialties (Select all that apply) *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CONTRACTOR_SPECIALTIES.map((specialty) => (
                      <label key={specialty} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={((watchedSpecialties as string[]) || []).includes(specialty)}
                          onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                          className="h-4 w-4 text-orange-500 border-white/20 rounded focus:ring-orange-500"
                        />
                        <span className="ml-2 text-white text-sm">
                          {specialty}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.specialties && (
                    <p className="mt-1 text-red-300 text-xs">
                      {String(errors.specialties.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Service Radius (km) *
                  </label>
                  <select
                    {...register("serviceRadius" as keyof FormData, { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                    <option value={200}>200 km (Province-wide)</option>
                  </select>
                  {errors.serviceRadius && (
                    <p className="mt-1 text-red-300 text-xs">
                      {String(errors.serviceRadius.message)}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        : "border-white/20 focus:border-orange-500"
                    } focus:ring-2 focus:ring-orange-500/20`}
                    placeholder="Create password"
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

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors pr-12 ${
                      errors.confirmPassword
                        ? "border-red-400 focus:border-red-500"
                        : "border-white/20 focus:border-orange-500"
                    } focus:ring-2 focus:ring-orange-500/20`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-red-300 text-xs">
                    {String(errors.confirmPassword.message)}
                  </p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-start space-x-3">
                <input
                  {...register("termsAccepted")}
                  type="checkbox"
                  className="h-4 w-4 text-orange-500 border-white/20 rounded focus:ring-orange-500 mt-1"
                />
                <span className="text-white text-sm">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-orange-300 hover:text-orange-200 underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-orange-300 hover:text-orange-200 underline"
                  >
                    Privacy Policy
                  </Link>
                  *
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="mt-1 text-red-300 text-xs">
                  {String(errors.termsAccepted.message)}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                selectedRole === "customer"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-white/80">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-orange-300 hover:text-orange-200 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
