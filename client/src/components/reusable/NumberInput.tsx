import React, { InputHTMLAttributes, forwardRef, memo } from "react";

export interface NumberInputProps
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
  min?: number;
  max?: number;
  step?: number;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
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
      min,
      max,
      step,
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

    const baseInputClasses =
      "w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm sm:text-base bg-white text-primary-900 placeholder-gray-300 transition-all duration-200";

    const errorInputClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "";

    const disabledClasses = props.disabled
      ? "bg-gray-50 cursor-not-allowed opacity-60"
      : "";

    const finalInputClasses = `${baseInputClasses} ${errorInputClasses} ${disabledClasses} ${inputClassName} ${className}`;

    return (
      <div className={`${getWidthClass()} ${containerClassName}`}>
        {label && (
          <label
            htmlFor={props.id || props.name}
            className={`block text-primary-700 font-medium mb-1 text-sm sm:text-base ${labelClassName}`}
          >
            {label}
            {required && <span className="text-accent-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type="number"
            min={min}
            max={max}
            step={step}
            className={`${finalInputClasses} ${leftIcon ? "pl-10" : ""} ${
              rightIcon ? "pr-10" : ""
            }`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none">
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

NumberInput.displayName = "NumberInput";

export default memo(NumberInput);
