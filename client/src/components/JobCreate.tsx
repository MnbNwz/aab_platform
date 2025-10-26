import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { createJobThunk } from "../store/thunks/jobThunks";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { useForm, Controller } from "react-hook-form";
import { showToast } from "../utils/toast";
import type { JobCreateProps } from "../types/component";
import type { JobFormInputs } from "../types/job";
import { isCustomer, isAdmin, isContractor } from "../utils";

const JobCreate: React.FC<JobCreateProps> = ({ properties = [], onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    services,
    isLoading: servicesLoading,
    isInitialized,
  } = useSelector((state: RootState) => state.services);
  // Properties are passed as props from parent component
  const user = useSelector((state: RootState) => state.auth.user);
  const [jobType, setJobType] = useState<string>("");

  const { createLoading, error } = useSelector((state: RootState) => state.job);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<JobFormInputs>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      estimate: "",
      property: "",
      timeline: "",
    },
  });

  useEffect(() => {
    if (!isInitialized && !servicesLoading) {
      dispatch(getServicesThunk())
        .unwrap()
        .catch(() => {});
    }
  }, [isInitialized, servicesLoading, dispatch]);

  // Properties are loaded by the parent component (JobManagementTable)
  // No need to fetch properties here

  useEffect(() => {
    if (services.length > 0) {
      setValue("category", services[0]);
    }
  }, [services, setValue]);

  useEffect(() => {
    if (!user) return;
    if (isCustomer(user.role) || isAdmin(user.role)) {
      setJobType("regular");
    } else if (isContractor(user.role)) {
      // Contractors cannot create jobs
      setJobType("");
    } else {
      setJobType("");
    }
  }, [user]);

  const onSubmit = async (data: JobFormInputs) => {
    if (!jobType) {
      return;
    }

    // Contractors cannot create jobs
    if (user && isContractor(user.role)) {
      return;
    }

    // Prevent submission if services are still loading
    if (servicesLoading) {
      showToast.error("Services are still loading. Please wait and try again.");
      return;
    }

    // Call the create function directly
    await handleConfirmCreate(data);
  };

  const handleConfirmCreate = async (data: JobFormInputs) => {
    if (!jobType) {
      return;
    }

    // Contractors cannot create jobs
    if (user && isContractor(user.role)) {
      return;
    }

    // Prevent submission if services are still loading
    if (servicesLoading) {
      showToast.error("Services are still loading. Please wait and try again.");
      return;
    }

    // Validate required fields
    if (!data.category || data.category.trim() === "") {
      showToast.error("Please select a service category");
      return;
    }
    if (!data.estimate || data.estimate.trim() === "") {
      showToast.error("Please enter an estimated budget");
      return;
    }
    if (!data.timeline || data.timeline.trim() === "") {
      showToast.error("Please enter a timeline");
      return;
    }

    // Prepare job data as JSON object
    const jobData: any = {
      title: data.title,
      description: data.description,
      service: data.category, // Send the original category as service
      type: jobType,
      createdBy: user?._id || user?.id,
    };

    // Add optional fields only if they have values
    if (
      data.estimate &&
      typeof data.estimate === "string" &&
      data.estimate.trim() !== ""
    ) {
      // Convert dollars to cents for backend (multiply by 100)
      jobData.estimate = Math.round(parseFloat(data.estimate) * 100);
    }
    if (data.property) {
      // Handle both string and object property values
      if (typeof data.property === "string" && data.property.trim() !== "") {
        jobData.property = data.property;
      } else if (
        typeof data.property === "object" &&
        data.property &&
        "_id" in data.property
      ) {
        jobData.property = (data.property as any)._id;
      }
    }
    if (
      data.timeline &&
      typeof data.timeline === "string" &&
      data.timeline.trim() !== ""
    ) {
      jobData.timeline = parseInt(data.timeline);
    }

    const result = await dispatch(createJobThunk(jobData));
    if (createJobThunk.fulfilled.match(result)) {
      showToast.success("Job request created successfully!");
      reset();
      onClose?.(); // Close the modal
    }
  };

  // Show message for contractors
  if (user?.role === "contractor") {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4">
            Access Restricted
          </h2>
          <p className="text-gray-600 text-lg">
            Contractors cannot create job requests. You can only bid on existing
            jobs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-6 text-center">
        Create Job Request
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium text-center">
            {error}
          </div>
        )}
        <div>
          <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
            Title <span className="text-red-500">*</span>
          </label>
          <Controller
            name="title"
            control={control}
            rules={{
              required: "Title is required",
              minLength: { value: 5, message: "Min 5 characters" },
              maxLength: { value: 100, message: "Max 100 characters" },
            }}
            render={({ field }) => (
              <input
                {...field}
                className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base text-primary-900 placeholder-gray-400"
                minLength={5}
                maxLength={100}
                required
                placeholder="Enter job title"
              />
            )}
          />
          {errors.title && (
            <span className="text-red-500 text-xs mt-1">
              {errors.title.message}
            </span>
          )}
        </div>
        <div>
          <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
            Description <span className="text-red-500">*</span>
          </label>
          <Controller
            name="description"
            control={control}
            rules={{
              required: "Description is required",
              minLength: { value: 10, message: "Min 10 characters" },
              maxLength: { value: 2000, message: "Max 2000 characters" },
            }}
            render={({ field }) => (
              <textarea
                {...field}
                className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base resize-none text-primary-900 placeholder-gray-400"
                minLength={10}
                maxLength={2000}
                required
                placeholder="Describe the job in detail"
                rows={4}
              />
            )}
          />
          {errors.description && (
            <span className="text-red-500 text-xs mt-1">
              {errors.description.message}
            </span>
          )}
        </div>
        {/* Property Selection */}
        {properties.length > 0 && (
          <div>
            <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
              Select Property
            </label>
            <Controller
              name="property"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base text-primary-900"
                >
                  <option value="">
                    No specific property - General job request
                  </option>
                  {properties
                    .filter((property) => property.isActive === true)
                    .map((property) => (
                      <option key={property._id} value={property._id}>
                        {property.title} | {property.propertyType} |{" "}
                        {property.bedrooms}bed/{property.bathrooms}bath/
                        {property.kitchens}kitchen
                        {property.area && property.areaUnit
                          ? ` | ${property.area}${property.areaUnit}`
                          : ""}
                      </option>
                    ))}
                </select>
              )}
            />
            <p className="text-xs text-gray-600 mt-1">
              Format: Title | Type | Rooms | Area (Only active properties shown)
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
              Service Category <span className="text-red-500">*</span>
            </label>
            <Controller
              name="category"
              control={control}
              rules={{ required: "Category is required" }}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base text-primary-900"
                  required
                  disabled={servicesLoading}
                >
                  <option value="">
                    {servicesLoading
                      ? "Loading services..."
                      : "Select service category"}
                  </option>
                  {services.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.category && (
              <span className="text-red-500 text-xs mt-1">
                {errors.category.message}
              </span>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Categories will be mapped to contractor services (e.g., "solar" →
              "electrical")
            </p>
          </div>
          <div>
            <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
              Estimated Budget <span className="text-red-500">*</span>
            </label>
            <Controller
              name="estimate"
              control={control}
              rules={{
                required: "Estimated budget is required",
                validate: (value) => {
                  if (!value || value.trim() === "") {
                    return "Estimated budget is required";
                  }
                  const num = parseFloat(value);
                  if (isNaN(num) || num <= 0) {
                    return "Budget must be a positive number";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    $
                  </span>
                  <input
                    {...field}
                    className="w-full rounded-lg pl-8 pr-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base text-primary-900 placeholder-gray-400"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="5000.00"
                  />
                </div>
              )}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter amount in dollars (will be stored in cents)
            </p>
            {errors.estimate && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.estimate.message}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
              Timeline (Days) <span className="text-red-500">*</span>
            </label>
            <Controller
              name="timeline"
              control={control}
              rules={{
                required: "Timeline is required",
                validate: (value) => {
                  if (!value || value.trim() === "") {
                    return "Timeline is required";
                  }
                  const num = parseInt(value);
                  if (isNaN(num) || num < 1) return "Minimum 1 day";
                  if (num > 365) return "Maximum 365 days";
                  return true;
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base text-primary-900 placeholder-gray-400"
                  type="number"
                  min={1}
                  max={365}
                  placeholder="e.g., 7 days"
                />
              )}
            />
            {errors.timeline && (
              <span className="text-red-500 text-xs mt-1">
                {errors.timeline.message}
              </span>
            )}
            <p className="text-xs text-gray-600 mt-1">
              How many days do you want this job to be completed in?
            </p>
          </div>
          <div className="flex items-end">
            <div className="w-full">
              <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
                Timeline Examples
              </label>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <div className="space-y-1">
                  <div>
                    • <span className="font-medium">1-3 days:</span> Quick
                    fixes, small repairs
                  </div>
                  <div>
                    • <span className="font-medium">1-2 weeks:</span> Room
                    renovations, installations
                  </div>
                  <div>
                    • <span className="font-medium">1-2 months:</span> Major
                    renovations, full projects
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={createLoading}
          className="w-full bg-accent-500 text-white font-semibold py-2 sm:py-3 rounded-lg mt-4 hover:bg-accent-600 transition-colors duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createLoading ? "Creating..." : "Create Job"}
        </button>
      </form>
    </div>
  );
};

export default JobCreate;
