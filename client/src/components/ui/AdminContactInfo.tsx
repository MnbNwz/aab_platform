import React from "react";
import type { User } from "../../types";

interface AdminContactInfoProps {
  adminProfiles: User[];
  primaryAdmin: User | null;
  className?: string;
  showMultipleAdmins?: boolean;
}

const AdminContactInfo: React.FC<AdminContactInfoProps> = ({
  adminProfiles,
  primaryAdmin,
  className = "",
  showMultipleAdmins = true,
}) => {
  if (!primaryAdmin && adminProfiles.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-600">
          Contact us at{" "}
          <a
            href="mailto:support@example.com"
            className="text-accent-600 hover:text-accent-700 font-medium"
          >
            support@example.com
          </a>
        </p>
      </div>
    );
  }

  const displayAdmin = primaryAdmin || adminProfiles[0];

  return (
    <div className={className}>
      <p className="text-sm text-gray-600">
        Contact us at{" "}
        <a
          href={`mailto:${displayAdmin?.email || "support@example.com"}`}
          className="text-accent-600 hover:text-accent-700 font-medium"
        >
          {displayAdmin?.email || "support@example.com"}
        </a>
      </p>
      {showMultipleAdmins && adminProfiles.length > 1 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">
            Or contact any of our {adminProfiles.length} administrators:
          </p>
          <div className="flex flex-wrap gap-2">
            {adminProfiles.slice(0, 3).map((admin, index) => (
              <a
                key={admin._id || index}
                href={`mailto:${admin.email}`}
                className="text-xs text-accent-500 hover:text-accent-600 font-medium px-2 py-1 bg-accent-50 rounded hover:bg-accent-100 transition-colors"
              >
                {admin.firstName} {admin.lastName}
              </a>
            ))}
            {adminProfiles.length > 3 && (
              <span className="text-xs text-gray-400">
                +{adminProfiles.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactInfo;
