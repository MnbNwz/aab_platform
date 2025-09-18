import React, { useState, useRef, useEffect } from "react";
import {
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
} from "lucide-react";

interface UserDropdownProps {
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
  };
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  profileLabel?: string;
  settingsLabel?: string;
  logoutLabel?: string;
  prominent?: boolean;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  onProfile,
  onSettings,
  onLogout,
  profileLabel = "View Profile",
  settingsLabel = "Settings",
  logoutLabel = "Logout",
  prominent = false,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    // <div className="relative" ref={dropdownRef}>
    <div className="relative z-[10001]" ref={dropdownRef}>
      <button
        className={`flex items-center space-x-0.5 xs:space-x-1 sm:space-x-2 rounded-lg px-1.5 xs:px-2 sm:px-3 h-8 xs:h-9 sm:h-10 shadow-md focus:outline-none transition-all duration-200 ${
          prominent
            ? "bg-white/90 backdrop-blur-sm border border-primary-400/70 hover:bg-white hover:border-primary-500/80 shadow-lg"
            : "bg-white/20 backdrop-blur-sm border border-primary-300/50 hover:bg-primary-300/20 hover:border-primary-200/70"
        }`}
        onClick={() => setOpen((o) => !o)}
      >
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={`${user?.firstName} ${user?.lastName}`}
            className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <UserIcon
          className={`h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
            user?.profileImage ? "hidden" : ""
          } ${prominent ? "text-accent-600" : "text-accent-200"}`}
        />
        <span
          className={`hidden xs:inline text-xs sm:text-sm font-medium truncate max-w-16 xs:max-w-20 md:max-w-24 lg:max-w-32 ${
            prominent ? "text-primary-700" : "text-primary-100"
          }`}
          title={user?.firstName}
        >
          {user?.firstName}
        </span>
        <svg
          className={`h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${
            prominent ? "text-accent-600" : "text-accent-200"
          }`}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl py-4 px-4 z-[60] flex flex-col items-center animate-in slide-in-from-top-2 duration-200">
          <div className="w-12 h-12 rounded-full mb-3 shadow-lg overflow-hidden">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center ${
                user?.profileImage ? "hidden" : ""
              }`}
            >
              <UserIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div
            className="text-base font-semibold text-gray-900 mb-1 text-center truncate max-w-full px-2"
            title={`${user?.firstName} ${user?.lastName}`}
          >
            {user?.firstName} {user?.lastName}
          </div>
          <div
            className="text-sm text-gray-600 mb-4 text-center truncate max-w-full px-2"
            title={user?.email}
          >
            {user?.email}
          </div>
          {onProfile && (
            <button
              className="w-full flex items-center justify-center px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 rounded-xl mb-2 text-sm font-medium transition-all duration-200 hover:shadow-md"
              onClick={() => {
                setOpen(false);
                onProfile();
              }}
            >
              <UserIcon className="h-4 w-4 mr-2" />
              {profileLabel}
            </button>
          )}
          {onSettings && (
            <button
              className="w-full flex items-center justify-center px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 rounded-xl mb-2 text-sm font-medium transition-all duration-200 hover:shadow-md"
              onClick={() => {
                setOpen(false);
                onSettings();
              }}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              {settingsLabel}
            </button>
          )}
          {onLogout && (
            <button
              className="w-full flex items-center justify-center px-4 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              {logoutLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
