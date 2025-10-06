import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchCurrentMembership,
  fetchMembershipPlans,
} from "../../store/slices/membershipSlice";
import { fetchAdminProfileThunk } from "../../store/thunks/adminProfileThunks";
import { Loader } from "../ui/Loader";
import AdminContactInfo from "../ui/AdminContactInfo";
import { RootState, AppDispatch } from "../../store";
import MembershipPlans from "./MembershipPlans";

const MembershipGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();
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
  const {
    loading,
    error,
    current: currentMembership,
  } = useSelector((state: RootState) => state.membership);

  useEffect(() => {
    if (!user || !user.role) {
      return;
    }
    dispatch(fetchMembershipPlans(user.role));
    dispatch(fetchCurrentMembership());

    if (!isAdminProfileLoaded) {
      dispatch(fetchAdminProfileThunk());
    }
  }, [user, dispatch, isAdminProfileLoaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-50">
        <Loader size="large" color="accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-50 p-4">
        <div className="bg-primary-50 rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center border border-accent-200">
          <div className="text-4xl sm:text-5xl mb-4 text-accent-500">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-accent-600 mb-3">
            Error Loading Plans
          </h2>
          <p className="text-primary-700 text-sm sm:text-base leading-relaxed">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (user && user.approval === "rejected") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary-50 relative p-4">
        <div className="bg-primary-50 rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center border border-accent-200">
          <div className="text-4xl sm:text-5xl mb-4 text-accent-500">❌</div>
          <h2 className="text-xl sm:text-2xl font-bold text-accent-600 mb-3">
            Account Rejected
          </h2>
          <p className="text-primary-700 text-sm sm:text-base leading-relaxed mb-4">
            Your account application has been rejected. Please contact the admin
            for further assistance.
          </p>
          <div className="text-center">
            <AdminContactInfo
              adminProfiles={adminProfiles}
              primaryAdmin={primaryAdmin}
              className="text-primary-600"
              showMultipleAdmins={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return !currentMembership && user?.role !== "admin" ? (
    <MembershipPlans />
  ) : (
    <>{children}</>
  );
};

export default MembershipGate;
