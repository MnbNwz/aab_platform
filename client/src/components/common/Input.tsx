import React, { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "width"> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  width?: "full" | "half" | "third" | "quarter" | "auto";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
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
    const widthClasses = {
      full: "w-full",
      half: "w-1/2",
      third: "w-1/3",
      quarter: "w-1/4",
      auto: "w-auto",
    };

    const baseInputClasses =
      "w-full rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 sm:py-3 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-xs xs:text-sm sm:text-base bg-white text-primary-900 placeholder-primary-400 transition-all duration-200";

    const errorInputClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "";

    const finalInputClasses = `${baseInputClasses} ${errorInputClasses} ${inputClassName} ${className}`;

    return (
      <div className={`${widthClasses[width]} ${containerClassName}`}>
        {label && (
          <label
            className={`block text-primary-700 font-medium mb-1 text-xs xs:text-sm sm:text-base ${labelClassName}`}
          >
            {label}
            {required && <span className="text-accent-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`${finalInputClasses} ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600">
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

Input.displayName = "Input";

export default Input;

