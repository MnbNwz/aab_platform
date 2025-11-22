import React, { memo } from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "primary";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Reusable badge component for status indicators
 * Replaces inline span badges with semantic component
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "info",
  size = "sm",
  className = "",
}) => {
  const variantClasses = {
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-orange-100 text-orange-800 border-orange-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    primary: "bg-primary-100 text-primary-800 border-primary-200",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  // Check if className includes custom colors - if so, skip variant classes entirely
  // Check for both important (!) and regular color classes
  const hasCustomColors = Boolean(
    className &&
      (className.includes("!bg-") ||
        className.includes("!text-") ||
        className.includes("bg-") ||
        className.includes("text-"))
  );

  const baseClasses = `inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`;

  // CRITICAL: When custom colors are provided, completely exclude variant classes
  // This prevents white-on-white or other color conflicts
  const variantClass = hasCustomColors
    ? ""
    : `${variantClasses[variant]} border`;

  // Build final className ensuring custom className comes last to override
  // Filter out empty strings to avoid extra spaces
  const classParts = [baseClasses];

  // Only add variant classes if NO custom colors are provided
  if (!hasCustomColors && variantClass) {
    classParts.push(variantClass);
  }

  // Always add custom className last so it can override everything
  if (className) {
    classParts.push(className);
  }

  const finalClassName = classParts.filter(Boolean).join(" ").trim();

  return <span className={finalClassName}>{children}</span>;
};

export default memo(Badge);
