import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";
import { registerThunk } from "../../store/thunks/authThunks";
import { getServicesThunk } from "../../store/thunks/servicesThunks";
import { clearError } from "../../store/slices/authSlice";
import type { RootState, AppDispatch } from "../../store";
import type { UserRole } from "../../types";
import LocationSelector from "../LocationSelector";
import Loader from "../ui/Loader";
import {
  customerRegistrationSchema,
  contractorRegistrationSchema,
  type CustomerRegistrationData,
  type ContractorRegistrationData,
} from "../../schemas/authSchemas";
import { useGeocoding, useCurrentLocation } from "../../hooks/useGeocoding";
import FilePreview from "../ui/FilePreview";

type FormData = CustomerRegistrationData | ContractorRegistrationData;

const SignUpForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const {
    services,
    isLoading: servicesLoading,
    isInitialized,
  } = useSelector((state: RootState) => state.services);

  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  }>({
    lat: 40.73061,
    lng: -73.935242,
    address: "New York, NY",
  });

  // Get current location automatically
  const {
    location: currentLocation,
    loading: currentLocationLoading,
    error: currentLocationError,
  } = useCurrentLocation();

  // Get readable address from coordinates
  const { address: locationAddress, loading: addressLoading } = useGeocoding(
    selectedLocation.lat !== 0 && selectedLocation.lng !== 0
      ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
      : null
  );

  // For contractor docs
  const [contractorDocs, setContractorDocs] = useState<File[]>([]);
  const [docsError, setDocsError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  // Fetch services when switching to contractor role
  // Track if services fetch failed
  const [servicesFetchFailed, setServicesFetchFailed] = useState(false);
  useEffect(() => {
    if (
      selectedRole === "contractor" &&
      !isInitialized &&
      !servicesLoading &&
      !servicesFetchFailed
    ) {
      dispatch(getServicesThunk())
        .unwrap()
        .catch(() => setServicesFetchFailed(true));
    }
  }, [
    selectedRole,
    isInitialized,
    servicesLoading,
    servicesFetchFailed,
    dispatch,
  ]);

  // Set up form with conditional schema based on role
  const schema = useMemo(
    () =>
      selectedRole === "contractor"
        ? contractorRegistrationSchema
        : customerRegistrationSchema,
    [selectedRole]
  );

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
      latitude: 40.73061, // Default to NYC coordinates
      longitude: -73.935242,
      ...(selectedRole === "contractor" && {
        companyName: "",
        license: "",
        services: [],
        taxId: "",
      }),
    },
  });

  // Update selected location when current location is available
  useEffect(() => {
    if (currentLocation && !currentLocationError) {
      setSelectedLocation(currentLocation);
      setValue("latitude", currentLocation.lat);
      setValue("longitude", currentLocation.lng);
    }
  }, [currentLocation, currentLocationError, setValue]);

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
      latitude: 40.73061,
      longitude: -73.935242,
      ...(selectedRole === "customer" && {
        defaultPropertyType: "domestic",
      }),
      ...(selectedRole === "contractor" && {
        companyName: "",
        license: "",
        services: [],
        taxId: "",
      }),
    });
    dispatch(clearError());
  }, [selectedRole, reset, dispatch]);

  // Handle redirect after successful registration
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to dashboard - OTPVerificationGuard will handle email verification
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = useCallback(
    async (data: any) => {
      try {
        if (selectedRole === "contractor") {
          // Validate docs
          if (!contractorDocs.length) {
            setDocsError("Please upload at least one document.");
            return;
          }
          for (const file of contractorDocs) {
            if (file.size > 10 * 1024 * 1024) {
              // 10 MB
              setDocsError(`File ${file.name} exceeds 10 MB limit.`);
              return;
            }
          }
          setDocsError("");
          // Build FormData
          const formData = new FormData();
          formData.append("firstName", data.firstName);
          formData.append("lastName", data.lastName);
          formData.append("email", data.email);
          formData.append("password", data.password);
          formData.append("phone", data.phone);
          formData.append("role", selectedRole);
          formData.append("geoHome[type]", "Point");
          formData.append(
            "geoHome[coordinates][0]",
            String(selectedLocation.lng)
          );
          formData.append(
            "geoHome[coordinates][1]",
            String(selectedLocation.lat)
          );
          formData.append("contractor[companyName]", data.companyName);
          formData.append("contractor[license]", data.license);
          formData.append("contractor[taxId]", data.taxId);
          (data.services || []).forEach((service: string, idx: number) => {
            formData.append(`contractor[services][${idx}]`, service);
          });
          contractorDocs.forEach((file) => {
            formData.append("docs", file);
          });
          await dispatch(registerThunk(formData)).unwrap();
        } else {
          // Customer: normal JSON
          const submitData = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            phone: data.phone,
            role: selectedRole,
            geoHome: {
              type: "Point",
              coordinates: [selectedLocation.lng, selectedLocation.lat] as [
                number,
                number
              ],
            },
            customer: {
              defaultPropertyType: "domestic",
            },
          };
          await dispatch(registerThunk(submitData)).unwrap();
        }
      } catch (err) {
        console.error("Registration failed:", err);
      }
    },
    [selectedRole, contractorDocs, selectedLocation, dispatch]
  );

  const handleServiceChange = useCallback(
    (service: string, checked: boolean) => {
      const currentServices = watchedServices || [];
      const newServices = checked
        ? [...currentServices, service]
        : currentServices.filter((s: string) => s !== service);

      setValue("services", newServices);
    },
    [watchedServices, setValue]
  );

  // Document carousel functions
  const removeDocument = useCallback(
    (index: number) => {
      const newDocs = contractorDocs.filter((_, i) => i !== index);
      setContractorDocs(newDocs);
      setDocsError("");
      // Reset to first page if current page becomes empty
      const totalPages = Math.ceil(newDocs.length / itemsPerPage);
      if (currentPage >= totalPages && totalPages > 0) {
        setCurrentPage(totalPages - 1);
      } else if (totalPages === 0) {
        setCurrentPage(0);
      }
    },
    [contractorDocs, currentPage, itemsPerPage]
  );

  const totalPages = Math.ceil(contractorDocs.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocs = contractorDocs.slice(startIndex, endIndex);

  // Service validation - only check if services are available from backend
  const servicesError =
    selectedRole === "contractor" &&
    !servicesLoading &&
    services.length === 0 &&
    !servicesFetchFailed;

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
              <div>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-3 border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <span className="text-left">
                    {currentLocationLoading ? (
                      <span className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Getting your location...</span>
                      </span>
                    ) : addressLoading ? (
                      <span className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading address...</span>
                      </span>
                    ) : (
                      locationAddress ||
                      selectedLocation.address ||
                      `${selectedLocation.lat.toFixed(
                        4
                      )}, ${selectedLocation.lng.toFixed(4)}`
                    )}
                  </span>
                  <span className="text-accent-400">
                    <MapPin className="h-5 w-5" />
                  </span>
                </button>
                {/* Hidden inputs for form submission */}
                <input
                  type="hidden"
                  {...register("latitude", { valueAsNumber: true })}
                  value={selectedLocation.lat}
                />
                <input
                  type="hidden"
                  {...register("longitude", { valueAsNumber: true })}
                  value={selectedLocation.lng}
                />
              </div>
              {(errors.latitude || errors.longitude) && (
                <p className="mt-1 text-red-300 text-xs">
                  Location is required
                </p>
              )}
            </div>

            {/* Property Type removed for customer; always set to domestic */}

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

                {/* Docs Upload */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Upload Documents (PDF, JPG, PNG, max 10MB each) *
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setContractorDocs(files);
                      setDocsError("");
                      setCurrentPage(0);
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white file:bg-accent-500 file:text-white file:rounded file:px-3 file:py-1 [&::-webkit-input-placeholder]:opacity-0 [&::placeholder]:opacity-0 [color-scheme:dark]"
                    style={{ color: "transparent" }}
                  />
                  {docsError && (
                    <p className="mt-1 text-red-300 text-xs">{docsError}</p>
                  )}

                  {/* Document Carousel */}
                  {contractorDocs.length > 0 && (
                    <div className="mt-4">
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="mb-3">
                          <h4 className="text-white text-sm font-medium">
                            Uploaded Documents ({contractorDocs.length})
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage(Math.max(0, currentPage - 1))
                            }
                            disabled={currentPage === 0}
                            className="flex-shrink-0 p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                            {currentDocs.map((file, idx) => {
                              const globalIndex = startIndex + idx;
                              return (
                                <div
                                  key={globalIndex}
                                  className="relative bg-white/10 rounded-lg p-3 border border-white/20"
                                >
                                  <button
                                    type="button"
                                    onClick={() => removeDocument(globalIndex)}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>

                                  <div className="space-y-2">
                                    <FilePreview
                                      file={file}
                                      height="h-20"
                                      showFileName={false}
                                      showFileSize={false}
                                      showFileType={false}
                                    />

                                    <div className="text-center">
                                      <p
                                        className="text-white text-xs font-medium truncate"
                                        title={file.name}
                                      >
                                        {file.name}
                                      </p>
                                      <p className="text-white/60 text-xs">
                                        {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                        MB
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage(
                                Math.min(totalPages - 1, currentPage + 1)
                              )
                            }
                            disabled={currentPage === totalPages - 1}
                            className="flex-shrink-0 p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Service Types (Select all that apply) *
                  </label>
                  {servicesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader size="medium" color="white" />
                      <span className="ml-3 text-white">
                        Loading services...
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {services.map((service: string) => (
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
                            {service.charAt(0).toUpperCase() +
                              service.slice(1).replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {(errors.services || servicesError) && (
                    <p className="mt-1 text-red-300 text-xs">
                      {errors.services
                        ? String(errors.services.message)
                        : "No services available. Please try again later."}
                    </p>
                  )}
                </div>

                {/* Service Radius removed */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                !isValid ||
                servicesError ||
                (selectedRole === "contractor" && contractorDocs.length === 0)
              }
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader size="small" color="white" />
                  <span className="ml-2">Creating Account...</span>
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
        />
      </div>
    </div>
  );
};

export default SignUpForm;
