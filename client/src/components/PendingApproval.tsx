import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Clock, RefreshCw, LogOut } from "lucide-react";
import { RootState, AppDispatch } from "../store";
import { getProfileThunk, logoutThunk } from "../store/thunks/authThunks";
import { showToast } from "../utils/toast";

const PendingApproval: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logoutThunk()).unwrap();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      showToast.loading("Checking your account status...");
      await dispatch(getProfileThunk()).unwrap();
      showToast.dismiss();
    } catch (error) {
      showToast.dismiss();
      showToast.error("Failed to check account status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  if (user?.approval === "pending") {
    return (
      <div className="min-h-screen bg-primary-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Clock className="h-16 w-16 text-accent-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Account Under Review
              </h1>
              <div className="mb-6">
                <p className="text-white/80 text-sm mb-2">Welcome back,</p>
                <p className="text-lg font-semibold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-white/70">{user.email}</p>
                <div className="flex items-center justify-center mt-2">
                  <span className="text-sm font-medium text-white/80 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
              <p className="text-white/90 text-center mb-6 leading-relaxed">
                Your account is currently being reviewed by our admin team. You
                will be notified once the review is complete.
              </p>
              <div className="flex justify-center mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-100 text-accent-800">
                  Status: pending
                </span>
              </div>
              <button
                onClick={handleRefreshStatus}
                disabled={isChecking}
                className="w-full text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-50"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                    <span>Checking Account Status...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    <span>Check Status</span>
                  </>
                )}
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-white/80 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50 mt-3"
              >
                {isLoggingOut ? (
                  <>
                    <LogOut className="animate-spin h-5 w-5 mr-2" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-5 w-5 mr-2" />
                    <span>Logout</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="text-center mt-6">
            <p className="text-sm text-white/60">
              Need help? Contact us at{" "}
              <a
                href="mailto:support@example.com"
                className="text-white/80 hover:text-white font-medium"
              >
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default PendingApproval;
