import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerThunk } from "../../store/thunks/authThunks";
import { clearError } from "../../store/slices/authSlice";
import type { RootState, AppDispatch } from "../../store";
import type { UserRole } from "../../types";
import LocationSelector from "../LocationSelector";
import {
  customerRegistrationSchema,
  contractorRegistrationSchema,
  type CustomerRegistrationData,
  type ContractorRegistrationData,
} from "../../schemas/authSchemas";

const CONTRACTOR_SERVICES = [
  "plumbing",
  "electrical", 
  "hvac",
  "appliance_repair",
  "general_maintenance",
  "cleaning",
  "landscaping",
  "security_systems",
  "pest_control",
  "roofing",
  "painting",
  "flooring",
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
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  }>({
    lat: 40.730610,
    lng: -73.935242,
    address: "New York, NY"
  });

  // Set up form with conditional schema based on role
  const schema =
    selectedRole === "contractor"
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
      latitude: 40.730610, // Default to NYC coordinates
      longitude: -73.935242,
      ...(selectedRole === "customer" && {
        defaultPropertyType: "domestic",
      }),
      ...(selectedRole === "contractor" && {
        companyName: "",
        license: "",
        services: [],
        taxId: "",
        serviceRadius: 25,
      }),
    },
  });

  const watchedServices = watch("services");

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
      latitude: 40.730610,
      longitude: -73.935242,
      ...(selectedRole === "customer" && {
        defaultPropertyType: "domestic",
      }),
      ...(selectedRole === "contractor" && {
        companyName: "",
        license: "",
        services: [],
        taxId: "",
        serviceRadius: 25,
      }),
    });
    dispatch(clearError());
  }, [selectedRole, reset, dispatch]);

  // Handle redirect after successful registration
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log(
        "🎯 Registration successful, navigating to dashboard for:",
        user.role
      );
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data: any) => {
    try {
      // Transform data to match exact backend API format
      const submitData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: selectedRole,
        confirmPassword: data.confirmPassword, // Keep for type compatibility
        termsAccepted: data.termsAccepted, // Keep for type compatibility
        geoHome: {
          type: "Point",
          coordinates: [selectedLocation.lng, selectedLocation.lat]
        },
        ...(selectedRole === "customer" && {
          customer: {
            defaultPropertyType: data.defaultPropertyType || "domestic"
          }
        }),
        ...(selectedRole === "contractor" && {
          contractor: {
            companyName: data.companyName,
            services: data.services || [],
            license: data.license,
            taxId: data.taxId,
            docs: [] // Will be handled separately for file uploads
          }
        })
      };

      await dispatch(registerThunk(submitData)).unwrap();
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    const currentServices = watchedServices || [];
    const newServices = checked
      ? [...currentServices, service]
      : currentServices.filter((s: string) => s !== service);

    setValue("services", newServices);
  };

  const roleConfigs: Record<
    "customer" | "contractor",
    { title: string; bgClass: string; description: string }
  > = {
    customer: {
      title: "Create Customer Account",
      bgClass: "bg-accent-500",
      description:
        "Join AAS to get access to trusted home service professionals",
    },
    contractor: {
      title: "Join as a Contractor",
      bgClass: "bg-primary-700",
      description: "Partner with AAS to grow your service business",
    },
  };

  return (
    <div className="min-h-screen bg-primary-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-10 border border-white/20">
          {/* Logo and Header */}
          <div className="text-center mb-10">
            <div className="mx-auto h-24 w-24 mb-6 flex items-center justify-center">
              <img
                src="https://aasquebec.com/wp-content/uploads/2025/07/aasquebec-logo.svg"
                alt="AAS Quebec Logo"
                className="h-24 w-24 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Create Your Account
            </h1>
            <p className="text-white/80 text-lg">Join the AAS platform today</p>
          </div>

          {/* Role Selector */}
          <div className="mb-8">
            <div className="flex rounded-lg overflow-hidden bg-white/10">
              {(["customer", "contractor"] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex-1 py-4 px-6 text-base font-medium transition-all duration-200 ${
                    selectedRole === role
                      ? "bg-white text-primary-900"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {role === "customer" ? "Customer" : "Contractor"}
                </button>
              ))}
            </div>
          </div>

          {/* Current Role Title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">
              {roleConfigs[selectedRole as "customer" | "contractor"].title}
            </h2>
            <p className="text-white/70 text-sm">
              {
                roleConfigs[selectedRole as "customer" | "contractor"]
                  .description
              }
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      : "border-white/20 focus:border-accent-500"
                  } focus:ring-2 focus:ring-accent-500/20`}
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
                      : "border-white/20 focus:border-accent-500"
                  } focus:ring-2 focus:ring-accent-500/20`}
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
                    : "border-white/20 focus:border-accent-500"
                } focus:ring-2 focus:ring-accent-500/20`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-red-300 text-xs">
                  {String(errors.email.message)}
                </p>
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
                    : "border-white/20 focus:border-accent-500"
                } focus:ring-2 focus:ring-accent-500/20`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-red-300 text-xs">
                  {String(errors.phone.message)}
                </p>
              )}
            </div>

            {/* Location Selection */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Location *
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors text-left flex items-center justify-between"
                >
                  <span>
                    {selectedLocation.address || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
                  </span>
                  <span className="text-accent-400">📍 Select Location</span>
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    {...register("latitude", { valueAsNumber: true })}
                    type="number"
                    step="any"
                    value={selectedLocation.lat}
                    readOnly
                    className="px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white text-sm"
                    placeholder="Latitude"
                  />
                  <input
                    {...register("longitude", { valueAsNumber: true })}
                    type="number"
                    step="any"
                    value={selectedLocation.lng}
                    readOnly
                    className="px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white text-sm"
                    placeholder="Longitude"
                  />
                </div>
              </div>
              {(errors.latitude || errors.longitude) && (
                <p className="mt-1 text-red-300 text-xs">
                  Location is required
                </p>
              )}
            </div>

            {/* Customer Specific Fields */}
            {selectedRole === "customer" && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Property Type *
                </label>
                <select
                  {...register("defaultPropertyType" as keyof FormData)}
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                >
                  <option value="domestic">Domestic</option>
                  <option value="commercial">Commercial</option>
                </select>
                {errors.defaultPropertyType && (
                  <p className="mt-1 text-red-300 text-xs">
                    {String(errors.defaultPropertyType.message)}
                  </p>
                )}
              </div>
            )}

            {/* Contractor Specific Fields */}
            {selectedRole === "contractor" && (
              <>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Company Name *
                  </label>
                  <input
                    {...register("companyName" as keyof FormData)}
                    type="text"
                    className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors ${
                      errors.companyName
                        ? "border-red-400 focus:border-red-500"
                        : "border-white/20 focus:border-accent-500"
                    } focus:ring-2 focus:ring-accent-500/20`}
                    placeholder="Enter your company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-red-300 text-xs">
                      {String(errors.companyName.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    License Number *
                  </label>
                  <input
                    {...register("license" as keyof FormData)}
                    type="text"
                    className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors ${
                      errors.license
                        ? "border-red-400 focus:border-red-500"
                        : "border-white/20 focus:border-accent-500"
                    } focus:ring-2 focus:ring-accent-500/20`}
                    placeholder="Enter your license number"
                  />
                  {errors.license && (
                    <p className="mt-1 text-red-300 text-xs">
                      {String(errors.license.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Tax ID *
                  </label>
                  <input
                    {...register("taxId" as keyof FormData)}
                    type="text"
                    className={`w-full px-4 py-3 rounded-lg border bg-white/10 text-white placeholder-white/60 transition-colors ${
                      errors.taxId
                        ? "border-red-400 focus:border-red-500"
                        : "border-white/20 focus:border-accent-500"
                    } focus:ring-2 focus:ring-accent-500/20`}
                    placeholder="Enter your tax ID"
                  />
                  {errors.taxId && (
                    <p className="mt-1 text-red-300 text-xs">
                      {String(errors.taxId.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Service Types (Select all that apply) *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CONTRACTOR_SERVICES.map((service) => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(
                            (watchedServices as string[]) || []
                          ).includes(service)}
                          onChange={(e) =>
                            handleServiceChange(service, e.target.checked)
                          }
                          className="h-4 w-4 text-accent-500 border-white/20 rounded focus:ring-accent-500"
                        />
                        <span className="ml-2 text-white text-sm">
                          {service.charAt(0).toUpperCase() + service.slice(1).replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.services && (
                    <p className="mt-1 text-red-300 text-xs">
                      {String(errors.services.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Service Radius (km) *
                  </label>
                  <select
                    {...register("serviceRadius" as keyof FormData, {
                      valueAsNumber: true,
                    })}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
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
                        : "border-white/20 focus:border-accent-500"
                    } focus:ring-2 focus:ring-accent-500/20`}
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
                        : "border-white/20 focus:border-accent-500"
                    } focus:ring-2 focus:ring-accent-500/20`}
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
                  className="h-4 w-4 text-accent-500 border-white/20 rounded focus:ring-accent-500 mt-1"
                />
                <span className="text-white text-sm">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-accent-400 hover:text-accent-300 underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-accent-400 hover:text-accent-300 underline"
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
                  ? "bg-accent-500 hover:bg-accent-600"
                  : "bg-primary-700 hover:bg-primary-800"
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
                className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Location Selection Modal */}
        <LocationSelector
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onLocationSelect={(location) => {
            setSelectedLocation(location);
            setValue("latitude", location.lat);
            setValue("longitude", location.lng);
          }}
          initialLocation={selectedLocation}
        />
      </div>
    </div>
  );
};

export default SignUpForm;
