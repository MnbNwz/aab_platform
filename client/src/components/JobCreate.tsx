import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { createJobThunk } from "../store/thunks/jobThunks";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { useForm, Controller } from "react-hook-form";
import { showToast } from "../utils/toast";
import type { JobCreateProps } from "../types/component";
import type { JobFormInputs } from "../types/job";
import { isCustomer, isAdmin, isContractor } from "../utils";
import PropertyViewModal from "./dashboard/PropertyViewModal";
import {
  TextInput,
  TextareaInput,
  SelectInput,
  NumberInput,
  Button,
} from "./reusable";

const JobCreate: React.FC<JobCreateProps> = ({
  properties = [],
  onClose,
  initialProperty,
  initialEstimate,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    services,
    isLoading: servicesLoading,
    isInitialized,
  } = useSelector((state: RootState) => state.services);
  // Properties are passed as props from parent component
  const user = useSelector((state: RootState) => state.auth.user);
  const [jobType, setJobType] = useState<string>("");
  const [propertyViewModalOpen, setPropertyViewModalOpen] = useState(false);
  const [selectedPropertyForView, setSelectedPropertyForView] =
    useState<any>(null);

  const { createLoading, error } = useSelector((state: RootState) => state.job);

  const calculatedBudget = useMemo(() => {
    if (initialEstimate !== null && initialEstimate !== undefined) {
      return initialEstimate > 1000 ? initialEstimate / 100 : initialEstimate;
    }
    return 5000.0;
  }, [initialEstimate]);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<JobFormInputs>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      estimate: calculatedBudget.toFixed(2),
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

  // Pre-fill form when initialProperty is provided
  useEffect(() => {
    if (initialProperty && initialProperty._id) {
      setValue("property", initialProperty._id);
    }
  }, [initialProperty, setValue]);

  // Set calculated budget in form
  useEffect(() => {
    setValue("estimate", calculatedBudget.toFixed(2));
  }, [calculatedBudget, setValue]);

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
    if (
      properties.length > 0 &&
      (!data.property || data.property.trim() === "")
    ) {
      showToast.error("Please select a property");
      return;
    }
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
    // Property is now required
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
    } else if (properties.length > 0) {
      // If properties exist but none selected, this should be caught by validation
      showToast.error("Property is required");
      return;
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
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-2">
          Create Job Request
        </h2>
        <p className="text-sm text-gray-600">
          Fill in the details below to post your job request
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-6"
      >
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg text-sm shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Job Title - Full Width */}
        <Controller
          name="title"
          control={control}
          rules={{
            required: "Title is required",
            minLength: { value: 5, message: "Min 5 characters" },
            maxLength: { value: 100, message: "Max 100 characters" },
          }}
          render={({ field }) => (
            <TextInput
              {...field}
              label="Job Title"
              required
              placeholder="e.g., Kitchen Renovation"
              minLength={5}
              maxLength={100}
              error={errors.title?.message}
            />
          )}
        />

        {/* Description - Full Width */}
        <Controller
          name="description"
          control={control}
          rules={{
            required: "Description is required",
            minLength: { value: 10, message: "Min 10 characters" },
            maxLength: { value: 2000, message: "Max 2000 characters" },
          }}
          render={({ field }) => (
            <TextareaInput
              {...field}
              label="Description"
              required
              placeholder="Describe what needs to be done in detail..."
              minLength={10}
              maxLength={2000}
              rows={4}
              error={errors.description?.message}
            />
          )}
        />

        {/* Property Selection - Full Width */}
        {properties.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="block text-primary-700 font-medium text-sm sm:text-base">
                Property <span className="text-accent-500">*</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const selectedPropertyId = watch("property");
                  if (!selectedPropertyId) {
                    showToast.error("Please select a property first");
                    return;
                  }
                  const propertyToView = properties.find(
                    (p) => p._id === selectedPropertyId
                  );
                  if (propertyToView) {
                    setSelectedPropertyForView(propertyToView);
                    setPropertyViewModalOpen(true);
                  } else {
                    showToast.error("Property not found");
                  }
                }}
                disabled={!watch("property")}
                className="text-xs sm:text-sm"
              >
                View Property
              </Button>
            </div>
            <Controller
              name="property"
              control={control}
              rules={{ required: "Property is required" }}
              render={({ field }) => (
                <SelectInput
                  {...field}
                  required
                  placeholder="Select a property"
                  options={properties
                    .filter((property) => property.isActive === true)
                    .map((property) => ({
                      value: property._id || "",
                      label: `${property.title} • ${property.propertyType} • ${
                        property.bedrooms
                      }bed/${property.bathrooms}bath${
                        property.area && property.areaUnit
                          ? ` • ${property.area}${property.areaUnit}`
                          : ""
                      }`,
                    }))}
                  error={errors.property?.message}
                />
              )}
            />
          </div>
        )}

        {/* Service Category & Budget - Same Line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Controller
            name="category"
            control={control}
            rules={{ required: "Category is required" }}
            render={({ field }) => (
              <SelectInput
                {...field}
                label="Service Category"
                required
                placeholder={servicesLoading ? "Loading..." : "Select category"}
                disabled={servicesLoading}
                options={services.map((cat) => ({
                  value: cat,
                  label: cat.charAt(0).toUpperCase() + cat.slice(1),
                }))}
                error={errors.category?.message}
              />
            )}
          />

          <TextInput
            label="Estimated Budget"
            required
            value={calculatedBudget.toFixed(2)}
            readOnly
            disabled
            leftIcon={<span className="text-primary-600 font-medium">$</span>}
            helperText="Enter your estimated budget"
            inputClassName="bg-primary-50 cursor-not-allowed"
          />
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              <NumberInput
                {...field}
                label="Completion Time (Days)"
                required
                min={1}
                max={365}
                placeholder="e.g., 7"
                error={errors.timeline?.message}
              />
            )}
          />

          <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
            <p className="text-xs font-medium text-primary-900 mb-2 flex items-center gap-2">
              <svg
                className="w-3 h-3 text-accent-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Timeline Guide (in days)
            </p>
            <div className="text-xs text-primary-800 space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-accent-500 font-bold">•</span>
                <div>
                  <span className="font-semibold">1-3 days:</span> Quick fixes
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-500 font-bold">•</span>
                <div>
                  <span className="font-semibold">7-14 days:</span> Room
                  renovations
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-500 font-bold">•</span>
                <div>
                  <span className="font-semibold">30-60 days:</span> Major
                  projects
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            size="lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            fullWidth
            disabled={createLoading}
            loading={createLoading}
            size="lg"
          >
            Create Job Request
          </Button>
        </div>
      </form>

      {/* Property View Modal */}
      <PropertyViewModal
        isOpen={propertyViewModalOpen}
        onClose={() => {
          setPropertyViewModalOpen(false);
          setSelectedPropertyForView(null);
        }}
        property={selectedPropertyForView}
      />
    </div>
  );
};

export default JobCreate;
