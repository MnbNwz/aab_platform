import React, { useState, useCallback } from "react";
import UserDropdown from "../ui/UserDropdown";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { logoutThunk } from "../../store/thunks/authThunks";
import ProfileModal from "../ProfileModal";
import { membershipService } from "../../services/membershipService";
// import ConfirmModal from "../ui/ConfirmModal";
import type { User, CurrentMembership } from "../../types";

const MembershipPlans: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { plans } = useSelector((state: RootState) => state.membership);
  const currentMembership = useSelector(
    (state: RootState) => state.membership.current
  ) as CurrentMembership | null;
  const dispatch = useDispatch<AppDispatch>();
  const [hoveredId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  // const [showAutoRenewConfirm, setShowAutoRenewConfirm] = useState(false);
  // const [showOneTimeConfirm, setShowOneTimeConfirm] = useState(false);
  // const [pendingCheckout, setPendingCheckout] = useState<{
  //   planId: string;
  //   billingPeriod: "monthly" | "yearly";
  // } | null>(null);

  const handleCheckout = useCallback(
    async (planId: string, billingPeriod: "monthly" | "yearly") => {
      const loadingKey = `${planId}-${billingPeriod}`;
      setLoading(loadingKey);

      try {
        const checkoutPayload = {
          planId,
          billingPeriod,
          url: `${window.location.origin}/membership/success`,
          isAutoRenew: false, // Always false for now
        };

        const response = await membershipService.checkout(checkoutPayload);

        if (response.success && response.data?.url) {
          window.location.href = response.data.url;
        } else {
          throw new Error("No checkout URL received");
        }
      } catch (error) {
        console.error("Checkout error:", error);
      } finally {
        setLoading(null);
      }
    },
    []
  );

  const handleCheckoutClick = useCallback(
    (planId: string, billingPeriod: "monthly" | "yearly") => {
      handleCheckout(planId, billingPeriod);
    },
    [handleCheckout]
  );

  // Commented out auto-renewal handlers
  // const handleAutoRenewConfirm = useCallback(() => {
  //   if (pendingCheckout) {
  //     setShowAutoRenewConfirm(false);
  //     handleCheckout(
  //       pendingCheckout.planId,
  //       pendingCheckout.billingPeriod,
  //       true
  //     );
  //   }
  // }, [pendingCheckout, handleCheckout]);

  // const handleAutoRenewCancel = useCallback(() => {
  //   setShowAutoRenewConfirm(false);
  //   setShowOneTimeConfirm(true);
  // }, []);

  // const handleOneTimeConfirm = useCallback(() => {
  //   if (pendingCheckout) {
  //     setShowOneTimeConfirm(false);
  //     handleCheckout(
  //       pendingCheckout.planId,
  //       pendingCheckout.billingPeriod,
  //       false
  //     );
  //   }
  // }, [pendingCheckout, handleCheckout]);

  // const handleOneTimeCancel = useCallback(() => {
  //   setShowOneTimeConfirm(false);
  //   setPendingCheckout(null);
  // }, []);

  const getCardClass = (idx: number) => {
    if ((idx + 1) % 3 === 0 && idx === plans.length - 1) {
      return "lg:mx-auto lg:col-span-1";
    }
    return "";
  };

  return (
    <div className="pt-12 xs:pt-16 px-2 xs:px-4 pb-4 min-h-screen bg-primary-50 flex flex-col items-center relative">
      <div className="absolute top-2 right-2 xs:top-4 xs:right-4 sm:top-6 sm:right-8 z-20">
        <UserDropdown
          user={user || {}}
          onProfile={() => setProfileModalOpen(true)}
          onLogout={() => dispatch(logoutThunk())}
          prominent={true}
        />
      </div>
      <h2 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-accent-500 mb-1 xs:mb-2 text-center px-2 xs:px-4">
        Choose Your{" "}
        {user?.role === "customer"
          ? "Customer"
          : user?.role === "contractor"
          ? "Contractor"
          : ""}{" "}
        Membership Plan
      </h2>
      <p className="text-primary-700 mb-4 xs:mb-6 sm:mb-8 text-center max-w-2xl text-xs xs:text-sm sm:text-base px-2 xs:px-4">
        {user?.role === "customer"
          ? "Find the perfect contractors for your projects and access premium tools to make your home improvement journey smooth and successful."
          : user?.role === "contractor"
          ? "Get more leads, grow your business, and access premium tools to take your contracting services to the next level."
          : "Unlock premium features and get the most out of your experience. Select a plan below to continue."}
      </p>
      <div
        className={`grid gap-3 xs:gap-4 sm:gap-6 lg:gap-8 w-full max-w-7xl px-2 xs:px-4 sm:px-6 lg:px-8 ${
          plans.length === 3
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:justify-items-center lg:justify-items-stretch"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {plans.map((plan, idx) => {
          const isPremium = plan.tier === "premium";

          const isSelected =
            currentMembership && currentMembership.planId._id === plan._id;

          return (
            <div
              key={plan._id}
              className={`relative rounded-xl shadow-lg flex flex-col border-2 overflow-hidden w-full max-w-sm mx-auto transition-all duration-300 ${
                plans.length === 3 && idx === 2
                  ? "sm:col-start-1 sm:col-span-2 lg:col-start-auto lg:col-span-auto"
                  : ""
              }
                ${
                  isSelected
                    ? "border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 ring-2 ring-orange-300 ring-opacity-50 shadow-xl"
                    : "border-orange-200 bg-white shadow-md"
                }
                animate-fadein ${getCardClass(idx)}`}
              style={{
                animationDelay: `${idx * 120}ms`,
                animationFillMode: "forwards",
                transition: "border-color 0.2s, box-shadow 0.2s",
                borderRadius: 12, // match rounded-xl
              }}
            >
              {/* Tier badge */}
              <span
                className={`absolute top-3 right-3 xs:top-4 xs:right-4 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-bold tracking-wide z-10
                ${
                  isPremium
                    ? "bg-accent-500 text-white shadow-lg"
                    : "bg-primary-200 text-primary-700"
                }`}
              >
                {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
              </span>
              <div className="p-4 xs:p-5 sm:p-6 lg:p-8 flex-1 flex flex-col">
                <div className="mb-2 xs:mb-3 sm:mb-4"></div>{" "}
                {/* Add margin between badge and title */}
                <div className="relative">
                  <h3 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-primary-900 mb-2 xs:mb-3 flex items-center gap-2 pr-20 xs:pr-24">
                    {isPremium && (
                      <span className="inline-block text-accent-400 animate-bounce text-base xs:text-lg">
                        ★
                      </span>
                    )}
                    <span className="truncate leading-tight">{plan.name}</span>
                  </h3>
                </div>
                <p className="text-primary-700 mb-4 xs:mb-5 sm:mb-6 text-sm xs:text-base leading-relaxed line-clamp-2">
                  {plan.description}
                </p>
                <ul className="mb-4 xs:mb-6 flex-1 space-y-2 xs:space-y-3">
                  {plan.features.map((f, i) => {
                    // Check if this is a contractor plan with leads information
                    const isContractorPlan = plan.userType === "contractor";
                    const leadsMatch = f.match(/^(\d+)\s+leads\/month$/);

                    // If it's a leads feature, show both monthly and annual
                    if (isContractorPlan && leadsMatch) {
                      const monthlyLeads = parseInt(leadsMatch[1]);
                      const annualLeads = monthlyLeads * 12;

                      return (
                        <li
                          key={i}
                          className="text-primary-700 text-sm xs:text-base flex items-start gap-2 xs:gap-3"
                        >
                          <span className="inline-block w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full bg-accent-500 flex-shrink-0 mt-1.5 xs:mt-2"></span>
                          <span className="leading-relaxed">
                            {monthlyLeads} leads/month{" "}
                            <span className="text-primary-500">
                              (or {annualLeads} leads/year)
                            </span>
                          </span>
                        </li>
                      );
                    }

                    // Regular feature display
                    return (
                      <li
                        key={i}
                        className="text-primary-700 text-sm xs:text-base flex items-start gap-2 xs:gap-3"
                      >
                        <span className="inline-block w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full bg-accent-500 flex-shrink-0 mt-1.5 xs:mt-2"></span>
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    );
                  })}
                </ul>
                <div
                  className={`mt-auto space-y-3 xs:space-y-4 rounded-lg p-3 xs:p-4 transition-all duration-200 ${
                    hoveredId === plan._id
                      ? "bg-primary-100 border border-primary-300 shadow-md"
                      : "bg-primary-50 border border-transparent"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Monthly Pricing */}
                    <div className="text-center">
                      <div className="text-sm font-medium text-primary-600 mb-1">
                        Monthly
                      </div>
                      <div className="text-2xl font-bold text-primary-900">
                        ${(plan.monthlyPrice / 100).toFixed(2)}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center">
                      <div className="flex-1 border-t border-primary-200"></div>
                      <div className="px-3 text-xs font-medium text-primary-500 bg-white">
                        OR
                      </div>
                      <div className="flex-1 border-t border-primary-200"></div>
                    </div>

                    {/* Yearly Pricing */}
                    <div className="text-center relative">
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Save {plan.annualDiscountRate}%
                        </span>
                      </div>
                      <div className="text-sm font-medium text-primary-600 mb-1">
                        Yearly
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-accent-500">
                          $
                          {(
                            (plan.yearlyPrice *
                              (1 - plan.annualDiscountRate / 100)) /
                            100
                          ).toFixed(2)}
                        </div>
                        <div className="text-lg font-medium text-primary-400 line-through">
                          ${(plan.yearlyPrice / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 xs:gap-2 p-2 xs:p-3 sm:p-4 lg:p-5">
                <button
                  className={`flex-1 py-2 xs:py-2.5 sm:py-3 px-1 xs:px-2 sm:px-4 text-xs xs:text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200
                    ${
                      isSelected
                        ? "bg-accent-600 text-white cursor-default"
                        : "bg-accent-500 text-white shadow-md hover:bg-accent-600"
                    }
                    ${
                      loading === `${plan._id}-monthly`
                        ? "opacity-75 cursor-not-allowed"
                        : ""
                    }
                    animate-fadein`}
                  onClick={() => {
                    if (!isSelected && loading !== `${plan._id}-monthly`) {
                      handleCheckoutClick(plan._id, "monthly");
                    }
                  }}
                  disabled={isSelected || loading === `${plan._id}-monthly`}
                >
                  {loading === `${plan._id}-monthly` ? "Loading..." : "Monthly"}
                </button>
                <button
                  className={`flex-1 py-2 xs:py-2.5 sm:py-3 px-1 xs:px-2 sm:px-4 text-xs xs:text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200
                    ${
                      isSelected
                        ? "bg-accent-600 text-white cursor-default"
                        : "bg-accent-500 text-white shadow-md hover:bg-accent-600"
                    }
                    ${
                      loading === `${plan._id}-yearly`
                        ? "opacity-75 cursor-not-allowed"
                        : ""
                    }
                    animate-fadein`}
                  onClick={() => {
                    if (!isSelected && loading !== `${plan._id}-yearly`) {
                      handleCheckoutClick(plan._id, "yearly");
                    }
                  }}
                  disabled={isSelected || loading === `${plan._id}-yearly`}
                >
                  {loading === `${plan._id}-yearly` ? "Loading..." : "Yearly"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Animations */}
      <style>{`
        @keyframes fadein {
          0% { opacity: 0; transform: translateY(32px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadein { animation: fadein 0.7s cubic-bezier(.4,2,.6,1) both; }
      `}</style>
      {/* Profile Modal */}
      <ProfileModal
        user={user as User}
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSave={() => {}}
      />

      {/* Commented out auto-renewal confirmation modals */}
      {/* 
      <ConfirmModal
        isOpen={showAutoRenewConfirm}
        title="Auto-Renewal?"
        message={
          <div className="text-center">
            <p className="mb-3">Enable automatic renewal for convenience?</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>
                <strong>Yes:</strong> Auto-renewal enabled
              </p>
              <p>
                <strong>No:</strong> One-time payment
              </p>
            </div>
          </div>
        }
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleAutoRenewConfirm}
        onCancel={handleAutoRenewCancel}
      />

      <ConfirmModal
        isOpen={showOneTimeConfirm}
        title="One-Time Payment"
        message={
          <div className="text-center">
            <p className="mb-3">Continue with one-time payment?</p>
            <div className="text-sm text-gray-500">
              <p>Your membership will expire and need manual renewal.</p>
            </div>
          </div>
        }
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={handleOneTimeConfirm}
        onCancel={handleOneTimeCancel}
      />
      */}
    </div>
  );
};

export default MembershipPlans;
