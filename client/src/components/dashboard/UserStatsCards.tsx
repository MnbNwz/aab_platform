import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Briefcase,
  ShoppingCart,
} from "lucide-react";
import type { RootState, AppDispatch } from "../../store";
import { fetchUserStatsThunk } from "../../store/thunks/userManagementThunks";
import Loader from "../ui/Loader";

export const UserStatsCards: React.FC<{
  onCardClick?: (filter: any) => void;
}> = ({ onCardClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, statsLoading, statsError } = useSelector(
    (state: RootState) => state.userManagement
  );

  useEffect(() => {
    !stats && dispatch(fetchUserStatsThunk());
  }, [dispatch]);

  if (statsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading statistics: {statsError}</p>
        <button
          onClick={() => dispatch(fetchUserStatsThunk())}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "bg-primary-500",
      textColor: "text-primary-600",
      bgColor: "bg-primary-50",
    },
    {
      title: "Active Users",
      value: stats?.activeUsers ?? 0,
      icon: UserCheck,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pending Approval",
      value: stats?.pendingUsers ?? 0,
      icon: Clock,
      color: "bg-accent-500",
      textColor: "text-accent-600",
      bgColor: "bg-accent-50",
    },
    {
      title: "Revoked Users",
      value: stats?.revokedUsers ?? 0,
      icon: UserX,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Customers",
      value: stats?.customers ?? 0,
      icon: ShoppingCart,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Contractors",
      value: stats?.contractors ?? 0,
      icon: Briefcase,
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Admins",
      value: stats?.admins ?? 0,
      icon: Shield,
      color: "bg-gray-500",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  // Map card title to filter
  const getFilterForCard = (title: string) => {
    switch (title) {
      case "Admins":
        return { role: "admin", status: "active", approval: "approved" };
      case "Active Contractor":
        return { role: "contractor", status: "active", approval: "approved" };
      case "Active Customer":
        return { role: "customer", status: "active", approval: "approved" };
      case "Customers":
        return { role: "customer" };
      case "Contractors":
        return { role: "contractor" };
      case "Total Users":
        return { role: "", approval: "", status: "" };
      case "Active Users":
        return { status: "active" };
      case "Pending Approval":
        return { approval: "pending" };
      case "Revoked Users":
        return { status: "revoke" };
      default:
        return {};
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {statCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.title}
            className={`${card.bgColor} rounded-2xl shadow-md px-4 py-5 md:px-6 md:py-6 border border-gray-100 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-lg min-w-[140px] min-h-[140px] cursor-pointer`}
            onClick={() =>
              onCardClick && onCardClick(getFilterForCard(card.title))
            }
          >
            <div
              className={`${card.color} p-3 md:p-4 rounded-full mb-3 md:mb-4 flex items-center justify-center`}
            >
              <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <p
              className={`text-2xl md:text-3xl font-extrabold ${card.textColor} mb-0.5 md:mb-1`}
            >
              {statsLoading ? (
                <Loader size="small" color="gray" />
              ) : (
                card.value.toLocaleString()
              )}
            </p>
            <p className="text-xs md:text-sm font-semibold text-gray-600 text-center break-words max-w-[80px] md:max-w-none uppercase tracking-wide">
              {card.title}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default UserStatsCards;
