import React, { ReactNode, memo } from "react";

export interface FormFieldProps {
  label?: string | ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
  width?: "full" | "half" | "third" | "quarter" | "auto" | string;
  children: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  labelAction?: ReactNode; // For buttons/links next to label (e.g., "View Property")
  inlineLabel?: boolean; // For horizontal label layout
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required = false,
  width = "full",
  children,
  containerClassName = "",
  labelClassName = "",
  labelAction,
  inlineLabel = false,
}) => {
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

  if (inlineLabel) {
    return (
      <div className={`${getWidthClass()} ${containerClassName}`}>
        <div className="flex items-center gap-4">
          {label && (
            <label
              className={`text-primary-700 font-medium text-sm sm:text-base whitespace-nowrap ${labelClassName}`}
            >
              {label}
              {required && <span className="text-accent-500 ml-1">*</span>}
            </label>
          )}
          <div className="flex-1">{children}</div>
        </div>
        {error && (
          <span className="text-red-500 text-xs mt-1 block ml-0">{error}</span>
        )}
        {helperText && !error && (
          <p className="text-xs text-primary-600 mt-1 ml-0">{helperText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`${getWidthClass()} ${containerClassName}`}>
      {(label || labelAction) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <label
              className={`block text-primary-700 font-medium text-sm sm:text-base ${labelClassName}`}
            >
              {label}
              {required && <span className="text-accent-500 ml-1">*</span>}
            </label>
          )}
          {labelAction && <div>{labelAction}</div>}
        </div>
      )}
      {children}
      {error && (
        <span className="text-red-500 text-xs mt-1 block">{error}</span>
      )}
      {helperText && !error && (
        <p className="text-xs text-primary-600 mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default memo(FormField);
