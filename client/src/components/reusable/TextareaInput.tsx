import { TextareaHTMLAttributes, forwardRef, memo } from "react";

export interface TextareaInputProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "width"> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  width?: "full" | "half" | "third" | "quarter" | "auto" | string;
  containerClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;
  rows?: number;
  resize?: boolean;
}

const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      width = "full",
      containerClassName = "",
      labelClassName = "",
      textareaClassName = "",
      className = "",
      rows = 4,
      resize = false,
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

    const baseTextareaClasses =
      "w-full rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 sm:py-3 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-xs xs:text-sm sm:text-base bg-white text-primary-900 placeholder-primary-400 transition-all duration-200";

    const errorTextareaClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "";

    const disabledClasses = props.disabled
      ? "bg-primary-50 cursor-not-allowed opacity-60"
      : "";

    const resizeClass = resize ? "" : "resize-none";

    const finalTextareaClasses = `${baseTextareaClasses} ${errorTextareaClasses} ${disabledClasses} ${resizeClass} ${textareaClassName} ${className}`;

    return (
      <div className={`${getWidthClass()} ${containerClassName}`}>
        {label && (
          <label
            className={`block text-primary-700 font-medium mb-1 text-xs xs:text-sm sm:text-base ${labelClassName}`}
          >
            {label}
            {required && <span className="text-accent-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={finalTextareaClasses}
          {...props}
        />
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

TextareaInput.displayName = "TextareaInput";

export default memo(TextareaInput);

