import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "width"> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  width?: "full" | "half" | "third" | "quarter" | "auto";
  containerClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;
  rows?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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

    const baseTextareaClasses =
      "w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm sm:text-base bg-white text-primary-900 placeholder-gray-300 resize-none transition-all duration-200";

    const errorTextareaClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "";

    const finalTextareaClasses = `${baseTextareaClasses} ${errorTextareaClasses} ${textareaClassName} ${className}`;

    return (
      <div className={`${widthClasses[width]} ${containerClassName}`}>
        {label && (
          <label
            className={`block text-primary-700 font-medium mb-1 text-sm sm:text-base ${labelClassName}`}
          >
            {label}
            {required && <span className="text-accent-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={finalTextareaClasses}
          rows={rows}
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

Textarea.displayName = "Textarea";

export default Textarea;

