import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import MembershipPlans from "./MembershipPlans";
import {
  fetchCurrentMembership,
  fetchMembershipPlans,
} from "../../store/slices/membershipSlice";
import { Loader } from "../ui/Loader";
import { RootState, AppDispatch } from "../../store";

const MembershipGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    current: membership,
    plans,
    loading,
    error,
  } = useSelector((state: RootState) => state.membership);

  useEffect(() => {
    if (!user || !user.role) {
      return;
    }
    dispatch(fetchMembershipPlans(user.role));
    dispatch(fetchCurrentMembership());
  }, [user, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-50">
        <Loader size="large" color="accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-50">
        <span className="text-red-600 text-lg font-semibold">{error}</span>
      </div>
    );
  }

  if (
    membership === null &&
    plans.length > 0 &&
    user &&
    user.role !== "admin"
  ) {
    return (
      <MembershipPlans
        plans={plans}
        onSelect={(plan) => {
          // TODO: Implement plan selection/payment logic here
          alert(`Selected plan: ${plan.name}`);
        }}
      />
    );
  }

  // If membership exists, render the normal app/dashboard
  return <>{children}</>;
};

export default MembershipGate;
