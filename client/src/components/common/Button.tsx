import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses = "font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1 xs:gap-2";

  const variantClasses = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500",
    secondary:
      "bg-white text-primary-700 border-2 border-primary-300 hover:bg-primary-50 hover:border-primary-400",
    accent:
      "bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 focus:ring-2 focus:ring-accent-500",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500",
    ghost:
      "bg-transparent text-primary-700 hover:bg-primary-50 focus:ring-2 focus:ring-primary-500",
  };

  const sizeClasses = {
    sm: "px-2 xs:px-3 py-1 xs:py-1.5 text-xs xs:text-sm",
    md: "px-3 xs:px-4 py-1.5 xs:py-2.5 text-sm xs:text-base",
    lg: "px-4 xs:px-6 py-2 xs:py-3.5 text-base xs:text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  const finalClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className} ${
    (disabled || loading) ? "opacity-50 cursor-not-allowed" : ""
  }`;

  return (
    <button
      className={finalClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5"
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
      )}
      {!loading && leftIcon && <span>{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};

export default Button;

