import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Trash2, Edit2, Check, X, Settings } from "lucide-react";
import { api } from "../services/apiService";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { showToast } from "../utils/toast";
import ConfirmModal from "./ui/ConfirmModal";
import type { RootState, AppDispatch } from "../store";

interface ServicesManagementProps {}

const ServicesManagement: React.FC<ServicesManagementProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { services, isLoading } = useSelector(
    (state: RootState) => state.services
  );
  const [localServices, setLocalServices] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newService, setNewService] = useState("");
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    serviceToDelete: string | null;
  }>({ isOpen: false, serviceToDelete: null });

  useEffect(() => {
    if (!services.length && !isLoading) {
      dispatch(getServicesThunk());
    }
  }, [dispatch, services.length, isLoading]);

  // Initialize local services when services are loaded
  useEffect(() => {
    if (services.length > 0 && localServices.length === 0) {
      setLocalServices([...services]);
    }
  }, [services, localServices.length]);

  // Check for changes
  useEffect(() => {
    const hasLocalChanges =
      JSON.stringify([...localServices].sort()) !==
      JSON.stringify([...services].sort());
    setHasChanges(hasLocalChanges);
  }, [localServices, services]);

  const validateService = (
    service: string,
    excludeService?: string
  ): string | null => {
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
    if (
      localServices.includes(trimmedService) &&
      trimmedService !== excludeService?.toLowerCase()
    ) {
      return "Service already exists";
    }
    return null;
  };

  const handleCreateService = () => {
    const validationError = validateService(newService);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLocalServices((prev) => [...prev, newService.trim().toLowerCase()]);
    setNewService("");
  };

  const handleUpdateService = (oldService: string) => {
    const validationError = validateService(editValue, oldService);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLocalServices((prev) =>
      prev.map((service) =>
        service === oldService ? editValue.trim().toLowerCase() : service
      )
    );
    setEditingService(null);
    setEditValue("");
  };

  const handleDeleteService = (serviceToDelete: string) => {
    setConfirmDelete({ isOpen: true, serviceToDelete });
  };

  const confirmDeleteService = () => {
    if (!confirmDelete.serviceToDelete) return;

    setError(null);
    setLocalServices((prev) =>
      prev.filter((service) => service !== confirmDelete.serviceToDelete)
    );
    setConfirmDelete({ isOpen: false, serviceToDelete: null });
  };

  const cancelDeleteService = () => {
    setConfirmDelete({ isOpen: false, serviceToDelete: null });
  };

  const startEditing = (service: string) => {
    setEditingService(service);
    setEditValue(service);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingService(null);
    setEditValue("");
    setError(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await api.services.createServices(localServices);
      await dispatch(getServicesThunk());
      showToast.success("Services updated successfully!");
    } catch (error: any) {
      setError(error.message || "Failed to update services");
      showToast.error("Failed to update services");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLocalServices([...services]);
    setError(null);
    setEditingService(null);
    setEditValue("");
    setNewService("");
  };

  return (
    <div className="space-y-6">
      {/* Add New Service */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Add New Service
        </h4>
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newService}
              onChange={(e) => {
                setNewService(e.target.value);
                setError(null);
              }}
              onKeyPress={(e) => e.key === "Enter" && handleCreateService()}
              placeholder="Enter service name (e.g., Plumbing, Electrical)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
          <button
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

      {/* Services List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">
            Current Services ({localServices.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-500 text-sm mt-2">Loading services...</p>
          </div>
        ) : localServices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No services found</p>
            <p className="text-sm">Add your first service above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {localServices.map((service, index) => (
              <div
                key={index}
                className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                {editingService === service ? (
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleUpdateService(service);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateService(service)}
                      disabled={false}
                      className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={false}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {service}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditing(service)}
                        disabled={false}
                        className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-50 transition-colors duration-200"
                        title="Edit service"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service)}
                        disabled={false}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors duration-200"
                        title="Delete service"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
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
              Services are used by contractors to categorize their skills and by
              customers to find relevant contractors. Changes will be reflected
              immediately for all users.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Always visible, Cancel always enabled, Save enabled when changes exist */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!hasChanges || isSubmitting}
          className="flex items-center space-x-2 px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Delete Service"
        message={`Are you sure you want to delete "${confirmDelete.serviceToDelete}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteService}
        onCancel={cancelDeleteService}
      />
    </div>
  );
};

export default ServicesManagement;
