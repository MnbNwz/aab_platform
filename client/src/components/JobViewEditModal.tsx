import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { updateJobThunk } from "../store/thunks/jobThunks";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { useForm, Controller } from "react-hook-form";
import { showToast } from "../utils/toast";
import { X, Save, Settings } from "lucide-react";
import ConfirmModal from "./ui/ConfirmModal";
import type { Job } from "../store/slices/jobSlice";
import type { PropertyFormData } from "../store/slices/propertySlice";

interface JobViewEditModalProps {
  isOpen: boolean;
  onClose: (wasSaved?: boolean) => void;
  job: Job;
  properties?: PropertyFormData[];
}

interface JobFormInputs {
  title: string;
  description: string;
  category: string;
  estimate: string;
  property: string;
  timeline: string;
  status?: "open" | "in_progress" | "completed" | "cancelled";
}

type ConfirmModalType = "save" | "cancel" | "close";

interface ConfirmModalState {
  open: boolean;
  type: ConfirmModalType | null;
  message: string;
  title: string;
  confirmText: string;
}

const formatJobDataForForm = (job: Job): JobFormInputs => ({
  title: job.title || "",
  description: job.description || "",
  category: job.service || "",
  estimate: job.estimate ? (job.estimate / 100).toString() : "",
  property:
    typeof job.property === "string" ? job.property : job.property?._id || "",
  timeline: job.timeline?.toString() || "",
  status: job.status || "open",
});

const prepareJobUpdateData = (
  data: JobFormInputs,
  jobType: string,
  userId: string
): Record<string, any> => {
  const jobData: Record<string, any> = {
    title: data.title,
    description: data.description,
    service: data.category,
    type: jobType,
    createdBy: userId,
  };

  if (data.status) {
    jobData.status = data.status;
  }

  if (data.estimate?.trim()) {
    jobData.estimate = Math.round(parseFloat(data.estimate) * 100);
  }

  if (data.property?.trim()) {
    jobData.property = data.property;
  }

  if (data.timeline?.trim()) {
    jobData.timeline = parseInt(data.timeline);
  }

  return jobData;
};

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
  const { updateLoading, currentJob } = useSelector(
    (state: RootState) => state.job
  );

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    open: false,
    type: null,
    message: "",
    title: "",
    confirmText: "",
  });

  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";
  const displayJob = currentJob?._id === job._id ? currentJob : job;
  const jobType =
    user?.role === "customer" || user?.role === "admin" ? "regular" : "";
  const canEdit = isAdmin || displayJob.status === "open";
  const canEditStatus = isAdmin || (isCustomer && displayJob.status === "open");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<JobFormInputs>({
    defaultValues: formatJobDataForForm(displayJob),
  });

  useEffect(() => {
    if (!isInitialized && !servicesLoading) {
      dispatch(getServicesThunk());
    }
  }, [dispatch, isInitialized, servicesLoading]);

  useEffect(() => {
    if (displayJob) {
      const formData = formatJobDataForForm(displayJob);

      if (services.length > 0 && !services.includes(formData.category)) {
        formData.category = services[0];
      }

      reset(formData);
    }
  }, [displayJob, reset, services]);

  const onSubmit = async (data: JobFormInputs) => {
    if (!canEdit || !jobType) return;

    if (servicesLoading) {
      showToast.error("Services are still loading. Please wait and try again.");
      return;
    }
    if (!data.category?.trim()) {
      showToast.error("Please select a service category");
      return;
    }
    if (!data.estimate?.trim()) {
      showToast.error("Please enter an estimated budget");
      return;
    }
    if (!data.timeline?.trim()) {
      showToast.error("Please enter a timeline");
      return;
    }

    const jobData = prepareJobUpdateData(
      data,
      jobType,
      user?._id || user?.id || ""
    );

    const result = await dispatch(
      updateJobThunk({ jobId: job._id, updateData: jobData })
    );

    if (updateJobThunk.fulfilled.match(result)) {
      showToast.success("Job updated successfully!");
      onClose(true);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setConfirmModal({
        open: true,
        type: "cancel",
        title: "Discard Changes",
        message:
          "You have unsaved changes. Are you sure you want to discard them?",
        confirmText: "Yes, Discard",
      });
    } else {
      onClose(false);
    }
  };

  const handleCloseModal = () => {
    if (isDirty) {
      setConfirmModal({
        open: true,
        type: "close",
        title: "Unsaved Changes",
        message:
          "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Yes, Close",
      });
    } else {
      onClose(false);
    }
  };

  const handleConfirmAction = () => {
    setConfirmModal({
      open: false,
      type: null,
      message: "",
      title: "",
      confirmText: "",
    });
    onClose(false);
  };

  if (!isOpen || !job) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Edit Job
                    {isDirty && (
                      <span className="ml-2 text-yellow-300 text-xs sm:text-sm font-normal">
                        (Unsaved changes)
                      </span>
                    )}
                  </h2>
                  <p className="text-white text-opacity-90 text-xs sm:text-sm">
                    Update job information
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 sm:space-y-6"
            >
              {/* Title and Service Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Title */}
                <div>
                  <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
                    Title <span className="text-red-500">*</span>
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
                        type="text"
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900 placeholder-gray-500 text-sm sm:text-base"
                        placeholder="e.g., Install new kitchen cabinets"
                      />
                    )}
                  />
                  {errors.title && (
                    <span className="text-red-500 text-xs mt-1 block">
                      {errors.title.message}
                    </span>
                  )}
                </div>

                {/* Service Category */}
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
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900 text-sm sm:text-base"
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
                    <span className="text-red-500 text-xs mt-1 block">
                      {errors.category.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
                  Description <span className="text-red-500">*</span>
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
                      className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white resize-none text-primary-900 placeholder-gray-500 text-sm sm:text-base"
                      placeholder="Describe the job in detail"
                      rows={4}
                    />
                  )}
                />
                {errors.description && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {errors.description.message}
                  </span>
                )}
              </div>

              {/* Budget, Timeline, and Property */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Budget */}
                <div>
                  <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
                    Estimated Budget <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="estimate"
                    control={control}
                    rules={{
                      required: "Budget is required",
                      validate: (value) => {
                        if (!value?.trim()) return "Budget is required";
                        const num = parseFloat(value);
                        if (isNaN(num) || num <= 0)
                          return "Budget must be a positive number";
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
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-full rounded-lg pl-8 pr-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900 placeholder-gray-500 text-sm sm:text-base"
                          placeholder="5000.00"
                        />
                      </div>
                    )}
                  />
                  {errors.estimate && (
                    <span className="text-red-500 text-xs mt-1 block">
                      {errors.estimate.message}
                    </span>
                  )}
                </div>

                {/* Timeline */}
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
                        if (!value?.trim()) return "Timeline is required";
                        const num = parseInt(value);
                        if (isNaN(num) || num < 1) return "Minimum 1 day";
                        if (num > 365) return "Maximum 365 days";
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min={1}
                        max={365}
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900 placeholder-gray-500 text-sm sm:text-base"
                        placeholder="e.g., 7"
                      />
                    )}
                  />
                  {errors.timeline && (
                    <span className="text-red-500 text-xs mt-1 block">
                      {errors.timeline.message}
                    </span>
                  )}
                </div>

                {/* Property */}
                <div>
                  <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
                    Property
                  </label>
                  <Controller
                    name="property"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900 text-sm sm:text-base"
                      >
                        <option value="">Select property (optional)</option>
                        {properties
                          .filter((p) => p.isActive)
                          .map((property) => (
                            <option key={property._id} value={property._id}>
                              {property.title}
                            </option>
                          ))}
                      </select>
                    )}
                  />
                </div>
              </div>

              {canEditStatus && (
                <div className="border-t border-gray-200 pt-4 sm:pt-6">
                  <label className="block text-primary-900 font-medium mb-2 text-sm sm:text-base">
                    Job Status <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="status"
                    control={control}
                    rules={{
                      required: "Status is required",
                      validate: (value) => {
                        if (isCustomer && value !== "cancelled") {
                          return "You can only cancel this job";
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full rounded-lg px-3 py-2 border border-primary-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-primary-900 text-sm sm:text-base"
                      >
                        {isAdmin ? (
                          <>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        ) : (
                          <>
                            <option value={displayJob.status} disabled>
                              Open
                            </option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        )}
                      </select>
                    )}
                  />
                  {errors.status && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.status.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {isAdmin
                      ? "Manually change job status (Admin only)"
                      : "You can only cancel this job. Once cancelled, it cannot be reopened."}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading || !isDirty}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2 ${
                    isDirty
                      ? "bg-accent-500 text-white hover:bg-accent-600"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  {updateLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isDirty ? "Save Changes" : "No Changes"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({
            open: false,
            type: null,
            message: "",
            title: "",
            confirmText: "",
          })
        }
        confirmText={confirmModal.confirmText}
        cancelText="Go Back"
      />
    </>
  );
};

export default JobViewEditModal;
