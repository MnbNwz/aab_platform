import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Users,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Bell,
  Home,
} from "lucide-react";
import type { RootState, AppDispatch } from "../../store";
import { logoutThunk } from "../../store/thunks/authThunks";

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
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      description: "Overview and statistics",
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      description: "Manage all users",
      badge: stats?.pendingUsers ? stats.pendingUsers.toString() : undefined,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Reports and insights",
      disabled: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "System configuration",
      disabled: true,
    },
  ];

  return (
    <div className="bg-primary-900 shadow-lg h-screen flex flex-col justify-between">
      {/* Site Icon at Top */}
      <div className="flex items-center justify-center py-6">
        <img
          src="https://aasquebec.com/wp-content/uploads/2025/07/aasquebec-logo.svg"
          alt="Site Icon"
          className="w-20 h-20  bg-primary-700 rounded-full"
        />
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
                  ? "bg-primary-700 text-accent-500 border border-primary-400"
                  : item.disabled
                  ? "text-primary-300 cursor-not-allowed"
                  : "text-primary-100 hover:bg-primary-800"
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
                <span className="bg-accent-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
              {item.disabled && (
                <span className="text-xs bg-primary-200 text-primary-700 px-2 py-1 rounded">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-primary-700 space-y-2">
        <button
          onClick={() => onTabChange("notifications")}
          disabled
          className="w-full flex items-center space-x-3 p-3 rounded-lg text-primary-300 cursor-not-allowed"
        >
          <Bell className="h-5 w-5" />
          <span className="text-sm">Notifications</span>
          <span className="text-xs bg-primary-200 text-primary-700 px-2 py-1 rounded ml-auto">
            Soon
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 rounded-lg text-accent-500 hover:bg-accent-100 transition-colors duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
