import React from "react";
import { User } from "../types";
import { MapPin, Phone, Mail, Shield, CheckCircle, X } from "lucide-react";

interface ProfileViewModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const ProfileViewModal: React.FC<ProfileViewModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "contractor":
        return "bg-blue-100 text-blue-700";
      case "customer":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "revoke":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 xs:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto relative flex flex-col max-h-[95vh] xs:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 xs:p-4 sm:p-6 border-b border-primary-200">
          <h2 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-primary-900 truncate pr-2">
            Profile Information
          </h2>
          <button
            className="text-primary-400 hover:text-primary-600 text-xl xs:text-2xl sm:text-3xl font-bold p-1 xs:p-2 flex-shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6">
          <div className="space-y-4 xs:space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-3 xs:space-x-4 p-3 xs:p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg">
              <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex-shrink-0 overflow-hidden">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center ${
                    user.profileImage ? "hidden" : ""
                  }`}
                >
                  <span className="text-white text-sm xs:text-base sm:text-xl font-bold">
                    {user.firstName?.charAt(0)}
                    {user.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="flex items-center space-x-2 mt-1 flex-wrap">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </div>
                  {user.status === "active" && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                      <span className="text-xs xs:text-sm font-medium">
                        Active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3 xs:space-y-4">
              <h4 className="text-base xs:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Contact Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                <div className="flex items-center space-x-2 xs:space-x-3 p-2 xs:p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 xs:h-5 xs:w-5 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs xs:text-sm text-gray-600">Email</p>
                    <p
                      className="font-medium text-gray-900 text-sm xs:text-base truncate"
                      title={user.email}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center space-x-2 xs:space-x-3 p-2 xs:p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 xs:h-5 xs:w-5 text-primary-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs xs:text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900 text-sm xs:text-base">
                        {user.phone}
                      </p>
                    </div>
                  </div>
                )}

                {user.geoHome?.coordinates && (
                  <div className="flex items-center space-x-2 xs:space-x-3 p-2 xs:p-3 bg-gray-50 rounded-lg sm:col-span-2">
                    <MapPin className="h-4 w-4 xs:h-5 xs:w-5 text-primary-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs xs:text-sm text-gray-600">
                        Location
                      </p>
                      <p className="font-medium text-gray-900 text-xs xs:text-sm break-all">
                        {user.geoHome.coordinates[1].toFixed(6)},{" "}
                        {user.geoHome.coordinates[0].toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-3 xs:space-y-4">
              <h4 className="text-base xs:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Account Status
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                <div className="flex items-center space-x-2 xs:space-x-3 p-2 xs:p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-4 w-4 xs:h-5 xs:w-5 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs xs:text-sm text-gray-600">Status</p>
                    <p
                      className={`font-medium text-sm xs:text-base ${getStatusColor(
                        user.status || ""
                      )}`}
                    >
                      {user.status?.charAt(0).toUpperCase() +
                        user.status?.slice(1)}
                    </p>
                  </div>
                </div>

                {user.approval && (
                  <div className="flex items-center space-x-2 xs:space-x-3 p-2 xs:p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 xs:h-5 xs:w-5 text-primary-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs xs:text-sm text-gray-600">
                        Approval
                      </p>
                      <p className="font-medium text-gray-900 text-sm xs:text-base">
                        {user.approval === "approved"
                          ? "Approved"
                          : user.approval?.charAt(0).toUpperCase() +
                            user.approval?.slice(1)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Role-specific Information */}
            {user.role === "contractor" && user.contractor && (
              <div className="space-y-3 xs:space-y-4">
                <h4 className="text-base xs:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Business Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                  {user.contractor.companyName && (
                    <div className="p-2 xs:p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs xs:text-sm text-gray-600">
                        Company Name
                      </p>
                      <p
                        className="font-medium text-gray-900 text-sm xs:text-base truncate"
                        title={user.contractor.companyName}
                      >
                        {user.contractor.companyName}
                      </p>
                    </div>
                  )}

                  {user.contractor.license && (
                    <div className="p-2 xs:p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs xs:text-sm text-gray-600">
                        License
                      </p>
                      <p className="font-medium text-gray-900 text-sm xs:text-base">
                        {user.contractor.license}
                      </p>
                    </div>
                  )}

                  {user.contractor.services &&
                    user.contractor.services.length > 0 && (
                      <div className="p-2 xs:p-3 bg-gray-50 rounded-lg sm:col-span-2">
                        <p className="text-xs xs:text-sm text-gray-600">
                          Services
                        </p>
                        <div className="flex flex-wrap gap-1 xs:gap-2 mt-1">
                          {user.contractor.services.map((service, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {user.role === "customer" && user.customer && (
              <div className="space-y-3 xs:space-y-4">
                <h4 className="text-base xs:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Customer Information
                </h4>

                <div className="p-2 xs:p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs xs:text-sm text-gray-600">
                    Default Property Type
                  </p>
                  <p className="font-medium text-gray-900 text-sm xs:text-base capitalize">
                    {user.customer.defaultPropertyType}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 xs:p-4 sm:p-6 border-t border-primary-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 xs:px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm xs:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileViewModal;
