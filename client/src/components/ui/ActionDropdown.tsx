import React, { FC, useState, useRef, useEffect } from "react";
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
  forceUpward?: boolean;
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
  forceUpward = false,
}) => {
  const [shouldOpenUpward, setShouldOpenUpward] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkPosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Check for pagination element specifically
        const paginationElement = document.querySelector(
          '[class*="pagination"], [class*="border-t"]'
        );
        let paginationOffset = 0;

        if (paginationElement) {
          const paginationRect = paginationElement.getBoundingClientRect();
          // If pagination is below the button and within reasonable distance
          if (
            paginationRect.top > rect.bottom &&
            paginationRect.top < rect.bottom + 300
          ) {
            paginationOffset = paginationRect.height + 20; // Add some padding
          }
        }

        // Calculate effective space below considering pagination
        const effectiveSpaceBelow = spaceBelow - paginationOffset;

        // If forceUpward is true or there's insufficient space below, open upward
        setShouldOpenUpward(
          forceUpward ||
            (effectiveSpaceBelow < 200 && spaceAbove > effectiveSpaceBelow)
        );
      }
    };

    // Check position on mount and when window resizes
    checkPosition();
    window.addEventListener("resize", checkPosition);

    // Also check when scrolling to handle dynamic content
    window.addEventListener("scroll", checkPosition);

    return () => {
      window.removeEventListener("resize", checkPosition);
      window.removeEventListener("scroll", checkPosition);
    };
  }, [forceUpward]);

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
    const horizontalPos = position === "left" ? "left-0" : "right-0";
    const verticalPos = shouldOpenUpward ? "bottom-full mb-2" : "top-full mt-2";
    return `${horizontalPos} ${verticalPos}`;
  };

  const getMenuOrigin = () => {
    if (shouldOpenUpward) {
      return position === "left" ? "origin-bottom-left" : "origin-bottom-right";
    }
    return position === "left" ? "origin-top-left" : "origin-top-right";
  };

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <Menu.Button
        ref={buttonRef}
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
            absolute ${getMenuPosition()} z-10 w-48 ${getMenuOrigin()}
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
                          ? React.cloneElement(
                              item.icon as React.ReactElement<any>,
                              {
                                className: getIconSize(),
                              }
                            )
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
