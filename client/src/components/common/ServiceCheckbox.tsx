import React, { memo, useMemo } from "react";
import { isServiceSelected } from "../../utils";

interface ServiceCheckboxProps {
  service: string;
  selectedServices: string[];
  onChange: (service: string, checked: boolean) => void;
  disabled?: boolean;
  variant?: "light" | "dark";
  size?: "sm" | "md";
}

const CheckmarkIcon: React.FC<{ className?: string }> = memo(
  ({ className }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
);
CheckmarkIcon.displayName = "CheckmarkIcon";

export const ServiceCheckbox: React.FC<ServiceCheckboxProps> = memo(({
  service,
  selectedServices,
  onChange,
  disabled = false,
  variant = "light",
  size = "md",
}) => {
  const isChecked = useMemo(
    () => isServiceSelected(service, selectedServices),
    [service, selectedServices]
  );

  const sizeClasses = useMemo(
    () => ({
      sm: {
        checkbox: "w-4 h-4",
        icon: "w-3 h-3",
        text: "text-sm",
      },
      md: {
        checkbox: "w-5 h-5",
        icon: "w-3 h-3",
        text: "text-sm",
      },
    }),
    []
  );

  const variantClasses = useMemo(
    () => ({
      light: {
        checked: "border-primary-500 bg-primary-500",
        unchecked: "border-primary-300 bg-white",
        text: isChecked ? "text-primary-700" : "text-primary-600",
      },
      dark: {
        checked: "border-accent-500 bg-accent-500",
        unchecked: "border-white/20 bg-transparent",
        text: "text-white",
      },
    }),
    [isChecked]
  );

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  const formattedServiceName = useMemo(
    () =>
      service.charAt(0).toUpperCase() + service.slice(1).replace("_", " "),
    [service]
  );

  const handleChange = useMemo(
    () => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(service, e.target.checked);
    },
    [service, onChange]
  );

  return (
    <label
      className={`relative flex items-center gap-2 cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${variant === "light" ? "p-3 rounded-lg border-2" : ""} ${
        variant === "light"
          ? isChecked
            ? "border-primary-500 bg-primary-50 shadow-sm"
            : "border-primary-200 bg-white hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-sm"
          : ""
      } transition-all duration-200`}
    >
      <div
        className={`flex-shrink-0 ${currentSize.checkbox} rounded border-2 flex items-center justify-center transition-all ${
          isChecked
            ? currentVariant.checked
            : currentVariant.unchecked
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        {isChecked && (
          <CheckmarkIcon className={`${currentSize.icon} text-white`} />
        )}
      </div>
      <input
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />
      <span
        className={`${currentSize.text} font-medium capitalize ${currentVariant.text}`}
      >
        {formattedServiceName}
      </span>
    </label>
  );
});
ServiceCheckbox.displayName = "ServiceCheckbox";

