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
    <div className="relative bg-gradient-to-r from-primary-800 to-accent-600 shadow-lg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="header-container relative px-2 xs:px-3 sm:px-4 lg:px-6 py-2 xs:py-3 sm:py-4">
        <div className="header-gap flex items-center justify-between gap-1 xs:gap-2 sm:gap-4">
          {/* Left Section - Hamburger Icon (hidden on md+ screens) */}
          <div className="flex-shrink-0">
            {showHamburger && !isSidebarOpen && (
              <button
                onClick={onHamburgerClick}
                className="flex items-center justify-center h-8 xs:h-9 sm:h-10 bg-white/10 backdrop-blur-sm border border-primary-300/50 rounded-lg shadow-md hover:bg-primary-300/20 hover:border-primary-200/70 focus:outline-none transition-all duration-200 md:hidden px-2 xs:px-2.5 sm:px-3"
              >
                <svg
                  className="h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5 text-accent-200"
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

          {/* Center Section - Title */}
          <div className="flex-1 text-center min-w-0 px-1 xs:px-2">
            <div className="relative">
              {/* Title with gradient text */}
              <h1 className="header-title text-sm xs:text-base sm:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-primary-100 via-accent-200 to-primary-100 bg-clip-text text-transparent truncate drop-shadow-sm">
                {title}
              </h1>

              {/* Decorative line - only on larger screens */}
              <div className="hidden sm:flex justify-center mt-1 mb-2">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-accent-500 to-transparent rounded-full"></div>
              </div>

              {subtitle && (
                <p className="header-subtitle text-xs xs:text-xs sm:text-sm text-primary-100/90 truncate font-medium">
                  {subtitle}
                </p>
              )}

              {children && <div className="mt-1 xs:mt-2">{children}</div>}
            </div>
          </div>

          {/* Right Section - User Dropdown */}
          <div className="flex-shrink-0 relative z-50">
            <UserDropdown
              user={user}
              onProfile={onProfile}
              onSettings={onSettings}
              onLogout={onLogout}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
