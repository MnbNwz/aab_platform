import React from "react";
import {
  Home,
  UserCircle,
  FileText,
  ClipboardList,
  CreditCard,
  Building,
  Star,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { logoutThunk } from "../../store/thunks/authThunks";

interface ContractorSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export const ContractorSidebar: React.FC<ContractorSidebarProps> = ({
  activeTab,
  onTabChange,
  isMobileOpen = false,
  onMobileToggle = () => {},
}) => {
  const dispatch = useDispatch<AppDispatch>();

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
      id: "profile",
      label: "Profile & Portfolio",
      icon: UserCircle,
      description: "Manage your profile",
    },
    {
      id: "leads",
      label: "Active Leads",
      icon: FileText,
      description: "View available leads",
    },
    {
      id: "bids",
      label: "My Bids",
      icon: ClipboardList,
      description: "Manage your bids",
    },
    {
      id: "jobs",
      label: "Job Requests",
      icon: Building,
      description: "View job requests",
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      description: "Payment history & subscription",
    },
    {
      id: "offmarket",
      label: "Off-Market Properties",
      icon: Building,
      description: "Exclusive property listings",
    },
    {
      id: "reviews",
      label: "Reviews & Feedback",
      icon: Star,
      description: "Manage reviews",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "Account settings",
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-primary-900 shadow-lg min-h-screen flex flex-col justify-between fixed md:sticky top-0 z-40 w-[280px] transition-transform duration-300 transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Mobile Toggle Button */}
        <button
          onClick={onMobileToggle}
          className="md:hidden absolute -right-12 top-4 bg-primary-900 p-2 rounded-r-lg text-white"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Site Icon at Top */}
        <div className="flex items-center justify-center py-6">
          <img
            src="https://aasquebec.com/wp-content/uploads/2025/07/aasquebec-logo.svg"
            alt="Site Icon"
            className="w-20 h-20 bg-primary-700 rounded-full"
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
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-primary-700 text-accent-500 border border-primary-400"
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
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-primary-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-accent-500 hover:bg-accent-100 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ContractorSidebar;
