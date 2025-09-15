import React from "react";
import UserDropdown from "./UserDropdown";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  children?: React.ReactNode;
  showHamburger?: boolean;
  onHamburgerClick?: () => void;
  isSidebarOpen?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  user,
  onProfile,
  onSettings,
  onLogout,
  children,
  showHamburger = false,
  onHamburgerClick,
  isSidebarOpen = false,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between gap-4">
        {/* Hamburger Icon - Only on screens less than 768px and when sidebar is closed */}
        <div className="w-12 flex-shrink-0 block md:hidden"></div>
        {showHamburger && !isSidebarOpen && (
          <button
            onClick={onHamburgerClick}
            className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-3 py-2 shadow hover:bg-gray-50 focus:outline-none transition-colors"
          >
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Spacer for mobile layout */}
      <div className="w-12 flex-shrink-0 block md:hidden"></div>

      {/* Centered Title Section */}
      <div className="flex-1 text-center min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-600 truncate">{subtitle}</p>
        )}
        {children && <div className="mt-1">{children}</div>}
      </div>

      {/* User Dropdown Section */}
      <div className="w-12 sm:w-16 md:w-20 lg:w-24 flex-shrink-0 flex justify-end">
        <UserDropdown
          user={user}
          onProfile={onProfile}
          onSettings={onSettings}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
};

export default PageHeader;
