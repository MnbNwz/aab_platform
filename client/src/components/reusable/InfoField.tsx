import React, { ReactNode, memo } from "react";

export interface InfoFieldProps {
  label: string | ReactNode;
  value: string | number | ReactNode;
  labelClassName?: string;
  valueClassName?: string;
  containerClassName?: string;
  inline?: boolean;
}

/**
 * Reusable component for displaying label-value pairs
 * Replaces common span usage with semantic HTML
 */
const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  labelClassName = "block text-primary-700 font-medium mb-1 text-sm sm:text-base",
  valueClassName = "block text-primary-600 text-sm sm:text-base",
  containerClassName = "",
  inline = false,
}) => {
  // Check if value is a React element (not a string/number)
  const isValueElement = React.isValidElement(value);

  if (inline) {
    return (
      <div className={`flex items-center gap-2 ${containerClassName}`}>
        <span className={labelClassName}>{label}:</span>
        {isValueElement ? (
          <div className={valueClassName}>{value}</div>
        ) : (
          <span className={valueClassName}>{value}</span>
        )}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <p className={labelClassName}>{label}</p>
      {isValueElement ? (
        <div className={valueClassName}>{value}</div>
      ) : (
        <p className={valueClassName}>{value}</p>
      )}
    </div>
  );
};

export default memo(InfoField);

