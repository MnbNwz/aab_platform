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
  };
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  profileLabel?: string;
  settingsLabel?: string;
  logoutLabel?: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  onProfile,
  onSettings,
  onLogout,
  profileLabel = "View Profile",
  settingsLabel = "Settings",
  logoutLabel = "Logout",
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
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-1 xs:space-x-2 bg-white border border-gray-200 rounded-full px-2 xs:px-3 py-1.5 xs:py-2 shadow hover:bg-gray-50 focus:outline-none"
        onClick={() => setOpen((o) => !o)}
      >
        <UserIcon className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
        <span
          className="hidden sm:inline text-xs xs:text-sm font-medium text-gray-900 truncate max-w-20 xs:max-w-24 md:max-w-32 lg:max-w-40"
          title={user?.firstName}
        >
          {user?.firstName}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 xs:w-56 bg-white border border-gray-200 rounded-2xl shadow-lg py-3 xs:py-4 px-3 xs:px-4 z-30 flex flex-col items-center">
          <UserIcon className="h-8 w-8 xs:h-10 xs:w-10 text-blue-600 mb-2" />
          <div
            className="text-base xs:text-lg font-semibold text-gray-900 mb-1 text-center truncate max-w-full px-2"
            title={`${user?.firstName} ${user?.lastName}`}
          >
            {user?.firstName} {user?.lastName}
          </div>
          <div
            className="text-xs xs:text-sm text-gray-500 mb-3 xs:mb-4 text-center truncate max-w-full px-2"
            title={user?.email}
          >
            {user?.email}
          </div>
          {onProfile && (
            <button
              className="w-full flex items-center justify-center px-3 xs:px-4 py-1.5 xs:py-2 text-gray-700 hover:bg-gray-100 rounded-xl mb-1 xs:mb-2 text-sm xs:text-base"
              onClick={() => {
                setOpen(false);
                onProfile();
              }}
            >
              {profileLabel}
            </button>
          )}
          {onSettings && (
            <button
              className="w-full flex items-center justify-center px-3 xs:px-4 py-1.5 xs:py-2 text-gray-700 hover:bg-gray-100 rounded-xl mb-1 xs:mb-2 text-sm xs:text-base"
              onClick={() => {
                setOpen(false);
                onSettings();
              }}
            >
              <SettingsIcon className="h-4 w-4 xs:h-5 xs:w-5 mr-1 xs:mr-2" />{" "}
              {settingsLabel}
            </button>
          )}
          {onLogout && (
            <button
              className="w-full flex items-center justify-center px-3 xs:px-4 py-1.5 xs:py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm xs:text-base"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOutIcon className="h-4 w-4 xs:h-5 xs:w-5 mr-1 xs:mr-2" />{" "}
              {logoutLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
