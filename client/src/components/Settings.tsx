import React, { useState, useMemo, useRef } from "react";
import {
  User,
  CreditCard,
  Building,
  Key,
  Heart,
  Settings as SettingsIcon,
  Camera,
} from "lucide-react";
import { User as UserType } from "../types";
import ChangeEmailModal from "./ChangeEmailModal";
import ChangePasswordModal from "./ChangePasswordModal";
import ServicesManagement from "./ServicesManagement";
import ImagePreviewModal from "./ImagePreviewModal";
import { useDispatch } from "react-redux";
import { updateProfileThunk } from "../store/thunks/userThunks";
import { showToast } from "../utils/toast";
import type { AppDispatch } from "../store";

interface SettingsProps {
  user: UserType;
  onProfileEdit?: () => void;
  onEmailChange?: (oldEmail: string, newEmail: string) => Promise<void>;
  onPasswordChange?: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  disabled?: boolean;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  description?: string;
  type: "toggle" | "select" | "input" | "button" | "info";
  value?: any;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  onClick?: () => void;
  onChange?: (value: any) => void;
}

const Settings: React.FC<SettingsProps> = ({
  user,
  onProfileEdit,
  onEmailChange,
  onPasswordChange,
}) => {
  const [activeSection, setActiveSection] = useState<string>("profile");
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [servicesManagementOpen, setServicesManagementOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    file: File;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [settings, setSettings] = useState({
    // Business settings (contractor specific)
    serviceRadius: user.role === "contractor" ? 25 : 15,
    autoRespond: user.role === "contractor" ? false : undefined,
    quoteTimeframe: user.role === "contractor" ? "24h" : undefined,
    minJobValue: user.role === "contractor" ? 100 : undefined,

    // Account settings
    autoRenewal: true,
  });

  const handleDirectChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEmailChangeLocal = async (oldEmail: string, newEmail: string) => {
    if (onEmailChange) {
      await onEmailChange(oldEmail, newEmail);
    }
  };

  const handlePasswordChangeLocal = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (onPasswordChange) {
      await onPasswordChange(currentPassword, newPassword);
    }
  };

  const handleProfilePhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Image size must be less than 5MB");
      return;
    }

    // Create preview URL and show preview modal
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage({ url: imageUrl, file });
    setImagePreviewOpen(true);
  };

  const handleImagePreviewContinue = async () => {
    if (!selectedImage) return;

    setIsUploadingPhoto(true);
    setImagePreviewOpen(false);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = e.target?.result as string;

          // Update profile with the new image
          await dispatch(
            updateProfileThunk({
              userId: user._id,
              profileData: { profileImage: base64String },
            })
          );

          // Clean up the preview URL
          URL.revokeObjectURL(selectedImage.url);
          setSelectedImage(null);
        } catch (error: any) {
          showToast.error(error.message || "Failed to update profile picture");
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(selectedImage.file);
    } catch (error: any) {
      showToast.error(error.message || "Failed to process image");
      setIsUploadingPhoto(false);
    }
  };

  const handleImagePreviewCancel = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.url);
      setSelectedImage(null);
    }
    setImagePreviewOpen(false);
  };

  const handleImagePreviewRetake = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.url);
      setSelectedImage(null);
    }
    setImagePreviewOpen(false);
    // Trigger file input again
    fileInputRef.current?.click();
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const settingsSections: SettingsSection[] = useMemo(() => {
    const baseSections: SettingsSection[] = [
      {
        id: "profile",
        title: "Profile Information",
        icon: User,
        description: "Manage your basic profile and contact information",
        items: [
          {
            id: "edit-profile",
            label: "Edit Profile",
            description: "Update your name, contact info, and basic details",
            type: "button",
            onClick: onProfileEdit,
          },
          {
            id: "profile-photo",
            label: "Profile Photo",
            description: "Upload or change your profile picture",
            type: "button",
            onClick: triggerFileUpload,
          },
        ],
      },
    ];

    // Add Services Management section for admin users
    if (user.role === "admin") {
      baseSections.push({
        id: "services",
        title: "Services Management",
        icon: SettingsIcon,
        description: "Manage available services for contractors",
        items: [
          {
            id: "manage-services",
            label: "Manage Services",
            description: "Add, edit, or remove services",
            type: "button",
            onClick: () => setServicesManagementOpen(true),
          },
        ],
      });
    }

    // Add Account & Security section for non-admin users
    if (user.role !== "admin") {
      baseSections.push({
        id: "account",
        title: "Account & Security",
        icon: Key,
        description: "Manage your account security and preferences",
        items: [
          {
            id: "change-email",
            label: "Change Email",
            description: "Update your email address",
            type: "button",
            onClick: () => setChangeEmailOpen(true),
          },
          {
            id: "change-password",
            label: "Change Password",
            description: "Update your account password",
            type: "button",
            onClick: () => setChangePasswordOpen(true),
          },
        ],
      });
    }

    // Add role-specific sections
    if (user.role === "contractor") {
      baseSections.splice(2, 0, {
        id: "business",
        title: "Business Operations",
        icon: Building,
        description: "Configure your business settings and preferences",
        items: [
          {
            id: "service-radius",
            label: "Service Radius",
            description: "Maximum distance for lead notifications (km)",
            type: "input",
            value: settings.serviceRadius,
            onChange: (value) =>
              handleDirectChange("serviceRadius", parseInt(value)),
          },
          {
            id: "auto-respond",
            label: "Auto-Respond to Leads",
            description: "Automatically send initial responses to new leads",
            type: "toggle",
            value: settings.autoRespond,
            onChange: (value) => handleDirectChange("autoRespond", value),
          },
          {
            id: "quote-timeframe",
            label: "Quote Response Time",
            description: "Default time to respond to quote requests",
            type: "select",
            value: settings.quoteTimeframe,
            options: [
              { value: "2h", label: "2 Hours" },
              { value: "24h", label: "24 Hours" },
              { value: "48h", label: "48 Hours" },
              { value: "72h", label: "72 Hours" },
            ],
            onChange: (value) => handleDirectChange("quoteTimeframe", value),
          },
          {
            id: "min-job-value",
            label: "Minimum Job Value",
            description: "Only show leads above this value ($)",
            type: "input",
            value: settings.minJobValue,
            onChange: (value) =>
              handleDirectChange("minJobValue", parseInt(value)),
          },
        ],
      });
    }

    if (user.role === "customer") {
      baseSections.splice(2, 0, {
        id: "preferences",
        title: "Service Preferences",
        icon: Heart,
        description: "Set your preferences for contractor services",
        items: [
          {
            id: "service-radius",
            label: "Search Radius",
            description:
              "Distance to search for contractors (km) - Based on your membership plan",
            type: "info",
            value: `${settings.serviceRadius} km`,
          },
          {
            id: "property-type",
            label: "Default Property Type",
            description: "Your primary property type",
            type: "info",
            value: user.customer?.defaultPropertyType || "domestic",
          },
        ],
      });
    }

    // Add membership section
    baseSections.push({
      id: "membership",
      title: "Membership & Billing",
      icon: CreditCard,
      description: "Manage your subscription and payment information",
      items: [
        {
          id: "current-plan",
          label: "Current Plan",
          description: "Your active membership tier",
          type: "info",
          value: "Standard", // This would come from user data
        },
        {
          id: "auto-renewal",
          label: "Auto-Renewal",
          description: "Automatically renew your membership",
          type: "toggle",
          value: settings.autoRenewal,
          onChange: (value) => handleDirectChange("autoRenewal", value),
        },
        {
          id: "billing-history",
          label: "Billing History",
          description: "View your payment history and receipts",
          type: "button",
          onClick: () => {},
        },
        {
          id: "payment-methods",
          label: "Payment Methods",
          description: "Manage your saved payment methods",
          type: "button",
          onClick: () => {},
        },
      ],
    });

    return baseSections;
  }, [user, settings, onProfileEdit]);

  const activeSectionData = settingsSections.find(
    (section) => section.id === activeSection
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">
            Settings
          </h1>
          <p className="mt-2 text-sm sm:text-base text-primary-600">
            Manage your account preferences and business settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const IconComponent = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() =>
                      !section.disabled && setActiveSection(section.id)
                    }
                    disabled={section.disabled}
                    className={`w-full flex items-start space-x-3 p-3 rounded-lg text-left transition-colors duration-200 ${
                      section.disabled
                        ? "opacity-50 cursor-not-allowed text-primary-400"
                        : isActive
                        ? "bg-primary-100 text-primary-900 border border-primary-200"
                        : "text-primary-700 hover:bg-primary-50"
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="text-xs text-primary-500 mt-1">
                        {section.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-primary-200">
              {/* Section Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-primary-200">
                <div className="flex items-center space-x-3">
                  {activeSectionData && (
                    <>
                      <activeSectionData.icon className="h-6 w-6 text-primary-600" />
                      <div>
                        <h2 className="text-lg font-semibold text-primary-900">
                          {activeSectionData.title}
                        </h2>
                        <p className="text-sm text-primary-600">
                          {activeSectionData.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section Content */}
              <div className="p-4 sm:p-6">
                <div className="space-y-6">
                  {activeSectionData?.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary-900">
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-xs text-primary-600 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 flex-shrink-0">
                        {item.type === "toggle" && (
                          <button
                            onClick={() => item.onChange?.(!item.value)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              item.value ? "bg-accent-500" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                item.value ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        )}

                        {item.type === "select" && (
                          <select
                            value={item.value}
                            onChange={(e) => item.onChange?.(e.target.value)}
                            className="text-sm border border-primary-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          >
                            {item.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {item.type === "input" && (
                          <input
                            type="number"
                            value={item.value}
                            onChange={(e) => item.onChange?.(e.target.value)}
                            className="w-20 text-sm border border-primary-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          />
                        )}

                        {item.type === "button" && (
                          <button
                            onClick={item.onClick}
                            disabled={
                              item.disabled ||
                              (item.id === "profile-photo" && isUploadingPhoto)
                            }
                            className={`text-sm px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                              item.disabled ||
                              (item.id === "profile-photo" && isUploadingPhoto)
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : item.label.includes("Change")
                                ? "bg-accent-500 text-white hover:bg-accent-600 shadow-sm"
                                : "bg-accent-500 text-white hover:bg-accent-600"
                            }`}
                          >
                            {item.id === "profile-photo" && isUploadingPhoto ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Uploading...</span>
                              </>
                            ) : item.label.includes("Profile Photo") ? (
                              <>
                                <Camera className="h-4 w-4" />
                                <span>Upload Photo</span>
                              </>
                            ) : item.label.includes("Edit") ? (
                              "Edit"
                            ) : item.label.includes("Upload") ? (
                              "Upload"
                            ) : item.label.includes("Export") ? (
                              "Export"
                            ) : item.label.includes("Change") ? (
                              "Change"
                            ) : item.label.includes("View") ? (
                              "View"
                            ) : item.label.includes("Manage") ? (
                              "Manage"
                            ) : (
                              "Action"
                            )}
                          </button>
                        )}

                        {item.type === "info" && (
                          <span className="text-sm text-primary-600 font-medium">
                            {typeof item.value === "string"
                              ? item.value.charAt(0).toUpperCase() +
                                item.value.slice(1)
                              : item.value}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Email Modal */}
      <ChangeEmailModal
        isOpen={changeEmailOpen}
        onClose={() => setChangeEmailOpen(false)}
        currentEmail={user.email || ""}
        onEmailChange={handleEmailChangeLocal}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onPasswordChange={handlePasswordChangeLocal}
      />

      {/* Services Management Modal */}
      {servicesManagementOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setServicesManagementOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <ServicesManagement />
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <ImagePreviewModal
          isOpen={imagePreviewOpen}
          imageUrl={selectedImage.url}
          fileName={selectedImage.file.name}
          fileSize={selectedImage.file.size}
          onContinue={handleImagePreviewContinue}
          onCancel={handleImagePreviewCancel}
          onRetake={handleImagePreviewRetake}
          isUploading={isUploadingPhoto}
        />
      )}

      {/* Hidden file input for profile photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePhotoUpload}
        className="hidden"
      />
    </div>
  );
};

export default Settings;
