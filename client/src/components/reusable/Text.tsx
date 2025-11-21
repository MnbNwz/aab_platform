import React, { ReactNode, memo } from "react";

export interface TextProps {
  children: ReactNode;
  variant?:
    | "body"
    | "label"
    | "caption"
    | "error"
    | "success"
    | "warning"
    | "info";
  size?: "xs" | "sm" | "base" | "lg" | "xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?:
    | "primary"
    | "secondary"
    | "accent"
    | "gray"
    | "error"
    | "success"
    | "warning";
  className?: string;
  as?: "p" | "span" | "div";
  align?: "left" | "center" | "right";
  truncate?: boolean;
  title?: string;
}

/**
 * Reusable Text component for consistent typography
 * Replaces common <p> tag usage with a semantic, reusable component
 */
const Text: React.FC<TextProps> = ({
  children,
  variant = "body",
  size = "base",
  weight = "normal",
  color = "primary",
  className = "",
  as,
  align = "left",
  truncate = false,
  title,
}) => {
  const Component = as || "span";

  // Variant-based styles
  const variantClasses = {
    body: "text-primary-600",
    label: "text-primary-700 font-medium",
    caption: "text-primary-500",
    error: "text-red-500",
    success: "text-green-600",
    warning: "text-orange-600",
    info: "text-blue-600",
  };

  // Size-based styles
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  // Weight-based styles
  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  // Color-based styles (overrides variant if specified)
  const colorClasses = {
    primary: "text-primary-600",
    secondary: "text-gray-600",
    accent: "text-accent-600",
    gray: "text-gray-500",
    error: "text-red-500",
    success: "text-green-600",
    warning: "text-orange-600",
  };

  // Alignment classes
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const baseClasses = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const weightClass = weightClasses[weight];
  const colorClass = colorClasses[color];
  const alignClass = alignClasses[align];
  const truncateClass = truncate ? "truncate" : "";

  return (
    <Component
      className={`${baseClasses} ${sizeClass} ${weightClass} ${colorClass} ${alignClass} ${truncateClass} ${className}`.trim()}
      title={title}
    >
      {children}
    </Component>
  );
};

export default memo(Text);
