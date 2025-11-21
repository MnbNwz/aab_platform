import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { updateJobThunk } from "../store/thunks/jobThunks";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { useForm, Controller } from "react-hook-form";
import { showToast } from "../utils/toast";
import ConfirmModal from "./ui/ConfirmModal";
import type { Job } from "../store/slices/jobSlice";
import type {
  JobViewEditModalProps,
  JobFormInputs,
  ConfirmModalState,
  JobUpdateData,
} from "../types/job";
import { X, Save } from "lucide-react";
import {
  BaseModal,
  TextInput,
  NumberInput,
  SelectInput,
  TextareaInput,
} from "./reusable";

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
): JobUpdateData => {
  const jobData: JobUpdateData = {
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

  const isAdmin = useMemo(() => user?.role === "admin", [user?.role]);
  const isCustomer = useMemo(() => user?.role === "customer", [user?.role]);
  const displayJob = useMemo(
    () => (currentJob?._id === job._id ? currentJob : job),
    [currentJob, job]
  );
  const jobType = useMemo(
    () =>
      user?.role === "customer" || user?.role === "admin" ? "regular" : "",
    [user?.role]
  );
  const canEdit = useMemo(
    () => isAdmin || displayJob.status === "open",
    [isAdmin, displayJob.status]
  );
  const canEditStatus = useMemo(
    () => isAdmin || (isCustomer && displayJob.status === "open"),
    [isAdmin, isCustomer, displayJob.status]
  );

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

  const onSubmit = useCallback(
    async (data: JobFormInputs) => {
      if (!canEdit || !jobType) return;

      if (servicesLoading) {
        showToast.error(
          "Services are still loading. Please wait and try again."
        );
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
    },
    [canEdit, jobType, servicesLoading, user, job._id, dispatch, onClose]
  );

  const handleCancel = useCallback(() => {
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
  }, [isDirty, onClose]);

  const handleCloseModal = useCallback(() => {
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
  }, [isDirty, onClose]);

  const handleConfirmAction = useCallback(() => {
    setConfirmModal({
      open: false,
      type: null,
      message: "",
      title: "",
      confirmText: "",
    });
    onClose(false);
  }, [onClose]);

  const handleSaveClick = useCallback(() => {
    const form = document.getElementById("job-edit-form") as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  }, []);

  const modalFooter = useMemo(
    () => [
      {
        label: "Cancel",
        onClick: handleCancel,
        variant: "secondary" as const,
        leftIcon: <X className="h-4 w-4" />,
      },
      {
        label: isDirty ? "Save Changes" : "No Changes",
        onClick: handleSaveClick,
        variant: "primary" as const,
        loading: updateLoading,
        disabled: !canEdit || !isDirty || updateLoading,
        type: "submit" as const,
        leftIcon: <Save className="h-4 w-4" />,
      },
    ],
    [handleCancel, handleSaveClick, isDirty, updateLoading, canEdit]
  );

  if (!isOpen || !job) return null;

  const modalTitle = `Edit Job${isDirty ? " (Unsaved changes)" : ""}`;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        title={modalTitle}
        subtitle="Update job information"
        maxWidth="4xl"
        footer={modalFooter}
        showFooter={true}
        closeOnOverlayClick={!isDirty}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-6"
          id="job-edit-form"
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
                  <TextInput
                    {...field}
                    placeholder="e.g., Install new kitchen cabinets"
                    error={errors.title?.message}
                  />
                )}
              />
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
                  <SelectInput
                    {...field}
                    disabled={servicesLoading}
                    placeholder={
                      servicesLoading
                        ? "Loading services..."
                        : "Select service category"
                    }
                    options={services.map((cat) => ({
                      value: cat,
                      label: cat.charAt(0).toUpperCase() + cat.slice(1),
                    }))}
                    error={errors.category?.message}
                  />
                )}
              />
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
                <TextareaInput
                  {...field}
                  placeholder="Describe the job in detail"
                  rows={4}
                  error={errors.description?.message}
                />
              )}
            />
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
                  <NumberInput
                    {...field}
                    min={0}
                    step={0.01}
                    leftIcon={
                      <span className="text-gray-500 font-medium">$</span>
                    }
                    error={errors.estimate?.message}
                    placeholder="5000.00"
                  />
                )}
              />
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
                  <NumberInput
                    {...field}
                    min={1}
                    max={365}
                    placeholder="e.g., 7"
                    error={errors.timeline?.message}
                  />
                )}
              />
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
                  <SelectInput
                    {...field}
                    placeholder="Select property (optional)"
                    options={properties
                      .filter((p) => p.isActive)
                      .map((property) => ({
                        value: property._id || "",
                        label: property.title,
                      }))}
                  />
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
        </form>
      </BaseModal>

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
