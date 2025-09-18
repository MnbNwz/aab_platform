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
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary-50 relative p-4">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
          <UserDropdown
            user={user}
            onLogout={handleLogout}
            logoutLabel="Logout"
            prominent={true}
          />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center border border-accent-200">
          <div className="text-4xl sm:text-5xl mb-4 text-accent-500">
            &#10060;
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-accent-600 mb-3">
            Access Rejected
          </h2>
          <p className="text-primary-700 text-sm sm:text-base leading-relaxed">
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
