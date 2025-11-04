import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ConfirmModal from "./ui/ConfirmModal";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onEmailChange: (oldEmail: string, newEmail: string) => Promise<void>;
}

const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onEmailChange,
}) => {
  const [formData, setFormData] = useState({
    oldEmail: "",
    newEmail: "",
    confirmNewEmail: "",
  });
  const [errors, setErrors] = useState<{
    oldEmail?: string;
    newEmail?: string;
    confirmNewEmail?: string;
  }>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        oldEmail: "",
        newEmail: "",
        confirmNewEmail: "",
      });
      setErrors({});
      setIsUpdating(false);
      setShowConfirm(false);
    }
  }, [isOpen]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.oldEmail.trim()) {
      newErrors.oldEmail = "Current email is required";
    } else if (formData.oldEmail !== currentEmail) {
      newErrors.oldEmail = "Current email does not match your account email";
    }

    if (!formData.newEmail.trim()) {
      newErrors.newEmail = "New email is required";
    } else if (!validateEmail(formData.newEmail)) {
      newErrors.newEmail = "Please enter a valid email address";
    } else if (formData.newEmail === currentEmail) {
      newErrors.newEmail = "New email must be different from current email";
    }

    if (!formData.confirmNewEmail.trim()) {
      newErrors.confirmNewEmail = "Please confirm your new email";
    } else if (formData.newEmail !== formData.confirmNewEmail) {
      newErrors.confirmNewEmail = "New email and confirmation do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirm(true);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleConfirmChange = async () => {
    setShowConfirm(false);
    setIsUpdating(true);

    try {
      await onEmailChange(formData.oldEmail, formData.newEmail);
      // Close modal immediately after successful email change
      onClose();
    } catch (_error) {
      // Error will be handled by parent component
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-primary-200">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-900">
            Change Email Address
          </h2>
          <button
            className="text-primary-400 hover:text-primary-600 text-2xl font-bold"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form
            id="email-change-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Old Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Current Email
              </label>
              <input
                type="email"
                value={formData.oldEmail}
                onChange={(e) => handleInputChange("oldEmail", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder-gray-300 ${
                  errors.oldEmail
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Enter your current email address"
                disabled={isUpdating}
              />
              {errors.oldEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.oldEmail}</p>
              )}
            </div>

            {/* New Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Email Address
              </label>
              <input
                type="email"
                value={formData.newEmail}
                onChange={(e) => handleInputChange("newEmail", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder-gray-300 ${
                  errors.newEmail
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Enter your new email address"
                disabled={isUpdating}
              />
              {errors.newEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.newEmail}</p>
              )}
            </div>

            {/* Confirm New Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Email Address
              </label>
              <input
                type="email"
                value={formData.confirmNewEmail}
                onChange={(e) =>
                  handleInputChange("confirmNewEmail", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder-gray-300 ${
                  errors.confirmNewEmail
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Confirm your new email address"
                disabled={isUpdating}
              />
              {errors.confirmNewEmail && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmNewEmail}
                </p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="text-yellow-600 mt-0.5">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800">
                    Email Verification Required
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    You will need to verify your new email address before it
                    becomes active. A verification email will be sent to the new
                    address.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-primary-200">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="email-change-form"
              disabled={isUpdating}
              className="px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                "Update Email"
              )}
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirm}
          title="Confirm Email Change"
          message={`Are you sure you want to change your email address to ${formData.newEmail}?`}
          confirmText="Confirm"
          cancelText="Cancel"
          onConfirm={handleConfirmChange}
          onCancel={() => setShowConfirm(false)}
          loading={isUpdating}
          darkOverlay
        />
      </div>
    </div>
  );
};

export default ChangeEmailModal;
