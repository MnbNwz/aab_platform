import React, { FC } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

export interface ActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "warning" | "success" | "info";
  className?: string;
}

export interface ActionDropdownProps {
  items: ActionItem[];
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  position?: "left" | "right";
  size?: "sm" | "md" | "lg";
  trigger?: React.ReactNode;
}

const ActionDropdown: FC<ActionDropdownProps> = ({
  items,
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  position = "right",
  size = "md",
  trigger,
}) => {
  const getVariantStyles = (variant: ActionItem["variant"]) => {
    switch (variant) {
      case "danger":
        return "text-red-700 hover:bg-red-50";
      case "warning":
        return "text-orange-700 hover:bg-orange-50";
      case "success":
        return "text-green-700 hover:bg-green-50";
      case "info":
        return "text-blue-700 hover:bg-blue-50";
      default:
        return "text-gray-700 hover:bg-gray-50";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "p-1";
      case "lg":
        return "p-2";
      default:
        return "p-1.5";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-4 w-4";
    }
  };

  const getMenuPosition = () => {
    return position === "left" ? "left-0" : "right-0";
  };

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <Menu.Button
        disabled={disabled}
        className={`
          ${getSizeStyles()}
          text-gray-400 hover:text-gray-600 hover:bg-gray-100 
          rounded-full transition-colors disabled:opacity-50
          ${buttonClassName}
        `}
        title="More actions"
      >
        {trigger || (
          <svg
            className={getIconSize()}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`
            absolute ${getMenuPosition()} z-10 mt-2 w-48 origin-top-right 
            rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 
            focus:outline-none ${menuClassName}
          `}
        >
          <div className="py-1">
            {items.map((item) => (
              <Menu.Item key={item.id}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`
                      ${active ? "bg-gray-50" : ""}
                      group flex w-full items-center px-4 py-2 text-sm 
                      ${getVariantStyles(item.variant)}
                      disabled:opacity-50 transition-colors
                      ${item.className || ""}
                    `}
                  >
                    {item.icon && (
                      <span className="mr-3 flex-shrink-0">
                        {React.isValidElement(item.icon)
                          ? React.cloneElement(item.icon, {
                              className: getIconSize(),
                            })
                          : item.icon}
                      </span>
                    )}
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ActionDropdown;
