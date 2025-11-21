// Reusable Form Components
// These are generic, reusable components that can be used across the application
// All components rely on props for configuration and are designed to be flexible

// Core Components
export { default as BaseModal } from "./BaseModal";
export type { BaseModalProps, ModalButton } from "./BaseModal";

export { default as TextInput } from "./TextInput";
export type { TextInputProps } from "./TextInput";

export { default as NumberInput } from "./NumberInput";
export type { NumberInputProps } from "./NumberInput";

export { default as TextareaInput } from "./TextareaInput";
export type { TextareaInputProps } from "./TextareaInput";

export { default as SelectInput } from "./SelectInput";
export type { SelectInputProps, SelectOption } from "./SelectInput";

export { default as FormField } from "./FormField";
export type { FormFieldProps } from "./FormField";

export { default as InfoField } from "./InfoField";
export type { InfoFieldProps } from "./InfoField";

export { default as Badge } from "./Badge";
export type { BadgeProps } from "./Badge";

export { default as Text } from "./Text";
export type { TextProps } from "./Text";

export { default as Button } from "./Button";
export type { ButtonProps } from "./Button";

// Reusable Dropdowns with Static Options
export * from "./dropdowns";
