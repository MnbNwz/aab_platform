import React, { useState } from "react";
import type { User } from "../types";

type ContractorFormFields = {
  companyName: string;
  phone: string;
  services: string[];
  license: string;
  taxId: string;
};

type ProfileFormState = {
  firstName: string;
  lastName: string;
  status: User["status"];
  approval: User["approval"];
  geoHome: [number, number];
} & Partial<ContractorFormFields>;

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<User>) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  console.log("user", user);
  const [form, setForm] = useState<ProfileFormState>(() => {
    const base: ProfileFormState = {
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      approval: user.approval,
      geoHome:
        user.geoHome?.coordinates && user.geoHome.coordinates.length === 2
          ? [user.geoHome.coordinates[0], user.geoHome.coordinates[1]]
          : [0, 0],
    };
    if (user.role === "contractor" && user.contractor) {
      return {
        ...base,
        companyName: user.contractor.companyName || "",
        phone: user.phone || "",
        services: user.contractor.services || [],
        license: user.contractor.license || "",
        taxId: user.contractor.taxId || "",
      };
    }
    return base;
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof ProfileFormState
  ) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleGeoChange = (idx: 0 | 1, value: string) => {
    const coords: [number, number] = [form.geoHome[0], form.geoHome[1]];
    coords[idx] = parseFloat(value);
    setForm({ ...form, geoHome: coords });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const updated: Partial<User> = {
      firstName: form.firstName,
      lastName: form.lastName,
      status: form.status,
      approval: form.approval,
      geoHome: {
        type: user.geoHome?.type || "Point",
        coordinates: [form.geoHome[0], form.geoHome[1]] as [number, number],
      },
    };
    if (user.role === "contractor" && user.contractor) {
      updated.phone = form.phone || "";
      updated.contractor = {
        ...user.contractor,
        companyName: form.companyName || "",
        services: Array.isArray(form.services) ? form.services : [],
        license: form.license || "",
        taxId: form.taxId || "",
        docs: user.contractor.docs,
      };
    }
    await onSave(updated);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-primary-50 rounded-3xl shadow-2xl w-full max-w-xl mx-4 p-12 relative">
        <button
          className="absolute top-8 right-8 text-accent-500 hover:text-accent-700 text-3xl font-bold"
          onClick={onClose}
        >
          &#10005;
        </button>
        <h2 className="text-4xl font-extrabold text-accent-500 mb-12 text-center tracking-tight">
          Edit Profile
        </h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Common fields */}
          <div>
            <label className="block text-primary-900 font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full bg-primary-100 text-primary-700 rounded-lg px-3 py-2 border border-primary-200 focus:outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-primary-900 font-medium mb-1">
              Phone
            </label>
            <input
              type="text"
              value={form.phone ?? user.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-primary-900 font-medium mb-1">
                First Name
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange(e, "firstName")}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-primary-900 font-medium mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange(e, "lastName")}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-primary-900 font-medium mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={form.geoHome[1]}
                onChange={(e) => handleGeoChange(1, e.target.value)}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-primary-900 font-medium mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={form.geoHome[0]}
                onChange={(e) => handleGeoChange(0, e.target.value)}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-primary-900 font-medium mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => handleChange(e, "status")}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none cursor-not-allowed opacity-60 appearance-none"
                disabled
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
                onChange={(e) => handleChange(e, "approval")}
                className="w-full bg-white rounded-lg px-3py-2 border border-primary-200 focus:outline-none cursor-not-allowed opacity-60 appearance-none"
                disabled
                style={{ backgroundImage: "none" }}
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Customer specific fields */}
          {user.role === "customer" && user.customer && (
            <div>
              <label className="block text-primary-900 font-medium mb-1">
                Default Property Type
              </label>
              <input
                type="text"
                value={user.customer.defaultPropertyType}
                readOnly
                className="w-full bg-primary-100 text-primary-700 rounded-lg px-3 py-2 border border-primary-200 focus:outline-none cursor-not-allowed"
              />
            </div>
          )}

          {/* Contractor specific fields */}
          {user.role === "contractor" && user.contractor && (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
              <div>
                <label className="block text-primary-900 font-medium mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.companyName ?? user.contractor.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">
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
                <label className="block text-primary-900 font-medium mb-1">
                  License
                </label>
                <input
                  type="text"
                  value={form.license ?? user.contractor.license}
                  onChange={(e) =>
                    setForm({ ...form, license: e.target.value })
                  }
                  className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">
                  Tax ID
                </label>
                <input
                  type="text"
                  value={form.taxId ?? user.contractor.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">
                  Documents
                </label>
                <ul className="list-disc ml-6">
                  {user.contractor.docs.map((doc: any, idx: number) => (
                    <li key={idx}>
                      <span className="font-semibold">{doc.type}:</span>{" "}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-500 text-white font-bold py-2 rounded-lg mt-4 hover:bg-accent-600 transition-colors"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
