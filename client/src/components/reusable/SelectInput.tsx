import { SelectHTMLAttributes, forwardRef, memo } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "width"> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  width?: "full" | "half" | "third" | "quarter" | "auto" | string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
}

const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      width = "full",
      options,
      placeholder,
      containerClassName = "",
      labelClassName = "",
      selectClassName = "",
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

    const baseSelectClasses =
      "w-full rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 sm:py-3 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-xs xs:text-sm sm:text-base bg-white text-primary-900 appearance-none transition-all duration-200";

    const errorSelectClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "";

    const disabledClasses = props.disabled
      ? "bg-primary-50 cursor-not-allowed opacity-60"
      : "";

    const finalSelectClasses = `${baseSelectClasses} ${errorSelectClasses} ${disabledClasses} ${selectClassName} ${className}`;

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
          <select ref={ref} className={finalSelectClasses} {...props}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {/* Dropdown arrow icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
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

SelectInput.displayName = "SelectInput";

export default memo(SelectInput);

