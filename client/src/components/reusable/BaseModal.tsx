import React, { ReactNode, useEffect, useRef, useState, memo } from "react";
import { createPortal } from "react-dom";

// Start at 9999 to ensure modals appear above all other UI elements (sidebar z-40, etc.)
let modalZIndex = 9999;
const activeModals: Set<number> = new Set();

const getNextZIndex = (): number => {
  modalZIndex += 10;
  activeModals.add(modalZIndex);
  return modalZIndex;
};

const releaseZIndex = (zIndex: number): void => {
  activeModals.delete(zIndex);
  if (activeModals.size === 0) {
    modalZIndex = 9999;
  }
};

export interface ModalButton {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode | ModalButton[];
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  overlayClassName?: string;
  showFooter?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "4xl",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  overlayClassName = "",
  showFooter = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [zIndex, setZIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const newZIndex = getNextZIndex();
      setZIndex(newZIndex);
      return () => {
        releaseZIndex(newZIndex);
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Only close if this is the topmost modal
        const currentZIndex = zIndex;
        const isTopmost = Array.from(activeModals).every(
          (z) => z <= currentZIndex
        );
        if (isTopmost) {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, closeOnEscape, zIndex]);

  useEffect(() => {
    if (!closeOnOverlayClick || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        overlayRef.current &&
        e.target === overlayRef.current &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        // Only close if this is the topmost modal
        const currentZIndex = zIndex;
        const isTopmost = Array.from(activeModals).every(
          (z) => z <= currentZIndex
        );
        if (isTopmost) {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, closeOnOverlayClick, zIndex]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    full: "max-w-full",
  };

  const renderFooter = () => {
    if (!showFooter) return null;

    if (!footer) return null;

    // If footer is an array of buttons, render standardized footer
    if (Array.isArray(footer)) {
      return (
        <div
          className={`flex items-center justify-end gap-3 p-3 sm:p-4 border-t border-primary-200 ${footerClassName}`}
        >
          {footer.map((button, index) => {
            const baseClasses =
              "px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

            const variantClasses = {
              primary:
                "bg-accent-500 text-white hover:bg-accent-600 shadow-sm hover:shadow",
              secondary:
                "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400",
              danger:
                "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow",
              ghost:
                "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-300",
            };

            return (
              <button
                key={index}
                type={button.type || "button"}
                onClick={button.onClick}
                disabled={button.disabled || button.loading}
                className={`${baseClasses} ${
                  variantClasses[button.variant || "primary"]
                } ${button.className || ""}`}
              >
                {button.loading ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  button.leftIcon && (
                    <span className="flex-shrink-0">{button.leftIcon}</span>
                  )
                )}
                <span>{button.label}</span>
                {!button.loading && button.rightIcon && (
                  <span className="flex-shrink-0">{button.rightIcon}</span>
                )}
              </button>
            );
          })}
        </div>
      );
    }

    // If footer is custom ReactNode, render as-is
    return (
      <div
        className={`flex items-center justify-end gap-4 p-4 sm:p-6 border-t border-primary-200 ${footerClassName}`}
      >
        {footer}
      </div>
    );
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4 ${overlayClassName}`}
      style={{ zIndex }}
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === overlayRef.current) {
          // Only close if this is the topmost modal
          const currentZIndex = zIndex;
          const isTopmost = Array.from(activeModals).every(
            (z) => z <= currentZIndex
          );
          if (isTopmost) {
            onClose();
          }
        }
      }}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-2xl w-full ${maxWidthClasses[maxWidth]} mx-auto relative flex flex-col max-h-[95vh] ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: zIndex + 1 }}
      >
        {/* Standardized Header */}
        {(title || subtitle || showCloseButton) && (
          <div
            className={`flex items-center justify-between p-4 sm:p-6 border-b border-primary-200 flex-shrink-0 ${headerClassName}`}
          >
            <div className="flex-1 min-w-0 pr-4">
              {title && (
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900 truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                className="text-primary-400 hover:text-primary-600 text-2xl sm:text-3xl font-bold p-2 transition-colors flex-shrink-0"
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                &#10005;
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${bodyClassName}`}>
          {children}
        </div>

        {/* Standardized Footer */}
        {renderFooter()}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default memo(BaseModal);
