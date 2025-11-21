import React from "react";
import SelectInput from "../SelectInput";
import type { SelectOption } from "../SelectInput";

export interface TimelineSelectProps {
  value?: string | number;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  width?: "full" | "half" | "third" | "quarter" | "auto" | string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  minDays?: number;
  maxDays?: number;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
}

const TimelineSelect: React.FC<TimelineSelectProps> = ({
  value,
  onChange,
  error,
  required = false,
  width = "full",
  disabled = false,
  placeholder = "Select timeline",
  label = "Timeline (Days)",
  minDays = 1,
  maxDays = 365,
  containerClassName = "",
  labelClassName = "",
  selectClassName = "",
}) => {
  // Generate options from minDays to maxDays
  const options: SelectOption[] = Array.from(
    { length: maxDays - minDays + 1 },
    (_, i) => {
      const days = minDays + i;
      return {
        value: days,
        label: `${days} ${days === 1 ? "day" : "days"}`,
      };
    }
  );

  return (
    <SelectInput
      label={label}
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      options={options}
      placeholder={placeholder}
      error={error}
      required={required}
      width={width}
      disabled={disabled}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      selectClassName={selectClassName}
    />
  );
};

export default TimelineSelect;

