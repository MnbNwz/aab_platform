import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Settings } from "lucide-react";
import { api } from "../services/apiService";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { showToast } from "../utils/toast";
import type { RootState, AppDispatch } from "../store";
import type { CreateServiceRequest } from "../types/service";
import {
  BaseModal,
  TextInput,
  NumberInput,
  TextareaInput,
  Button,
} from "./reusable";

const ServicesManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { services, isLoading } = useSelector(
    (state: RootState) => state.services
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateServiceRequest>({
    name: "",
    materialUnit: 0,
    laborUnit: 0,
    comment: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateServiceRequest, string>>
  >({});

  useEffect(() => {
    if (services.length === 0 && !isLoading) {
      dispatch(getServicesThunk());
    }
  }, [dispatch, isLoading, services.length]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof CreateServiceRequest, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Service name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Service name must be at least 2 characters";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Service name must be less than 50 characters";
    }

    if (formData.materialUnit <= 0) {
      newErrors.materialUnit = "Material unit must be greater than 0";
    }

    if (formData.laborUnit <= 0) {
      newErrors.laborUnit = "Labor unit must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (field: keyof CreateServiceRequest) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const inputValue = e.target.value;
        const value =
          field === "materialUnit" || field === "laborUnit"
            ? parseFloat(inputValue) || 0
            : inputValue;
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
      },
    [errors]
  );

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.services.createService({
        name: formData.name.trim(),
        materialUnit: formData.materialUnit,
        laborUnit: formData.laborUnit,
        comment: formData.comment.trim(),
      });

      showToast.success(response.message || "Service created successfully!");
      await dispatch(getServicesThunk());
      setShowCreateModal(false);
      setFormData({
        name: "",
        materialUnit: 0,
        laborUnit: 0,
        comment: "",
      });
      setErrors({});
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create service";
      showToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, dispatch]);

  const handleCloseModal = useCallback(() => {
    if (!isSubmitting) {
      setShowCreateModal(false);
      setFormData({
        name: "",
        materialUnit: 0,
        laborUnit: 0,
        comment: "",
      });
      setErrors({});
    }
  }, [isSubmitting]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-primary-900">
            Services Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage service categories and their pricing rates
          </p>
        </div>
        <Button
          variant="accent"
          size="md"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create New Service
        </Button>
      </div>

      <div className="bg-white border border-primary-200 rounded-lg">
        <div className="px-4 py-3 border-b border-primary-200">
          <h4 className="text-sm font-medium text-primary-900">
            Current Services ({services.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500 mx-auto"></div>
            <p className="text-primary-500 text-sm mt-2">Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center text-primary-500">
            <Settings className="h-12 w-12 mx-auto mb-4 text-primary-300" />
            <p className="text-lg">No services found</p>
            <p className="text-sm">Create your first service to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-primary-200">
            {services.map((service) => (
              <div
                key={service}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-primary-900 capitalize">
                    {service}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 mt-0.5">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800">
              About Services
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Services define the categories of work available on the platform.
              Each service includes material and labor unit rates used for
              budget calculations. Once created, services cannot be modified or
              removed.
            </p>
          </div>
        </div>
      </div>

      {/* Create Service Modal */}
      <BaseModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        title="Create New Service"
        maxWidth="2xl"
        showFooter={false}
      >
        <div className="space-y-4 sm:space-y-6">
          <TextInput
            label="Service Name"
            required
            value={formData.name}
            onChange={handleInputChange("name")}
            placeholder="e.g., Drywall Installation"
            error={errors.name}
            helperText="Enter a descriptive name for the service"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <NumberInput
              label="Material Unit"
              required
              value={formData.materialUnit || ""}
              onChange={handleInputChange("materialUnit")}
              min={0}
              step={0.1}
              placeholder="0.0"
              error={errors.materialUnit}
              helperText="Material cost per unit"
            />

            <NumberInput
              label="Labor Unit"
              required
              value={formData.laborUnit || ""}
              onChange={handleInputChange("laborUnit")}
              min={0}
              step={0.1}
              placeholder="0.0"
              error={errors.laborUnit}
              helperText="Labor cost per unit"
            />
          </div>

          <TextareaInput
            label="Comment"
            value={formData.comment}
            onChange={handleInputChange("comment")}
            placeholder="e.g., Central air conditioning"
            rows={3}
            helperText="Optional description or notes about this service"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary-200">
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Create Service
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default ServicesManagement;
