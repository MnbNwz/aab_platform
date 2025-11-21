import React, { ReactNode } from "react";

interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  width?: "full" | "half" | "third" | "quarter" | "auto";
  children: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  labelAction?: ReactNode; // For buttons/links next to label
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
}) => {
  const widthClasses = {
    full: "w-full",
    half: "w-1/2",
    third: "w-1/3",
    quarter: "w-1/4",
    auto: "w-auto",
  };

  return (
    <div className={`${widthClasses[width]} ${containerClassName}`}>
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

export default FormField;

