import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Clock, RefreshCw, LogOut } from "lucide-react";
import { RootState, AppDispatch } from "../store";
import { getProfileThunk, logoutThunk } from "../store/thunks/authThunks";
import { fetchAdminProfileThunk } from "../store/thunks/adminProfileThunks";
import { showToast } from "../utils/toast";
import AdminContactInfo from "./ui/AdminContactInfo";

const PendingApproval: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const primaryAdmin = useSelector(
    (state: RootState) => state.adminProfile.primaryAdmin
  );
  const adminProfiles = useSelector(
    (state: RootState) => state.adminProfile.adminProfiles
  );
  const isAdminProfileLoaded = useSelector(
    (state: RootState) => state.adminProfile.isLoaded
  );
  const dispatch = useDispatch<AppDispatch>();
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch admin profile if not loaded yet
  useEffect(() => {
    if (!isAdminProfileLoaded && user) {
      dispatch(fetchAdminProfileThunk());
    }
  }, [dispatch, isAdminProfileLoaded, user]);

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
    } catch (_error) {
      showToast.dismiss();
      showToast.error("Failed to check account status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  if (user?.approval === "pending" || user?.approval === "rejected") {
    return (
      <div className="aas-loader-container-mobile bg-primary-800 p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 sm:p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4 sm:mb-6">
                {user.approval === "pending" ? (
                  <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-accent-400" />
                ) : (
                  <div className="text-4xl sm:text-5xl text-accent-400">❌</div>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                {user.approval === "pending"
                  ? "Account Under Review"
                  : "Account Rejected"}
              </h1>
              <div className="mb-4 sm:mb-6">
                {user.approval === "pending" && (
                  <p className="text-white/80 text-xs sm:text-sm mb-1 sm:mb-2">
                    Welcome back,
                  </p>
                )}
                <p className="text-base sm:text-lg font-semibold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs sm:text-sm text-white/70">{user.email}</p>
                <div className="flex items-center justify-center mt-1 sm:mt-2">
                  <span className="text-xs sm:text-sm font-medium text-white/80 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
              <p className="text-white/90 text-center mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                {user.approval === "pending"
                  ? "Your account is currently being reviewed by our admin team. You will be notified once the review is complete."
                  : "Your account application has been rejected. Please contact the admin for further assistance."}
              </p>
              <div className="flex justify-center mb-4 sm:mb-6">
                <span
                  className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    user.approval === "pending"
                      ? "bg-accent-100 text-accent-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  Status: {user.approval}
                </span>
              </div>
              <button
                onClick={handleRefreshStatus}
                disabled={isChecking}
                className="w-full text-white font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span>Checking Account Status...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span>
                      {user.approval === "pending"
                        ? "Check Status"
                        : "Check Again"}
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-white/80 font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50 mt-2 sm:mt-3 text-sm sm:text-base"
              >
                {isLoggingOut ? (
                  <>
                    <LogOut className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span>Logout</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="text-center mt-6">
            <AdminContactInfo
              adminProfiles={adminProfiles}
              primaryAdmin={primaryAdmin}
              className="text-white/60"
              showMultipleAdmins={true}
            />
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default PendingApproval;
