import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { createJobThunk } from "../store/thunks/jobThunks";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { useForm, Controller } from "react-hook-form";
import { showToast } from "../utils/toast";

interface JobCreateProps {
  properties?: any[];
  onClose?: () => void;
}

interface JobFormInputs {
  title: string;
  description: string;
  category: string;
  estimate?: string;
  property?: string;
  timeline?: string;
}

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

  // Map custom categories to valid contractor services
  const mapCategoryToService = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      // Solar and energy related
      solar: "electrical",
      insulation: "general",
      energy: "electrical",

      // Plumbing related
      plumbing: "plumbing",
      bathroom: "plumbing",
      kitchen: "general",

      // Electrical related
      electrical: "electrical",
      lighting: "electrical",
      wiring: "electrical",

      // HVAC related
      hvac: "hvac",
      heating: "hvac",
      cooling: "hvac",
      ventilation: "hvac",

      // General construction
      general: "general",
      maintenance: "general",
      repair: "general",
      renovation: "general",

      // Specific trades
      roofing: "roofing",
      carpentry: "carpentry",
      painting: "painting",
      landscaping: "landscaping",

      // Default fallback
      default: "general",
    };

    return categoryMap[category.toLowerCase()] || "general";
  };

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
    if (user.role === "admin") {
      setJobType("off_market");
    } else if (user.role === "customer") {
      setJobType("regular");
    } else if (user.role === "contractor") {
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
    if (user?.role === "contractor") {
      return;
    }

    // Prepare job data as JSON object
    const jobData: any = {
      title: data.title,
      description: data.description,
      service: mapCategoryToService(data.category), // Map category to valid contractor service
      type: jobType,
    };

    // Add optional fields only if they have values
    if (data.estimate && data.estimate.trim() !== "") {
      jobData.estimate = parseFloat(data.estimate);
    }
    if (data.property && data.property.trim() !== "") {
      jobData.property = data.property;
    }
    if (data.timeline && data.timeline.trim() !== "") {
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
            Title *
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
                className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base text-primary-900 placeholder-gray-500"
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
            Description *
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
                className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base resize-none text-primary-900 placeholder-gray-500"
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
              Service Category *
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
                >
                  <option value="">Select service category</option>
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
              Estimated Budget (USD)
            </label>
            <Controller
              name="estimate"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base text-primary-900 placeholder-gray-500"
                  type="number"
                  min={0}
                  placeholder="Optional"
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
              Timeline (Days)
            </label>
            <Controller
              name="timeline"
              control={control}
              rules={{
                validate: (value) => {
                  if (value && value.trim() !== "") {
                    const num = parseInt(value);
                    if (isNaN(num) || num < 1) return "Minimum 1 day";
                    if (num > 365) return "Maximum 365 days";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm sm:text-base text-primary-900 placeholder-gray-500"
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
