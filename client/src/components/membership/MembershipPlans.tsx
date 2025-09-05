import React, { useState } from "react";
import { User as UserIcon } from "lucide-react";
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
  const currentMembership = useSelector((state: RootState) => state.membership.current) as Membership | null;
  const dispatch = useDispatch<AppDispatch>();
  const [profileOpen, setProfileOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Animation: fade/scale in
  // removed unused cardAnim

  // Custom grid logic: center 3rd card if row has 1
  const getCardClass = (idx: number) => {
    // If 3rd card in a row (idx 2, 5, 8, ...), center it
    if ((idx + 1) % 3 === 0 && idx === plans.length - 1) {
      return "mx-auto col-span-1";
    }
    return "";
  };

  return (
    <div className="pt-16 px-4 pb-4 min-h-screen bg-primary-50 flex flex-col items-center relative">
      {/* Profile/Logout section top right */}
      <div className="absolute top-6 right-8 z-20">
        <UserDropdown
          user={user || {}}
          onProfile={() => setProfileModalOpen(true)}
          onSettings={() => {}}
          onLogout={() => dispatch(logoutThunk())}
        />
      </div>
      <h2 className="text-3xl font-extrabold text-accent-500 mb-2 text-center">
        Choose Your Membership Plan
      </h2>
      <p className="text-primary-700 mb-8 text-center max-w-2xl text-base">
        Unlock premium features and get the most out of your experience. Select
        a plan below to continue.
      </p>
      <div className="grid gap-8 w-full max-w-6xl sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, idx) => {
          const isPremium = plan.tier === "premium";
          const isSelected = currentMembership && (currentMembership._id === plan._id || currentMembership.planId === plan._id);
          return (
            <div
              key={plan._id}
              className={`relative rounded-2xl shadow-xl flex flex-col border-2 overflow-hidden
                ${
                  isSelected || hoveredId === plan._id
                    ? "border-accent-600 bg-white z-20 outline-none ring-2 ring-accent-400 ring-offset-0 rounded-2xl"
                    : isPremium
                    ? "border-accent-500 bg-gradient-to-br from-accent-50 to-primary-100 scale-105 z-10"
                    : "border-primary-200 bg-primary-50"
                }
                hover:shadow-2xl hover:border-accent-500 animate-fadein hover:scale-105 ${getCardClass(idx)}`}
              style={{
                animationDelay: `${idx * 120}ms`,
                animationFillMode: "forwards",
                transition: 'border-color 0.2s, box-shadow 0.2s',
                borderRadius: 20, // match rounded-2xl
              }}
              onMouseEnter={() => setHoveredId(plan._id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Tier badge */}
              <span
                className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold tracking-wide
                ${
                  isPremium
                    ? "bg-accent-500 text-white shadow"
                    : "bg-primary-200 text-primary-700"
                }`}
              >
                {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
              </span>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-extrabold text-primary-900 mb-2 flex items-center gap-2">
                  {isPremium && (
                    <span className="inline-block text-yellow-400 animate-bounce">
                      ★
                    </span>
                  )}
                  {plan.name}
                </h3>
                <p className="text-primary-700 mb-5 text-base min-h-[48px]">
                  {plan.description}
                </p>
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className="text-primary-700 text-sm flex items-center gap-2"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>{" "}
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-900">
                      Monthly
                    </span>
                    <span className="text-accent-500 font-bold text-lg">
                      ${plan.monthlyPrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-900">
                      Yearly
                    </span>
                    <span className="text-accent-500 font-bold text-lg">
                      ${plan.yearlyPrice}{" "}
                      <span className="text-xs text-primary-500">
                        ({plan.annualDiscountRate}% off)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                className={`w-full py-3 text-lg font-bold rounded-b-2xl transition-colors
                  ${
                    isPremium
                      ? "bg-accent-600 hover:bg-accent-700"
                      : "bg-accent-500 hover:bg-accent-600"
                  }
                  text-white shadow-md animate-fadein`}
                onClick={() => onSelect(plan)}
              >
                {isPremium ? "Get Premium" : "Select Plan"}
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
