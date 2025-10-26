import React from "react";
import {
  Home,
  Building,
  FileText,
  Users,
  Star,
  Settings,
  LogOut,
  Heart,
  ClipboardList,
  ChartBar,
  CreditCard,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { logoutThunk } from "../../store/thunks/authThunks";

// Extended SidebarProps to include userRole property
interface ExtendedSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  userRole: "admin" | "customer" | "contractor";
}

export const Sidebar: React.FC<ExtendedSidebarProps> = ({
  activeTab,
  onTabChange,
  isMobileOpen = false,
  onMobileToggle = () => {},
  userRole,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentMembership = useSelector(
    (state: RootState) => state.membership.current
  );

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
        id: "properties",
        label: "Off Market Properties",
        icon: Building,
        description: "Manage off market properties",
      },
      {
        id: "jobs",
        label: "Jobs Management",
        icon: FileText,
        description: "Manage jobs and bids",
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
        id: "favorites",
        label: "Favorite Contractors",
        icon: Heart,
        description: "Your trusted contractors",
      },
      {
        id: "reviews",
        label: "Reviews",
        icon: Star,
        description: "Manage reviews",
      },
      {
        id: "billing-history",
        label: "Billing History",
        icon: CreditCard,
        description: "Payment history and receipts",
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
        id: "offMarket",
        label: "Off Market Properties",
        icon: Building,
        description: "Investment opportunities",
      },
      {
        id: "interestedProperties",
        label: "Interested Properties",
        icon: Heart,
        description: "Your expressed interests",
      },
      {
        id: "jobs",
        label: "Available Jobs",
        icon: Building,
        description: "Browse and apply to jobs",
      },
      {
        id: "bids",
        label: "My Bids",
        icon: ClipboardList,
        description: "Manage your bids",
      },
      {
        id: "billing-history",
        label: "Billing History",
        icon: CreditCard,
        description: "Payment history and receipts",
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

  let menuItems = menuItemsByRole[userRole] || [];

  // Hide "Interested Properties" for basic tier contractors
  // "Off Market Properties" remains visible (shows teaser for basic tier)
  if (userRole === "contractor") {
    const hasAccess =
      currentMembership &&
      currentMembership.status === "active" &&
      (currentMembership.planId.tier === "standard" ||
        currentMembership.planId.tier === "premium");

    if (!hasAccess) {
      menuItems = menuItems.filter((item: any) => {
        // Hide "Interested Properties" for basic tier
        return item.id !== "interestedProperties";
      });
    }
  }

  // Add Sign Out as the last menu item
  menuItems = [
    ...menuItems,
    {
      id: "signout",
      label: "Sign Out",
      icon: LogOut,
      description: "Sign out of your account",
      isSignOut: true,
    } as any,
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="mobile-overlay bg-black/30 md:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar-container bg-primary-900 shadow-lg flex flex-col fixed md:sticky top-0 z-40 w-[240px] sm:w-[260px] md:w-[280px] transition-transform duration-300 transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Site Icon at Top */}
        <div className="flex items-center justify-center py-3 sm:py-4 md:py-6 flex-shrink-0">
          <img
            src="https://aasquebec.com/wp-content/uploads/2025/07/aasquebec-logo.svg"
            alt="Site Icon"
            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-primary-700 rounded-full"
          />
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {menuItems.map((item: any) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isSignOut) {
                    handleLogout();
                  } else {
                    onTabChange(item.id);
                  }
                  if (isMobileOpen) {
                    onMobileToggle();
                  }
                }}
                className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-primary-700 text-accent-500 border border-primary-400"
                    : item.isSignOut
                    ? "text-accent-500 hover:bg-primary-800"
                    : "text-primary-100 hover:bg-primary-800"
                }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-base sm:text-sm font-medium">
                      {item.label}
                    </p>
                    <p className="text-[10px] sm:text-xs opacity-75 hidden sm:block">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
