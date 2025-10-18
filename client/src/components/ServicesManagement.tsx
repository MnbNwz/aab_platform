import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Check, Settings } from "lucide-react";
import { api } from "../services/apiService";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { showToast } from "../utils/toast";
import ConfirmModal from "./ui/ConfirmModal";
import type { RootState, AppDispatch } from "../store";

const ServicesManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { services, isLoading } = useSelector(
    (state: RootState) => state.services
  );
  const [localServices, setLocalServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newService, setNewService] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify([...localServices].sort()) !==
      JSON.stringify([...services].sort())
    );
  }, [localServices, services]);

  useEffect(() => {
    if (services.length === 0 && !isLoading) {
      dispatch(getServicesThunk());
    }
  }, [dispatch, isLoading, services.length]);

  useEffect(() => {
    if (services.length > 0 && localServices.length === 0) {
      setLocalServices(services);
    }
  }, [services, localServices.length]);

  const validateService = useCallback(
    (service: string): string | null => {
      if (!service.trim()) {
        return "Service name is required";
      }
      if (service.trim().length < 2) {
        return "Service name must be at least 2 characters";
      }
      if (service.trim().length > 50) {
        return "Service name must be less than 50 characters";
      }
      const trimmedService = service.trim().toLowerCase();
      if (localServices.includes(trimmedService)) {
        return "Service already exists";
      }
      return null;
    },
    [localServices]
  );

  const handleCreateService = useCallback(() => {
    const validationError = validateService(newService);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLocalServices((prev) => [...prev, newService.trim().toLowerCase()]);
    setNewService("");
  }, [newService, validateService]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewService(e.target.value);
      setError(null);
    },
    []
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleCreateService();
      }
    },
    [handleCreateService]
  );

  const handleSaveClick = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const confirmSave = useCallback(async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setError(null);

    try {
      await api.services.createServices(localServices);
      await dispatch(getServicesThunk());
      showToast.success("Services updated successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update services";
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [localServices, dispatch]);

  const cancelSave = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const handleCancel = useCallback(() => {
    setLocalServices(services);
    setError(null);
    setNewService("");
  }, [services]);

  return (
    <div className="space-y-6">
      <div className="bg-primary-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-primary-900 mb-3">
          Add New Service
        </h4>
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newService}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter service name (e.g., Plumbing, Electrical)"
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreateService}
            disabled={!newService.trim()}
            className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Add</span>
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      <div className="bg-white border border-primary-200 rounded-lg">
        <div className="px-4 py-3 border-b border-primary-200">
          <h4 className="text-sm font-medium text-primary-900">
            Current Services ({localServices.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500 mx-auto"></div>
            <p className="text-primary-500 text-sm mt-2">Loading services...</p>
          </div>
        ) : localServices.length === 0 ? (
          <div className="p-8 text-center text-primary-500">
            <Settings className="h-12 w-12 mx-auto mb-4 text-primary-300" />
            <p className="text-lg">No services found</p>
            <p className="text-sm">Add your first service above</p>
          </div>
        ) : (
          <div className="divide-y divide-primary-200">
            {localServices.map((service) => (
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
              Services can only be added, not modified or removed. Once added,
              they will be available for contractors to categorize their skills
              and for customers to find relevant contractors.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-primary-200">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={!hasChanges || isSubmitting}
          className="flex items-center space-x-2 px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Service Addition"
        message="Once saved, these services cannot be undone. Are you sure you want to add them permanently?"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmSave}
        onCancel={cancelSave}
      />
    </div>
  );
};

export default ServicesManagement;
