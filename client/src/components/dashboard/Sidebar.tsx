import React from "react";
import {
  Home,
  Building,
  FileText,
  Users,
  Calculator,
  CreditCard,
  Star,
  Settings,
  LogOut,
  Heart,
  Menu,
  UserCircle,
  ClipboardList,
  ChartBar,
  ShieldCheck,
} from "lucide-react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { logoutThunk } from "../../store/thunks/authThunks";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  userRole: "admin" | "customer" | "contractor";
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isMobileOpen = false,
  onMobileToggle = () => {},
  userRole,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  // Define menu items for each role
  const menuItemsByRole = {
    admin: [
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
        description: "Manage system users",
      },
      {
        id: "approvals",
        label: "Approvals",
        icon: ShieldCheck,
        description: "Review pending approvals",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: ChartBar,
        description: "System analytics",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        description: "System settings",
      },
    ],
    customer: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: Home,
        description: "Overview and statistics",
      },
      {
        id: "properties",
        label: "My Properties",
        icon: Building,
        description: "Manage your properties",
      },
      {
        id: "jobs",
        label: "Job Management",
        icon: FileText,
        description: "Manage your jobs",
      },
      {
        id: "contractors",
        label: "Find Contractors",
        icon: Users,
        description: "Search for contractors",
      },
      {
        id: "favorites",
        label: "Favorite Contractors",
        icon: Heart,
        description: "Your trusted contractors",
      },
      {
        id: "calculators",
        label: "Calculators",
        icon: Calculator,
        description: "Cost estimation tools",
      },
      {
        id: "payments",
        label: "Payments",
        icon: CreditCard,
        description: "Payment history & subscription",
      },
      {
        id: "reviews",
        label: "Reviews",
        icon: Star,
        description: "Manage reviews",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        description: "Account settings",
      },
    ],
    contractor: [
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
    ],
  };

  const menuItems = menuItemsByRole[userRole] || [];

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
          className={`md:hidden p-2 absolute top-4
    ${isMobileOpen ? "right-2 z-50" : "-right-12"}`}
        >
          <Menu
            className={`h-6 w-6 ${
              isMobileOpen ? "text-white" : "text-primary-900"
            }`}
          />
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

export default Sidebar;
