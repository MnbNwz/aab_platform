import React from "react";
import { useSelector } from "react-redux";
import UserDropdown from "../ui/UserDropdown";
import { RootState, AppDispatch } from "../../store";
import { useDispatch } from "react-redux";
import { logoutThunk } from "../../store/thunks/authThunks";

const RevokeStatusGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();

  if (!user) return null;

  if (user.status === "revoke") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary-50 relative p-4">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
          <UserDropdown
            user={user}
            onLogout={() => dispatch(logoutThunk())}
            logoutLabel="Logout"
          />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center border border-accent-200">
          <div className="text-4xl sm:text-5xl mb-4 text-accent-500">
            &#10060;
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-accent-600 mb-3">
            Account Revoked
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

export default RevokeStatusGate;
