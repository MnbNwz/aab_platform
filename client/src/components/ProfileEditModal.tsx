import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import ConfirmModal from "./ui/ConfirmModal";
import { baseUserSchema } from "../schemas/authSchemas";
import { User, UserRole } from "../types";
import { MapPin, X, Save } from "lucide-react";
import LocationSelector from "./LocationSelector";
import { ProfileFormState } from "../store/slices/userSlice";
import { useGeocoding } from "../hooks/useGeocoding";
import Loader from "./ui/Loader";
import { isAdmin, isCustomer, isContractor } from "../utils";
import { BaseModal, TextInput, SelectInput, Button, Text } from "./reusable";

// ProfileEditModalProps to include showAllFields property
interface ProfileEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<User>) => void;
  showAllFields?: boolean; // New prop to control field visibility
}
const getInputClassName = (disabled: boolean = false) =>
  `w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm sm:text-base placeholder-gray-300 ${
    disabled
      ? "bg-primary-100 text-primary-700 cursor-not-allowed"
      : "bg-white text-primary-900"
  }`;

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  showAllFields = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { services, isLoading: servicesLoading } = useSelector(
    (state: RootState) => state.services
  );

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [phoneError, setPhoneError] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [form, setForm] = useState<ProfileFormState & { userRole?: UserRole }>(
    () => {
      const base: ProfileFormState & { userRole?: UserRole } = {
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || "",
        status: user.status,
        approval: user.approval,
        geoHome:
          user.geoHome?.coordinates && user.geoHome.coordinates.length === 2
            ? [user.geoHome.coordinates[0], user.geoHome.coordinates[1]]
            : [0, 0],
        userRole: isAdmin(user.role) ? user.role : undefined,
      };

      if (isContractor(user.role) && user.contractor) {
        return {
          ...base,
          contractor: {
            companyName: user.contractor.companyName || "",
            services: user.contractor.services || [],
            license: user.contractor.license || "",
            taxId: user.contractor.taxId || "",
            docs: user.contractor.docs || [],
          },
        };
      }

      if (isCustomer(user.role) && user.customer) {
        return {
          ...base,
          customer: {
            defaultPropertyType: (user.customer.defaultPropertyType ||
              "domestic") as "domestic" | "commercial",
          },
        };
      }

      return base;
    }
  );
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch services for contractors
  useEffect(() => {
    if (isOpen && isContractor(user.role) && services.length === 0) {
      dispatch(getServicesThunk());
    }
  }, [isOpen, user.role, services.length, dispatch]);

  // Get readable address from coordinates
  const { address: locationAddress, loading: addressLoading } = useGeocoding(
    !isAdmin(user.role) && form.geoHome[0] !== 0 && form.geoHome[1] !== 0
      ? { lat: form.geoHome[1], lng: form.geoHome[0] }
      : null
  );

  // Function to check if form data has changed from original user data
  const hasFormChanged = useCallback((): boolean => {
    // Check basic identity fields (always checked)
    if (form.firstName !== user.firstName) return true;
    if (form.lastName !== user.lastName) return true;

    // Check phone only for non-admin users
    if (!isAdmin(user.role) && form.phone !== (user.phone || "")) return true;

    // Check status and approval only if showing all fields
    if (showAllFields) {
      if (form.status !== user.status) return true;
      if (form.approval !== user.approval) return true;
    }

    // Check location coordinates only for non-admin users
    if (!isAdmin(user.role)) {
      const originalCoords = user.geoHome?.coordinates;
      if (originalCoords && originalCoords.length === 2) {
        if (Math.abs(form.geoHome[0] - originalCoords[0]) > 0.000001)
          return true;
        if (Math.abs(form.geoHome[1] - originalCoords[1]) > 0.000001)
          return true;
      } else if (form.geoHome[0] !== 0 || form.geoHome[1] !== 0) {
        return true;
      }
    }

    // Check contractor specific fields
    if (isContractor(user.role) && user.contractor && form.contractor) {
      if (form.contractor.companyName !== (user.contractor.companyName || ""))
        return true;
      if (form.contractor.license !== (user.contractor.license || ""))
        return true;
      if (form.contractor.taxId !== (user.contractor.taxId || "")) return true;

      // Check services array
      const originalServices = [...(user.contractor.services || [])].sort();
      const newServices = [...(form.contractor.services || [])].sort();
      if (JSON.stringify(originalServices) !== JSON.stringify(newServices))
        return true;
    }

    // Check customer specific fields
    if (isCustomer(user.role) && user.customer && form.customer) {
      if (
        form.customer.defaultPropertyType !== user.customer.defaultPropertyType
      )
        return true;
    }

    return false;
  }, [form, user, showAllFields]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof ProfileFormState
  ) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setIsUpdating(true);

    const updated: Partial<User> = {
      firstName: form.firstName,
      lastName: form.lastName,
    };

    // Only include phone and location for non-admin users
    if (!isAdmin(user.role)) {
      updated.phone = form.phone;
      updated.geoHome = {
        type: user.geoHome?.type || "Point",
        coordinates: [form.geoHome[0], form.geoHome[1]] as [number, number],
      };
    }

    // Only include status and approval if showing all fields
    if (showAllFields) {
      updated.status = form.status;
      updated.approval = form.approval;
    }
    // If admin, assign userRole
    if (isAdmin(user.role) && form.userRole) {
      updated.role = form.userRole;
    }

    // Add role-specific data
    if (isContractor(user.role) && form.contractor) {
      updated.contractor = {
        ...user.contractor,
        companyName: form.contractor.companyName,
        services: form.contractor.services,
        license: form.contractor.license,
        taxId: form.contractor.taxId,
        docs: user.contractor?.docs || [],
      };
    } else if (isCustomer(user.role) && form.customer) {
      updated.customer = {
        defaultPropertyType: form.customer.defaultPropertyType,
      };
    }

    // Validate phone using zod schema only for non-admin users
    if (!isAdmin(user.role)) {
      const phoneResult = baseUserSchema.shape.phone.safeParse(form.phone);
      if (!phoneResult.success) {
        setPhoneError(
          phoneResult.error.issues[0]?.message || "Invalid phone number"
        );
        setIsUpdating(false);
        return;
      } else {
        setPhoneError("");
      }
    }

    try {
      await onSave(updated);
      setIsUpdating(false);
      // Clear any existing errors
      setPhoneError("");
      // Close the modal after successful save
      onClose();
    } catch (_error) {
      setIsUpdating(false);
      // Error will be handled by the parent component
      // Don't close the modal on error
    }
  };

  const modalFooter = useMemo(
    () => [
      {
        label: "Cancel",
        onClick: () => onClose(),
        variant: "secondary" as const,
        disabled: isUpdating,
        leftIcon: <X className="h-4 w-4" />,
      },
      {
        label: isUpdating
          ? "Saving..."
          : hasFormChanged()
          ? "Save Changes"
          : "No Changes Made",
        onClick: () => {
          const form = document.querySelector("form");
          if (form) {
            form.requestSubmit();
          }
        },
        variant: "primary" as const,
        disabled: isUpdating || !hasFormChanged(),
        leftIcon: <Save className="h-4 w-4" />,
      },
    ],
    [isUpdating, hasFormChanged, onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          isOpen={showConfirm}
          title="Confirm Save"
          confirmText="Confirm"
          message="Are you sure you want to save these profile changes?"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
          darkOverlay
        />
      )}
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Profile"
        maxWidth="4xl"
        footer={modalFooter}
        showFooter={true}
        closeOnOverlayClick={!isUpdating}
      >
        {/* Loading Overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
              <Text className="text-primary-700 font-medium">
                Updating profile...
              </Text>
            </div>
          </div>
        )}
        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Common fields */}
          <TextInput label="Email" value={user.email} readOnly disabled />
          {/* Phone field - hidden for admin users */}
          {user.role !== "admin" && (
            <TextInput
              label="Phone"
              value={form.phone ?? user.phone}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, phone: val });
                if (!/^[0-9]*$/.test(val)) {
                  setPhoneError("Phone number must contain only digits.");
                } else {
                  setPhoneError("");
                }
              }}
              required
              error={phoneError}
            />
          )}

          {/* First Name and Last Name - editable for all users including admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <TextInput
              label="First Name"
              value={form.firstName}
              onChange={(e) => handleChange(e, "firstName")}
              required
            />
            <TextInput
              label="Last Name"
              value={form.lastName}
              onChange={(e) => handleChange(e, "lastName")}
              required
            />
          </div>
          <TextInput label="User Role" value={user.role} disabled />
          {/* Location field - hidden for admin users */}
          {user.role !== "admin" && (
            <div>
              <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                Location
              </label>
              <div className="relative">
                <Button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  variant="secondary"
                  className="w-full flex items-center justify-between"
                  rightIcon={<MapPin className="h-5 w-5" />}
                >
                  {addressLoading ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <Text size="sm">Loading address...</Text>
                    </span>
                  ) : locationAddress ? (
                    locationAddress
                  ) : form.geoHome &&
                    (form.geoHome[0] !== 0 || form.geoHome[1] !== 0) ? (
                    `${form.geoHome[1].toFixed(4)}, ${form.geoHome[0].toFixed(
                      4
                    )}`
                  ) : (
                    "Click to update location"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Location Selector Modal */}
          <LocationSelector
            isOpen={showMapPicker}
            onClose={() => setShowMapPicker(false)}
            onLocationSelect={(location) => {
              setForm({ ...form, geoHome: [location.lng, location.lat] });
              setShowMapPicker(false);
            }}
          />

          {/* Status and Approval Fields - Only show when showAllFields is true */}
          {showAllFields &&
            (isAdmin(user.role) ? (
              <>
                <SelectInput
                  label="Status"
                  value={form.status}
                  disabled
                  options={[
                    { value: "active", label: "Active" },
                    { value: "pending", label: "Pending" },
                    { value: "revoke", label: "Revoke" },
                  ]}
                />
                <SelectInput
                  label="Approval"
                  value={form.approval}
                  disabled
                  options={[
                    { value: "approved", label: "Approved" },
                    { value: "pending", label: "Pending" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                />
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <SelectInput
                  label="Status"
                  value={form.status}
                  onChange={(e) => handleChange(e, "status")}
                  disabled
                  options={[
                    { value: "active", label: "Active" },
                    { value: "pending", label: "Pending" },
                    { value: "revoke", label: "Revoke" },
                  ]}
                />
                <SelectInput
                  label="Approval"
                  value={form.approval}
                  onChange={(e) => handleChange(e, "approval")}
                  disabled
                  options={[
                    { value: "approved", label: "Approved" },
                    { value: "pending", label: "Pending" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                />
              </div>
            ))}

          {/* Customer specific fields */}
          {isCustomer(user.role) && user.customer && (
            <SelectInput
              label="Default Property Type"
              value={
                form.customer?.defaultPropertyType ||
                user.customer?.defaultPropertyType ||
                "domestic"
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  customer: {
                    ...form.customer!,
                    defaultPropertyType: e.target.value as
                      | "domestic"
                      | "commercial",
                  },
                })
              }
              disabled={isAdmin(user.role)}
              options={[
                { value: "domestic", label: "Domestic" },
                { value: "commercial", label: "Commercial" },
              ]}
            />
          )}

          {/* Contractor specific fields */}
          {isContractor(user.role) && user.contractor && (
            <div className="space-y-4">
              <div>
                <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                  Company Name
                </label>
                <input
                  type="text"
                  value={
                    form.contractor?.companyName ??
                    user.contractor?.companyName ??
                    ""
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contractor: {
                        ...form.contractor!,
                        companyName: e.target.value,
                      },
                    })
                  }
                  disabled={isAdmin(user.role)}
                  className={getInputClassName(false)}
                />
              </div>
              <div>
                <label className="block text-primary-700 font-medium mb-3 text-sm sm:text-base">
                  Services *
                  <span className="ml-2 text-primary-600 text-xs font-normal">
                    ({form.contractor?.services?.length || 0}/{services.length}{" "}
                    selected)
                  </span>
                </label>
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-8 bg-primary-50 rounded-lg">
                    <Loader size="medium" color="accent" />
                    <span className="ml-3 text-primary-600 text-sm">
                      Loading services...
                    </span>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8 bg-primary-50 rounded-lg">
                    <p className="text-primary-500 text-sm">
                      No services available
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {services.map((service: string) => {
                      const isSelected = (
                        form.contractor?.services || []
                      ).includes(service);

                      return (
                        <label
                          key={service}
                          className={`relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-primary-500 bg-primary-50 shadow-sm"
                              : "border-primary-200 bg-white hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-sm"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-primary-500 bg-primary-500"
                                : "border-primary-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newServices = e.target.checked
                                ? [
                                    ...(form.contractor?.services || []),
                                    service,
                                  ]
                                : (form.contractor?.services || []).filter(
                                    (s) => s !== service
                                  );

                              setForm({
                                ...form,
                                contractor: {
                                  ...form.contractor!,
                                  services: newServices,
                                },
                              });
                            }}
                            className="sr-only"
                          />

                          <span
                            className={`text-sm font-medium capitalize ${
                              isSelected
                                ? "text-primary-700"
                                : "text-primary-600"
                            }`}
                          >
                            {service}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {form.contractor?.services?.length === 0 && (
                  <p className="text-red-500 text-xs mt-1">
                    Please select at least one service
                  </p>
                )}
              </div>
              <TextInput
                label="License"
                value={
                  form.contractor?.license ?? user.contractor?.license ?? ""
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    contractor: {
                      ...form.contractor!,
                      license: e.target.value,
                    },
                  })
                }
                disabled={isAdmin(user.role)}
              />
              <TextInput
                label="Tax ID"
                value={form.contractor?.taxId ?? user.contractor?.taxId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contractor: {
                      ...form.contractor!,
                      taxId: e.target.value,
                    },
                  })
                }
                disabled={isAdmin(user.role)}
              />
            </div>
          )}
        </form>
      </BaseModal>
    </>
  );
};

export default ProfileEditModal;
