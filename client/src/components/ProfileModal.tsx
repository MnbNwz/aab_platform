import React, { useState } from "react";
import type { User } from "../types";

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<User>) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    approval: user.approval,
    geoHome: user.geoHome?.coordinates ? [...user.geoHome.coordinates] : [0, 0],
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleGeoChange = (idx: number, value: string) => {
    const coords = [...form.geoHome];
    coords[idx] = parseFloat(value);
    setForm({ ...form, geoHome: coords });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({
      firstName: form.firstName,
      lastName: form.lastName,
      status: form.status,
      approval: form.approval,
      geoHome: { ...user.geoHome, coordinates: form.geoHome },
    });
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
        <h2 className="text-4xl font-extrabold text-accent-500 mb-12 text-center tracking-tight">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Common fields */}
          <div>
            <label className="block text-primary-900 font-medium mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full bg-primary-100 text-primary-700 rounded-lg px-3 py-2 border border-primary-200 focus:outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-primary-900 font-medium mb-1">Phone</label>
            <input
              type="text"
              value={user.phone}
              readOnly
              className="w-full bg-primary-100 text-primary-700 rounded-lg px-3 py-2 border border-primary-200 focus:outline-none cursor-not-allowed"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-primary-900 font-medium mb-1">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => handleChange(e, "firstName")}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-primary-900 font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => handleChange(e, "lastName")}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-primary-900 font-medium mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.geoHome[1]}
                onChange={e => handleGeoChange(1, e.target.value)}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-primary-900 font-medium mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.geoHome[0]}
                onChange={e => handleGeoChange(0, e.target.value)}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-primary-900 font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => handleChange(e, "status")}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="revoke">Revoke</option>
              </select>
            </div>
            <div>
              <label className="block text-primary-900 font-medium mb-1">Approval</label>
              <select
                value={form.approval}
                onChange={e => handleChange(e, "approval")}
                className="w-full bg-white rounded-lg px-3 py-2 border border-primary-200 focus:outline-none"
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
              <label className="block text-primary-900 font-medium mb-1">Default Property Type</label>
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
            <div className="space-y-4">
              <div>
                <label className="block text-primary-900 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  value={user.contractor.companyName}
                  readOnly
                  className="w-full bg-primary-100 text-primary-700 rounded-lg px-3 py-2 border border-primary-200 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">Services</label>
                <div className="flex flex-wrap gap-2">
                  {user.contractor.services.map((service: string, idx: number) => (
                    <span key={idx} className="bg-accent-100 text-accent-700 px-3 py-1 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">License</label>
                <input
                  type="text"
                  value={user.contractor.license}
                  readOnly
                  className="w-full bg-primary-100 text-primary-700 rounded-lg px-3 py-2 border border-primary-200 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">Tax ID</label>
                <input
                  type="text"
                  value={user.contractor.taxId}
                  readOnly
                  className="w-full bg-primary-100 text-primary-700 rounded-lg px-3 py-2 border border-primary-200 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">Documents</label>
                <ul className="list-disc ml-6">
                  {user.contractor.docs.map((doc: any, idx: number) => (
                    <li key={idx}>
                      <span className="font-semibold">{doc.type}:</span> <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-accent-500 underline">View</a>
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
