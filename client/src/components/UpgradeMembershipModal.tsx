import React, { useState, useEffect } from "react";
import { X, CreditCard, Crown } from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { RootState } from "../store";
import { membershipService } from "../services/membershipService";
import type { CurrentMembership } from "../types";

interface UpgradeMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeMembershipModal: React.FC<UpgradeMembershipModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { plans } = useSelector((state: RootState) => state.membership);
  const currentMembership = useSelector(
    (state: RootState) => state.membership.current
  ) as CurrentMembership | null;
  const user = useSelector((state: RootState) => state.auth.user);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [hasShownPremiumToast, setHasShownPremiumToast] = useState(false);

  const handleCheckout = async (
    planId: string,
    billingPeriod: "monthly" | "yearly"
  ) => {
    const loadingKey = `${planId}-${billingPeriod}`;
    setLoading(loadingKey);

    try {
      const checkoutPayload = {
        planId,
        billingPeriod,
        url: `${window.location.origin}/dashboard`,
      };

      const response = await membershipService.checkout(checkoutPayload);

      if (response.success && response.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      // Error is already handled by the service with toast
    } finally {
      setLoading(null);
    }
  };

  // Check if user is on premium tier
  const isPremiumUser =
    currentMembership &&
    plans.length > 0 &&
    currentMembership.planId?.tier === "premium";

  // Show toast when user is on premium tier
  useEffect(() => {
    if (isOpen && isPremiumUser && !hasShownPremiumToast) {
      toast(
        "You already have the highest membership tier. Please wait for your current plan to expire before upgrading.",
        {
          duration: 5000,
          icon: "👑",
          position: "top-center",
          style: {
            background: "#fef3c7",
            color: "#78350f",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            padding: "12px 16px",
            border: "2px solid #fbbf24",
          },
        }
      );
      setHasShownPremiumToast(true);
    }
  }, [isOpen, isPremiumUser, hasShownPremiumToast]);

  // Reset toast flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasShownPremiumToast(false);
    }
  }, [isOpen]);

  // Helper function to check if a button should be disabled
  const isButtonDisabled = (
    planTier: string,
    billingPeriod: "monthly" | "yearly"
  ) => {
    if (!currentMembership) return false;

    const currentTier = currentMembership.planId?.tier;
    const currentBillingPeriod = currentMembership.billingPeriod;

    const tierOrder = ["basic", "standard", "premium"];
    const currentTierIndex = tierOrder.indexOf(currentTier || "");
    const planTierIndex = tierOrder.indexOf(planTier);

    // 1. If user is on premium tier, disable ALL buttons
    if (currentTier === "premium") {
      return true;
    }

    // 2. Disable all lower tiers completely (can't downgrade)
    if (
      currentTierIndex !== -1 &&
      planTierIndex !== -1 &&
      planTierIndex < currentTierIndex
    ) {
      return true;
    }

    // 3. For the SAME tier as current
    if (planTier === currentTier) {
      // If current is MONTHLY:
      //   - Disable monthly (current)
      //   - Enable yearly (upgrade to yearly)
      if (currentBillingPeriod === "monthly") {
        if (billingPeriod === "monthly") {
          return true; // Disable monthly
        }
        return false; // Enable yearly
      }

      // If current is YEARLY:
      //   - Disable both monthly and yearly
      if (currentBillingPeriod === "yearly") {
        return true; // Disable both
      }
    }

    // 4. Enable all higher tiers
    return false;
  };

  if (!isOpen) return null;

  // Only allow customers and contractors to upgrade membership
  if (user?.role === "admin") {
    return null;
  }

  const getCardClass = (idx: number) => {
    if ((idx + 1) % 3 === 0 && idx === plans.length - 1) {
      return "lg:mx-auto lg:col-span-1";
    }
    return "";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-7xl mx-auto relative flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-accent-500">
                Upgrade Your{" "}
                {user?.role === "customer"
                  ? "Customer"
                  : user?.role === "contractor"
                  ? "Contractor"
                  : ""}{" "}
                Membership
              </h3>
              <p className="text-sm text-primary-700 mt-1">
                {user?.role === "customer"
                  ? "Find the perfect contractors for your projects and access premium tools"
                  : user?.role === "contractor"
                  ? "Get more leads, grow your business, and access premium tools"
                  : "Choose a plan that fits your needs"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-primary-400 hover:text-primary-600 p-2"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Premium User Notice */}
          {isPremiumUser && (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4 sm:p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Crown className="h-6 w-6 sm:h-7 sm:w-7 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-bold text-amber-900 mb-1">
                    You're on the Premium Plan! 👑
                  </h4>
                  <p className="text-sm sm:text-base text-amber-800 leading-relaxed">
                    You already have the highest membership tier. All buttons
                    are disabled. Please wait for your current plan to expire
                    before making changes to your membership.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div
            className={`grid gap-3 xs:gap-4 sm:gap-6 lg:gap-8 ${
              plans.length === 3
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:justify-items-center lg:justify-items-stretch"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {plans.map((plan, idx) => {
              const isPremium = plan.tier === "premium";
              const isSelected =
                currentMembership && currentMembership.planId._id === plan._id;
              const isMonthlyDisabled = isButtonDisabled(plan.tier, "monthly");
              const isYearlyDisabled = isButtonDisabled(plan.tier, "yearly");

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
                    borderRadius: 12,
                  }}
                  onMouseEnter={() => setHoveredId(plan._id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Tier badge */}
                  <span
                    className={`absolute top-3 xs:top-4 xs:right-4 right-3 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-bold tracking-wide z-10
                    ${
                      isPremium
                        ? "bg-accent-500 text-white shadow-lg"
                        : "bg-primary-200 text-primary-700"
                    }`}
                  >
                    {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                  </span>

                  <div className="p-4 xs:p-5 sm:p-6 lg:p-8 flex-1 flex flex-col">
                    <div className="mb-2 xs:mb-3 sm:mb-4"></div>
                    <div className="relative">
                      <h3 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-primary-900 mb-2 xs:mb-3 flex items-center gap-2 pr-20 xs:pr-24">
                        {isPremium && (
                          <span className="inline-block text-accent-400 animate-bounce text-base xs:text-lg">
                            ★
                          </span>
                        )}
                        <span className="truncate leading-tight">
                          {plan.name}
                        </span>
                      </h3>
                    </div>
                    {isSelected && (
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                          Current Plan
                        </span>
                      </div>
                    )}
                    <p className="text-primary-700 mb-4 xs:mb-5 sm:mb-6 text-sm xs:text-base leading-relaxed line-clamp-2">
                      {plan.description}
                    </p>
                    <ul className="mb-4 xs:mb-6 flex-1 space-y-2 xs:space-y-3">
                      {plan.features.map((f, i) => (
                        <li
                          key={i}
                          className="text-primary-700 text-sm xs:text-base flex items-start gap-2 xs:gap-3"
                        >
                          <span className="inline-block w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full bg-accent-500 flex-shrink-0 mt-1.5 xs:mt-2"></span>
                          <span className="leading-relaxed">{f}</span>
                        </li>
                      ))}
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
                          isMonthlyDisabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-accent-500 text-white shadow-md hover:bg-accent-600"
                        }
                        ${
                          loading === `${plan._id}-monthly`
                            ? "opacity-75 cursor-not-allowed"
                            : ""
                        }
                        animate-fadein`}
                      onClick={() => {
                        if (
                          !isMonthlyDisabled &&
                          loading !== `${plan._id}-monthly`
                        ) {
                          handleCheckout(plan._id, "monthly");
                        }
                      }}
                      disabled={
                        isMonthlyDisabled || loading === `${plan._id}-monthly`
                      }
                      title={
                        isMonthlyDisabled
                          ? "This plan is not available for upgrade"
                          : ""
                      }
                    >
                      {loading === `${plan._id}-monthly`
                        ? "Loading..."
                        : isMonthlyDisabled &&
                          currentMembership?.planId._id === plan._id &&
                          currentMembership?.billingPeriod === "monthly"
                        ? "Current"
                        : isMonthlyDisabled
                        ? "N/A"
                        : "Monthly"}
                    </button>
                    <button
                      className={`flex-1 py-2 xs:py-2.5 sm:py-3 px-1 xs:px-2 sm:px-4 text-xs xs:text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200
                        ${
                          isYearlyDisabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-accent-500 text-white shadow-md hover:bg-accent-600"
                        }
                        ${
                          loading === `${plan._id}-yearly`
                            ? "opacity-75 cursor-not-allowed"
                            : ""
                        }
                        animate-fadein`}
                      onClick={() => {
                        if (
                          !isYearlyDisabled &&
                          loading !== `${plan._id}-yearly`
                        ) {
                          handleCheckout(plan._id, "yearly");
                        }
                      }}
                      disabled={
                        isYearlyDisabled || loading === `${plan._id}-yearly`
                      }
                      title={
                        isYearlyDisabled
                          ? "This plan is not available for upgrade"
                          : ""
                      }
                    >
                      {loading === `${plan._id}-yearly`
                        ? "Loading..."
                        : isYearlyDisabled &&
                          currentMembership?.planId._id === plan._id &&
                          currentMembership?.billingPeriod === "yearly"
                        ? "Current"
                        : isYearlyDisabled
                        ? "N/A"
                        : "Yearly"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadein {
          0% { opacity: 0; transform: translateY(32px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadein { animation: fadein 0.7s cubic-bezier(.4,2,.6,1) both; }
      `}</style>
    </div>
  );
};

export default UpgradeMembershipModal;
