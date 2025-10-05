import React, { useState, useEffect } from "react";
import { X, CreditCard, RefreshCw } from "lucide-react";

interface AutoRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAutoRenew: boolean;
  onSave: (newValue: boolean) => void;
  isSaving?: boolean;
}

const AutoRenewalModal: React.FC<AutoRenewalModalProps> = ({
  isOpen,
  onClose,
  currentAutoRenew,
  onSave,
  isSaving = false,
}) => {
  const [autoRenewValue, setAutoRenewValue] = useState(currentAutoRenew);
  const [hasChanged, setHasChanged] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setAutoRenewValue(currentAutoRenew);
    setHasChanged(false);
  }, [currentAutoRenew]);

  // Track changes
  useEffect(() => {
    const changed = autoRenewValue !== currentAutoRenew;
    setHasChanged(changed);
  }, [autoRenewValue, currentAutoRenew]);

  const handleSave = () => {
    onSave(autoRenewValue);
  };

  const handleClose = () => {
    if (!isSaving) {
      setAutoRenewValue(currentAutoRenew);
      setHasChanged(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Auto-Renewal Settings
              </h3>
              <p className="text-sm text-gray-500">
                Manage your membership auto-renewal preference
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Current Status
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Auto-renewal is currently{" "}
                    <span
                      className={`font-semibold ${
                        currentAutoRenew ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {currentAutoRenew ? "enabled" : "disabled"}
                    </span>
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentAutoRenew
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {currentAutoRenew ? "Active" : "Inactive"}
                </div>
              </div>
            </div>

            {/* Toggle Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    Auto-Renewal
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Automatically renew your membership when it expires
                  </p>
                </div>
                <button
                  onClick={() => setAutoRenewValue(!autoRenewValue)}
                  disabled={isSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    autoRenewValue ? "bg-accent-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      autoRenewValue ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Placeholder Content */}
              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Auto-Renewal
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        When enabled, your membership will be automatically
                        renewed before expiration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanged || isSaving}
            className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors duration-200 flex items-center space-x-2 ${
              hasChanged && !isSaving
                ? "bg-accent-500 text-white hover:bg-accent-600 shadow-sm"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoRenewalModal;
