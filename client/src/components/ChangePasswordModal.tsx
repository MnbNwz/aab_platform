import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import ConfirmModal from "./ui/ConfirmModal";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordChange: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordChange,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
  }>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setErrors({});
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });
      setIsUpdating(false);
      setShowConfirm(false);
    }
  }, [isOpen]);

  const validatePassword = (
    password: string
  ): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long",
      };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }
    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      };
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return {
        isValid: false,
        message:
          "Password must contain at least one special character (@$!%*?&)",
      };
    }
    return { isValid: true };
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate current password
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    // Validate new password
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else {
      const passwordValidation = validatePassword(formData.newPassword);
      if (!passwordValidation.isValid) {
        newErrors.newPassword = passwordValidation.message;
      } else if (formData.newPassword === formData.currentPassword) {
        newErrors.newPassword =
          "New password must be different from current password";
      }
    }

    // Validate confirm new password
    if (!formData.confirmNewPassword.trim()) {
      newErrors.confirmNewPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword =
        "New password and confirmation do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setShowConfirm(true);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleConfirmChange = async () => {
    setShowConfirm(false);
    setIsUpdating(true);

    try {
      await onPasswordChange(formData.currentPassword, formData.newPassword);
      // Close modal immediately after successful password change
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
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <h2 className="text-xl font-bold text-primary-900">
            Change Password
          </h2>
          <button
            className="text-primary-400 hover:text-primary-600 text-2xl font-bold"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password Input */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleInputChange("currentPassword", e.target.value)
                  }
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors placeholder-gray-300 ${
                    errors.currentPassword
                      ? "border-red-300 bg-red-50"
                      : "border-primary-300"
                  }`}
                  placeholder="Enter your current password"
                  disabled={isUpdating}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility("current")}
                  disabled={isUpdating}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-5 w-5 text-primary-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-primary-400" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password Input */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) =>
                    handleInputChange("newPassword", e.target.value)
                  }
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors placeholder-gray-300 ${
                    errors.newPassword
                      ? "border-red-300 bg-red-50"
                      : "border-primary-300"
                  }`}
                  placeholder="Enter your new password"
                  disabled={isUpdating}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility("new")}
                  disabled={isUpdating}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-5 w-5 text-primary-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-primary-400" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm New Password Input */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmNewPassword}
                  onChange={(e) =>
                    handleInputChange("confirmNewPassword", e.target.value)
                  }
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors placeholder-gray-300 ${
                    errors.confirmNewPassword
                      ? "border-red-300 bg-red-50"
                      : "border-primary-300"
                  }`}
                  placeholder="Confirm your new password"
                  disabled={isUpdating}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility("confirm")}
                  disabled={isUpdating}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-5 w-5 text-primary-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-primary-400" />
                  )}
                </button>
              </div>
              {errors.confirmNewPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmNewPassword}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                Password Requirements:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
                <li>• Contains at least one special character (@$!%*?&)</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors duration-200"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  "Change Password"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirm}
          title="Confirm Password Change"
          message="Are you sure you want to change your password? You will need to use your new password for future logins."
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

export default ChangePasswordModal;
