import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { updateJobThunk, cancelJobThunk } from "../store/thunks/jobThunks";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { useForm, Controller } from "react-hook-form";
import { showToast } from "../utils/toast";
import { X, Edit2, Save, XCircle, Settings } from "lucide-react";

interface JobViewEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  properties?: any[];
}

interface JobFormInputs {
  title: string;
  description: string;
  category: string;
  estimate?: string;
  property?: string;
  timeline?: string;
}

const JobViewEditModal: React.FC<JobViewEditModalProps> = ({
  isOpen,
  onClose,
  job,
  properties = [],
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    services,
    isLoading: servicesLoading,
    isInitialized,
  } = useSelector((state: RootState) => state.services);
  const user = useSelector((state: RootState) => state.auth.user);
  const { updateLoading, cancelLoading } = useSelector(
    (state: RootState) => state.job
  );

  const [isEditing, setIsEditing] = useState(false);
  const [jobType, setJobType] = useState<string>("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
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

  // Map custom categories to valid contractor services
  const mapCategoryToService = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      solar: "electrical",
      insulation: "general",
      energy: "electrical",
      plumbing: "plumbing",
      bathroom: "plumbing",
      kitchen: "general",
      electrical: "electrical",
      lighting: "electrical",
      wiring: "electrical",
      hvac: "hvac",
      heating: "hvac",
      cooling: "hvac",
      ventilation: "hvac",
      general: "general",
      maintenance: "general",
      repair: "general",
      renovation: "general",
      roofing: "roofing",
      carpentry: "carpentry",
      painting: "painting",
      landscaping: "landscaping",
      default: "general",
    };
    return categoryMap[category.toLowerCase()] || "general";
  };

  // Load services on mount
  useEffect(() => {
    if (!isInitialized && !servicesLoading) {
      dispatch(getServicesThunk());
    }
  }, [dispatch, isInitialized, servicesLoading]);

  // Set job type based on user role
  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      setJobType("off_market");
    } else if (user.role === "customer") {
      setJobType("regular");
    } else {
      setJobType("");
    }
  }, [user]);

  // Reset form when job changes
  useEffect(() => {
    if (job) {
      reset({
        title: job.title || "",
        description: job.description || "",
        category: job.category || "",
        estimate: job.estimate?.toString() || "",
        property: job.property || "",
        timeline: job.timeline?.toString() || "",
      });
    }
  }, [job, reset]);

  // Set property value when job changes (for edit mode)
  useEffect(() => {
    if (job && job.property) {
      setValue("property", job.property);
    }
  }, [job, setValue]);

  // Set default category when services load
  useEffect(() => {
    if (services.length > 0 && !job?.category) {
      setValue("category", services[0]);
    }
  }, [services, setValue, job?.category]);

  if (!isOpen || !job) return null;

  const canEdit = job.status === "open";
  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";

  const onSubmit = async (data: JobFormInputs) => {
    if (!canEdit || !jobType) return;

    const jobData: any = {
      title: data.title,
      description: data.description,
      service: mapCategoryToService(data.category),
      type: jobType,
    };

    if (data.estimate && data.estimate.trim() !== "") {
      jobData.estimate = parseFloat(data.estimate);
    }
    if (data.property && data.property.trim() !== "") {
      jobData.property = data.property;
    }
    if (data.timeline && data.timeline.trim() !== "") {
      jobData.timeline = parseInt(data.timeline);
    }

    const result = await dispatch(
      updateJobThunk({ jobId: job._id, updateData: jobData })
    );
    if (updateJobThunk.fulfilled.match(result)) {
      showToast.success("Job updated successfully!");
      setIsEditing(false);
    }
  };

  const handleCancelJob = async () => {
    const result = await dispatch(cancelJobThunk(job._id));
    if (cancelJobThunk.fulfilled.match(result)) {
      showToast.success("Job cancelled successfully!");
      onClose();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "regular":
        return "bg-accent-100 text-accent-800 border-accent-200";
      case "off_market":
        return "bg-primary-100 text-primary-800 border-primary-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isEditing ? "Edit Job" : "Job Details"}
                </h2>
                <p className="text-white text-opacity-90 text-sm">
                  {isEditing
                    ? "Update job information"
                    : "View job information"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-primary-900 font-medium mb-2">
                    Title *
                  </label>
                  <Controller
                    name="title"
                    control={control}
                    rules={{
                      required: "Title is required",
                      minLength: {
                        value: 5,
                        message: "Title must be at least 5 characters",
                      },
                      maxLength: {
                        value: 100,
                        message: "Title must be less than 100 characters",
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900 placeholder-gray-500"
                        type="text"
                        required
                        placeholder="e.g., Install new kitchen cabinets"
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
                  <label className="block text-primary-900 font-medium mb-2">
                    Service Category *
                  </label>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900"
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
                </div>
              </div>

              <div>
                <label className="block text-primary-900 font-medium mb-2">
                  Description *
                </label>
                <Controller
                  name="description"
                  control={control}
                  rules={{
                    required: "Description is required",
                    minLength: {
                      value: 10,
                      message: "Description must be at least 10 characters",
                    },
                    maxLength: {
                      value: 2000,
                      message: "Description must be less than 2000 characters",
                    },
                  }}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white resize-none text-primary-900 placeholder-gray-500"
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
                  <label className="block text-primary-900 font-medium mb-2">
                    Select Property
                  </label>
                  <Controller
                    name="property"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900"
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
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-primary-900 font-medium mb-2">
                    Estimated Budget (USD)
                  </label>
                  <Controller
                    name="estimate"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900 placeholder-gray-500"
                        type="number"
                        min={0}
                        placeholder="Optional"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-primary-900 font-medium mb-2">
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
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900 placeholder-gray-500"
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
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {updateLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Job Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-xl border border-primary-200">
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">
                    Job Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-primary-700">
                        Title:
                      </span>
                      <p className="text-primary-900 font-medium">
                        {job.title}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-primary-700">
                        Service:
                      </span>
                      <p className="text-primary-900 font-medium">
                        {job.service}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-primary-700">
                        Type:
                      </span>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                          job.type
                        )}`}
                      >
                        {job.type === "regular"
                          ? "Regular Job"
                          : "Off-Market Job"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-accent-50 to-accent-100 p-6 rounded-xl border border-accent-200">
                  <h3 className="text-lg font-semibold text-accent-900 mb-4">
                    Status & Timeline
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-accent-700">
                        Status:
                      </span>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ml-2 ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)}
                      </span>
                    </div>
                    {job.timeline && (
                      <div>
                        <span className="text-sm font-medium text-accent-700">
                          Timeline:
                        </span>
                        <p className="text-accent-900 font-medium">
                          {job.timeline} days
                        </p>
                      </div>
                    )}
                    {job.estimate && (
                      <div>
                        <span className="text-sm font-medium text-accent-700">
                          Estimate:
                        </span>
                        <p className="text-accent-900 font-medium">
                          ${job.estimate.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Property Info */}
              {job.property && properties.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Associated Property
                  </h3>
                  {(() => {
                    const property = properties.find(
                      (p) => p._id === job.property
                    );
                    return property ? (
                      <div className="space-y-2">
                        <p className="text-blue-900 font-medium">
                          {property.title}
                        </p>
                        <p className="text-blue-700 text-sm">
                          {property.propertyType} • {property.bedrooms}bed/
                          {property.bathrooms}bath/{property.kitchens}kitchen
                          {property.area &&
                            property.areaUnit &&
                            ` • ${property.area}${property.areaUnit}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-blue-700">
                        Property information not available
                      </p>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                {canEdit && (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Job</span>
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={handleCancelJob}
                    disabled={cancelLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {cancelLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Cancelling...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Cancel Job</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobViewEditModal;
