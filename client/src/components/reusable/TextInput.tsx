import React, { InputHTMLAttributes, forwardRef, memo } from "react";

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "width" | "type"> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  width?: "full" | "half" | "third" | "quarter" | "auto" | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      width = "full",
      leftIcon,
      rightIcon,
      containerClassName = "",
      labelClassName = "",
      inputClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    const getWidthClass = () => {
      if (typeof width === "string" && width.startsWith("w-")) {
        return width; // Custom Tailwind width class
      }
      const widthClasses: Record<string, string> = {
        full: "w-full",
        half: "w-1/2",
        third: "w-1/3",
        quarter: "w-1/4",
        auto: "w-auto",
      };
      return widthClasses[width] || "w-full";
    };

    // Build padding classes based on icon presence
    const getPaddingClasses = () => {
      if (leftIcon && rightIcon) {
        return "pl-8 xs:pl-10 pr-8 xs:pr-10";
      } else if (leftIcon) {
        return "pl-8 xs:pl-10 pr-2 xs:pr-3";
      } else if (rightIcon) {
        return "pl-2 xs:pl-3 pr-8 xs:pr-10";
      } else {
        return "px-2 xs:px-3";
      }
    };

    const baseInputClasses = `w-full rounded-lg ${getPaddingClasses()} py-1.5 xs:py-2 sm:py-3 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-xs xs:text-sm sm:text-base bg-white text-primary-900 placeholder-primary-400 transition-all duration-200`;

    const errorInputClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "";

    const disabledClasses = props.disabled
      ? "bg-primary-50 cursor-not-allowed opacity-60"
      : "";

    const finalInputClasses = `${baseInputClasses} ${errorInputClasses} ${disabledClasses} ${inputClassName} ${className}`;

    return (
      <div className={`${getWidthClass()} ${containerClassName}`}>
        {label && (
          <label
            htmlFor={props.id || props.name}
            className={`block text-primary-700 font-medium mb-1 text-xs xs:text-sm sm:text-base ${labelClassName}`}
          >
            {label}
            {required && <span className="text-accent-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none z-10 flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type="text"
            className={finalInputClasses}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-2 xs:right-3 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none z-10 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-red-500 text-xs mt-1 block">{error}</span>
        )}
        {helperText && !error && (
          <p className="text-xs text-primary-600 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default memo(TextInput);
