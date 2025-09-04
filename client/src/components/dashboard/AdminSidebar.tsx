import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Users,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Bell,
  Home,
} from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { logoutThunk } from '../../store/thunks/authThunks';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats } = useSelector((state: RootState) => state.userManagement);

  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview and statistics',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      description: 'Manage all users',
      badge: stats?.pendingUsers ? stats.pendingUsers.toString() : undefined,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Reports and insights',
      disabled: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'System configuration',
      disabled: true,
    },
  ];

  return (
    <div className="bg-white shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-500">System Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Shield className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onTabChange(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : item.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className="h-5 w-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
              {item.disabled && (
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => onTabChange('notifications')}
          disabled
          className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-400 cursor-not-allowed"
        >
          <Bell className="h-5 w-5" />
          <span className="text-sm">Notifications</span>
          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded ml-auto">
            Soon
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
