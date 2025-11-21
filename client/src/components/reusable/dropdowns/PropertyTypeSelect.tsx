import React from "react";
import SelectInput from "../SelectInput";
import type { SelectOption } from "../SelectInput";

export interface PropertyTypeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  width?: "full" | "half" | "third" | "quarter" | "auto" | string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
}

const PROPERTY_TYPES: SelectOption[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
];

const PropertyTypeSelect: React.FC<PropertyTypeSelectProps> = ({
  value,
  onChange,
  error,
  required = false,
  width = "full",
  disabled = false,
  placeholder = "Select property type",
  label = "Type",
  containerClassName = "",
  labelClassName = "",
  selectClassName = "",
}) => {
  return (
    <SelectInput
      label={label}
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      options={PROPERTY_TYPES}
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

export default PropertyTypeSelect;

