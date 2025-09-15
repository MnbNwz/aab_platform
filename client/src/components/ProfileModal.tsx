import React, { useState } from "react";
import ConfirmModal from "./ui/ConfirmModal";
import { baseUserSchema } from "../schemas/authSchemas";
import { User, UserRole } from "../types";
import { MapPin } from "lucide-react";
import LocationSelector from "./LocationSelector";
import { ProfileFormState } from "../store/slices/userSlice";

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<User>) => void;
}

const isAdmin = (role: UserRole): role is "admin" => role === "admin";
const getInputClassName = (disabled: boolean = false) =>
  `w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm sm:text-base ${
    disabled
      ? "bg-primary-100 text-primary-700 cursor-not-allowed"
      : "bg-white text-primary-900"
  }`;

const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [phoneError, setPhoneError] = useState<string>("");
  const [form, setForm] = useState<ProfileFormState & { userRole?: UserRole }>(
    () => {
      const base: ProfileFormState & { userRole?: UserRole } = {
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        approval: user.approval,
        phone: user.phone || "",
        geoHome:
          user.geoHome?.coordinates && user.geoHome.coordinates.length === 2
            ? [user.geoHome.coordinates[0], user.geoHome.coordinates[1]]
            : [0, 0],
        userRole: user.role === "admin" ? user.role : undefined,
      };

      if (user.role === "contractor" && user.contractor) {
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

      if (user.role === "customer" && user.customer) {
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
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof ProfileFormState
  ) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin(user.role)) return;
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setLoading(true);

    const updated: Partial<User> = {
      firstName: form.firstName,
      lastName: form.lastName,
      status: form.status,
      approval: form.approval,
      phone: form.phone,
      geoHome: {
        type: user.geoHome?.type || "Point",
        coordinates: [form.geoHome[0], form.geoHome[1]] as [number, number],
      },
    };
    // If admin, assign userRole
    if (user.role === "admin" && form.userRole) {
      updated.role = form.userRole;
    }

    // Add role-specific data
    if (user.role === "contractor" && form.contractor) {
      updated.contractor = {
        ...user.contractor,
        companyName: form.contractor.companyName,
        services: form.contractor.services,
        license: form.contractor.license,
        taxId: form.contractor.taxId,
        docs: user.contractor?.docs || [],
      };
    } else if (user.role === "customer" && form.customer) {
      updated.customer = {
        defaultPropertyType: form.customer.defaultPropertyType,
      };
    }

    // Validate phone using zod schema
    const phoneResult = baseUserSchema.shape.phone.safeParse(form.phone);
    if (!phoneResult.success) {
      setPhoneError(
        phoneResult.error.issues[0]?.message || "Invalid phone number"
      );
      setLoading(false);
      return;
    } else {
      setPhoneError("");
    }
    try {
      await onSave(updated);
      setLoading(false);
      onClose();
    } catch (error) {
      setLoading(false);
      // Error will be handled by the parent component
      // Don't close the modal on error
    }
  };

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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-auto relative flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-primary-200">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-900">
              Edit Profile
            </h2>
            <button
              className="text-primary-400 hover:text-primary-600 text-2xl sm:text-3xl font-bold p-2"
              onClick={onClose}
            >
              &#10005;
            </button>
          </div>
          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Common fields */}
              <div>
                <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className={getInputClassName(true)}
                />
              </div>
              <div>
                <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                  Phone
                </label>
                <input
                  type="text"
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
                  className={getInputClassName(user.role === "admin")}
                  disabled={user.role === "admin"}
                />
                {phoneError && (
                  <span className="text-accent-500 text-xs mt-1 block">
                    {phoneError}
                  </span>
                )}
              </div>
              {user.role === "admin" ? (
                <>
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      disabled
                      className={getInputClassName(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      disabled
                      className={getInputClassName(true)}
                    />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => handleChange(e, "firstName")}
                      className={getInputClassName(isAdmin(user.role))}
                      disabled={isAdmin(user.role)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => handleChange(e, "lastName")}
                      className={getInputClassName(isAdmin(user.role))}
                      disabled={isAdmin(user.role)}
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                  User Role
                </label>
                <input
                  type="text"
                  value={form.userRole || "admin"}
                  disabled
                  className={getInputClassName(true)}
                />
              </div>
              <div>
                <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                  Location
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    disabled={user.role === "admin"}
                    className={`w-full flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-primary-200 ${
                      user.role === "admin"
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-primary-50"
                    }`}
                  >
                    <span className="text-left">
                      {form.geoHome
                        ? `${form.geoHome[1].toFixed(
                            6
                          )}, ${form.geoHome[0].toFixed(6)}`
                        : "Click to update location"}
                    </span>
                    <MapPin className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Location Selector Modal */}
              <LocationSelector
                isOpen={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onLocationSelect={(location) => {
                  setForm({ ...form, geoHome: [location.lng, location.lat] });
                  setShowMapPicker(false);
                }}
              />
              {user.role === "admin" ? (
                <>
                  <div>
                    <label className="block text-primary-900 font-medium mb-1">
                      Status
                    </label>
                    <select
                      value={form.status}
                      disabled
                      className={getInputClassName(true) + " appearance-none"}
                      style={{ backgroundImage: "none" }}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="revoke">Revoke</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-primary-900 font-medium mb-1">
                      Approval
                    </label>
                    <select
                      value={form.approval}
                      disabled
                      className={getInputClassName(true) + " appearance-none"}
                      style={{ backgroundImage: "none" }}
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange(e, "status")}
                      className={getInputClassName(true) + " appearance-none"}
                      disabled
                      style={{ backgroundImage: "none" }}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="revoke">Revoke</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      Approval
                    </label>
                    <select
                      value={form.approval}
                      onChange={(e) => handleChange(e, "approval")}
                      className={getInputClassName(true) + " appearance-none"}
                      disabled
                      style={{ backgroundImage: "none" }}
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Customer specific fields */}
              {user.role === "customer" && user.customer && (
                <div>
                  <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                    Default Property Type
                  </label>
                  <input
                    type="text"
                    value={user.customer.defaultPropertyType}
                    readOnly
                    className={getInputClassName(true)}
                  />
                </div>
              )}

              {/* Contractor specific fields */}
              {user.role === "contractor" && user.contractor && (
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
                      disabled={user.role === ("admin" as UserRole)}
                      className={getInputClassName(false)}
                    />
                  </div>
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      Services
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(user.contractor.services ?? []).map((service, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-accent-100 text-accent-700 text-sm font-medium px-3 py-1 rounded-full border border-accent-200"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      License
                    </label>
                    <input
                      type="text"
                      value={
                        form.contractor?.license ??
                        user.contractor?.license ??
                        ""
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
                      className={getInputClassName(false)}
                    />
                  </div>
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={
                        form.contractor?.taxId ?? user.contractor?.taxId ?? ""
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          contractor: {
                            ...form.contractor!,
                            taxId: e.target.value,
                          },
                        })
                      }
                      disabled={user.role === ("admin" as UserRole)}
                      className={getInputClassName(isAdmin(user.role))}
                    />
                  </div>
                  <div>
                    <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                      Documents
                    </label>
                    <ul className="list-disc ml-6">
                      {user.contractor.docs.map((doc: any, idx: number) => (
                        <li key={idx}>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-500 underline"
                          >
                            View
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div className="pt-4 sm:pt-6">
                <button
                  type="submit"
                  disabled={loading || isAdmin(user.role)}
                  className={`w-full font-semibold py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base
                    ${
                      isAdmin(user.role)
                        ? "bg-primary-200 text-primary-400 cursor-not-allowed"
                        : "bg-accent-500 text-white hover:bg-accent-600"
                    }
                  `}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;
