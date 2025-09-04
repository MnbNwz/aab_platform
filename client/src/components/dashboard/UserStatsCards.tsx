import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Briefcase,
  ShoppingCart,
} from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { fetchUserStatsThunk } from '../../store/thunks/userManagementThunks';
import Loader from '../ui/Loader';

export const UserStatsCards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, statsLoading, statsError } = useSelector(
    (state: RootState) => state.userManagement
  );

  useEffect(() => {
    dispatch(fetchUserStatsThunk());
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
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'bg-primary-500',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers ?? 0,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Approval',
      value: stats?.pendingUsers ?? 0,
      icon: Clock,
      color: 'bg-accent-500',
      textColor: 'text-accent-600',
      bgColor: 'bg-accent-50',
    },
    {
      title: 'Revoked Users',
      value: stats?.revokedUsers ?? 0,
      icon: UserX,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Customers',
      value: stats?.customers ?? 0,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Contractors',
      value: stats?.contractors ?? 0,
      icon: Briefcase,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Admins',
      value: stats?.admins ?? 0,
      icon: Shield,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
      {statCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.title}
            className={`${card.bgColor} rounded-lg shadow p-6 border border-gray-200`}
          >
            <div className="flex items-center">
              <div className={`${card.color} p-3 rounded-lg`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {statsLoading ? (
                    <Loader size="small" color="gray" />
                  ) : (
                    card.value.toLocaleString()
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserStatsCards;
