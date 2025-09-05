import React from "react";
import { useSelector, useDispatch } from "react-redux";
import UserDropdown from "../ui/UserDropdown";
import { logoutThunk } from "../../store/thunks/authThunks";
import type { RootState, AppDispatch } from "../../store";

const ApprovalGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  if (user && user.status === "revoke") {
    const handleLogout = () => dispatch(logoutThunk());
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary-50 relative">
        <div className="absolute top-6 right-8">
          <UserDropdown
            user={user}
            onLogout={handleLogout}
            logoutLabel="Logout"
          />
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-red-200">
          <div className="text-4xl mb-4 text-red-500">&#10060;</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Access Rejected
          </h2>
          <p className="text-primary-800 text-lg">
            Your account has been revoked. Please contact the admin for further
            assistance.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default ApprovalGuard;
