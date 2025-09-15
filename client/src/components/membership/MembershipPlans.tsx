import React, { useState } from "react";
import UserDropdown from "../ui/UserDropdown";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { logoutThunk } from "../../store/thunks/authThunks";
import ProfileModal from "../ProfileModal";
import type { User } from "../../types";

interface Plan {
  _id: string;
  name: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  annualDiscountRate: number;
  tier: string;
}

interface Props {
  plans: Plan[];
  onSelect: (plan: Plan) => void;
}

type Membership = {
  _id?: string;
  planId?: string;
};

const MembershipPlans: React.FC<Props> = ({ plans, onSelect }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const currentMembership = useSelector(
    (state: RootState) => state.membership.current
  ) as Membership | null;
  const dispatch = useDispatch<AppDispatch>();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Animation: fade/scale in
  // removed unused cardAnim

  // Custom grid logic: center last card only on desktop (lg+)
  const getCardClass = (idx: number) => {
    // Only apply centering if 3rd card in a row and it's the last card, and on large screens
    if ((idx + 1) % 3 === 0 && idx === plans.length - 1) {
      return "lg:mx-auto lg:col-span-1";
    }
    return "";
  };

  return (
    <div className="pt-12 xs:pt-16 px-2 xs:px-4 pb-4 min-h-screen bg-primary-50 flex flex-col items-center relative">
      {/* Profile/Logout section top right */}
      <div className="absolute top-2 right-2 xs:top-4 xs:right-4 sm:top-6 sm:right-8 z-20">
        <UserDropdown
          user={user || {}}
          onProfile={() => setProfileModalOpen(true)}
          onLogout={() => dispatch(logoutThunk())}
        />
      </div>
      <h2 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-accent-500 mb-1 xs:mb-2 text-center px-2 xs:px-4">
        Choose Your Membership Plan
      </h2>
      <p className="text-primary-700 mb-4 xs:mb-6 sm:mb-8 text-center max-w-2xl text-xs xs:text-sm sm:text-base px-2 xs:px-4">
        Unlock premium features and get the most out of your experience. Select
        a plan below to continue.
      </p>
      <div className="grid gap-3 xs:gap-4 sm:gap-6 lg:gap-8 w-full max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-2 xs:px-4">
        {plans.map((plan, idx) => {
          const isPremium = plan.tier === "premium";
          const isSelected =
            currentMembership &&
            (currentMembership._id === plan._id ||
              currentMembership.planId === plan._id);
          return (
            <div
              key={plan._id}
              className={`relative rounded-lg xs:rounded-xl shadow-lg flex flex-col border-2 overflow-hidden w-full
                ${
                  isSelected || hoveredId === plan._id
                    ? "border-accent-600 bg-white z-20 outline-none ring-2 ring-accent-400 ring-offset-0"
                    : isPremium
                    ? "border-accent-500 bg-gradient-to-br from-accent-50 to-primary-100 scale-105 z-10"
                    : "border-primary-200 bg-white"
                }
                hover:shadow-xl hover:border-accent-500 animate-fadein hover:scale-105 transition-all duration-200 ${getCardClass(
                  idx
                )}`}
              style={{
                animationDelay: `${idx * 120}ms`,
                animationFillMode: "forwards",
                transition: "border-color 0.2s, box-shadow 0.2s",
                borderRadius: 12, // match rounded-xl
              }}
              onMouseEnter={() => setHoveredId(plan._id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Tier badge */}
              <span
                className={`absolute top-2 right-2 xs:top-4 xs:right-4 px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 rounded-full text-xs font-bold tracking-wide
                ${
                  isPremium
                    ? "bg-accent-500 text-white shadow"
                    : "bg-primary-200 text-primary-700"
                }`}
                style={{ zIndex: 2 }}
              >
                {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
              </span>
              <div className="p-3 xs:p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
                <div className="mb-1 xs:mb-2 sm:mb-4"></div>{" "}
                {/* Add margin between badge and title */}
                <div className="relative">
                  <h3 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-primary-900 mb-1 xs:mb-2 flex items-center gap-1 xs:gap-2 pr-16 xs:pr-20">
                    {isPremium && (
                      <span className="inline-block text-accent-400 animate-bounce text-sm xs:text-base">
                        ★
                      </span>
                    )}
                    <span className="truncate">{plan.name}</span>
                  </h3>
                </div>
                <p className="text-primary-700 mb-3 xs:mb-4 sm:mb-5 text-xs xs:text-sm sm:text-base min-h-[32px] xs:min-h-[40px] sm:min-h-[48px]">
                  {plan.description}
                </p>
                <ul className="mb-4 xs:mb-6 flex-1 space-y-1 xs:space-y-2">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className="text-primary-700 text-xs xs:text-sm flex items-center gap-1 xs:gap-2"
                    >
                      <span className="inline-block w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-accent-500 animate-pulse flex-shrink-0"></span>{" "}
                      <span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto space-y-1 xs:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-900 text-xs xs:text-sm">
                      Monthly
                    </span>
                    <span className="text-accent-500 font-bold text-base xs:text-lg">
                      ${plan.monthlyPrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-900 text-xs xs:text-sm">
                      Yearly
                    </span>
                    <span className="text-accent-500 font-bold text-base xs:text-lg">
                      ${plan.yearlyPrice}{" "}
                      <span className="text-xs text-primary-500">
                        ({plan.annualDiscountRate}% off)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                className={`w-full py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm sm:text-base font-bold rounded-b-lg xs:rounded-b-xl transition-colors
                  ${
                    isPremium
                      ? "bg-accent-600 hover:bg-accent-700"
                      : "bg-accent-500 hover:bg-accent-600"
                  }
                  text-white shadow-md animate-fadein`}
                onClick={async () => {
                  try {
                    const billingType = "recurring"; // or "one-time" if you want to support both
                    const billingPeriod = "monthly"; // or "yearly"; you can let user choose
                    const url = window.location.origin + "/payment-result";
                    const res = await import(
                      "../../services/membershipService"
                    ).then((m) =>
                      m.membershipService.checkout({
                        planId: plan._id,
                        billingType,
                        billingPeriod,
                        url,
                      })
                    );
                    if (res.success && res.data.url) {
                      setTimeout(() => {
                        window.location.href = res.data.url;
                      }, 800);
                    }
                  } catch (err) {
                    // error toast handled in API
                  }
                }}
              >
                Select Plan
              </button>
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
    </div>
  );
};

export default MembershipPlans;
