import { useState, useCallback, memo, useMemo } from "react";
import { Filter } from "lucide-react";

// Filter field types
export type FilterFieldType = "select" | "input" | "number" | "date";

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface FilterField {
  name: string;
  label: string;
  type: FilterFieldType;
  options?: FilterOption[];
  placeholder?: string;
  value: any;
}

export interface FilterColumns {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}

export interface FilterPanelProps<T extends Record<string, any>> {
  // Display mode
  mode?: "inline" | "collapsible";

  // Filters configuration
  fields: FilterField[];

  // State management
  values: T;
  onChange: (values: T) => void;

  // Actions
  onApply?: () => void;
  onClear?: () => void;

  // Display options
  showApplyButton?: boolean;
  showClearButton?: boolean;
  showFilterIcon?: boolean;

  // Responsive
  columns?: FilterColumns;

  // Styling
  variant?: "default" | "compact";
  className?: string;

  // Additional props
  title?: string;
  onToggle?: (isOpen: boolean) => void;
}

const FilterPanel = memo(function FilterPanel<T extends Record<string, any>>({
  mode = "inline",
  fields,
  values,
  onChange,
  onApply,
  onClear,
  showApplyButton = false,
  showClearButton = false,
  showFilterIcon = true,
  columns = { mobile: 1, tablet: 2, desktop: 4 },
  variant: _variant = "default",
  className = "",
  title,
  onToggle,
}: FilterPanelProps<T>) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Handle field change
  const handleFieldChange = useCallback(
    (name: string, value: any) => {
      onChange({
        ...values,
        [name]: value,
      });
    },
    [values, onChange]
  );

  // Handle toggle
  const handleToggle = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onToggle?.(newState);
  }, [isCollapsed, onToggle]);

  // Handle apply
  const handleApply = useCallback(() => {
    onApply?.();
  }, [onApply]);

  // Handle clear
  const handleClear = useCallback(() => {
    const clearedValues = { ...values } as any;
    fields.forEach((field) => {
      clearedValues[field.name] = "";
    });
    onChange(clearedValues);
    onClear?.();
  }, [values, fields, onChange, onClear]);

  // Grid classes based on responsive columns - memoized
  const gridClasses = useMemo(() => {
    const mobile = columns.mobile || 1;
    const tablet = columns.tablet || 2;
    const desktop = columns.desktop || 4;

    // Map column counts to Tailwind classes
    const getColClass = (count: number) => {
      const colMap: Record<number, string> = {
        1: "grid-cols-1",
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
      };
      return colMap[count] || "grid-cols-1";
    };

    return `grid ${getColClass(mobile)} sm:${getColClass(
      tablet
    )} lg:${getColClass(desktop)} gap-4`;
  }, [columns]);

  // Render filter field based on type
  const renderField = useCallback(
    (field: FilterField) => {
      const commonClasses =
        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-sm transition-colors placeholder-gray-300";

      switch (field.type) {
        case "select":
          return (
            <select
              value={field.value || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={commonClasses}
              aria-label={field.label}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case "input":
          return (
            <input
              type="text"
              value={field.value || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={commonClasses}
              aria-label={field.label}
            />
          );

        case "number":
          return (
            <input
              type="number"
              value={field.value || ""}
              onChange={(e) =>
                handleFieldChange(
                  field.name,
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              placeholder={field.placeholder}
              className={commonClasses}
              aria-label={field.label}
            />
          );

        case "date":
          return (
            <input
              type="date"
              value={field.value || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={commonClasses}
              aria-label={field.label}
            />
          );

        default:
          return null;
      }
    },
    [handleFieldChange]
  );

  // Inline mode (always visible)
  if (mode === "inline") {
    const isSingleField = fields.length === 1;

    // Single field: render inline with Filter icon
    if (isSingleField && showFilterIcon) {
      const field = fields[0];
      return (
        <div
          className={`px-4 sm:px-6 py-4 border-b border-gray-200 bg-white ${className}`}
        >
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <label
                className="text-sm mr-2 font-medium text-gray-700 whitespace-nowrap"
                htmlFor={field.name}
              >
                {field.label}:
              </label>
              <div className="flex-1 max-w-xs">{renderField(field)}</div>
            </div>
          </div>
        </div>
      );
    }

    // Multiple fields: render in grid below Filter icon
    return (
      <div
        className={`px-4 sm:px-6 py-4 border-b border-gray-200 bg-white ${className}`}
      >
        <div className="flex flex-col gap-3">
          {showFilterIcon && (
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {title || "Filters"}:
              </span>
            </div>
          )}
          <div className={gridClasses}>
            {fields.map((field) => (
              <div key={field.name}>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                  htmlFor={field.name}
                >
                  {field.label}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Collapsible mode (toggle button)
  return (
    <div className={className}>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Show filters" : "Hide filters"}
      >
        <Filter className="h-4 w-4" />
        <span>{title || "Filters"}</span>
      </button>

      {/* Collapsible Panel */}
      {!isCollapsed && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className={gridClasses}>
            {fields.map((field) => (
              <div key={field.name}>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                  htmlFor={field.name}
                >
                  {field.label}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {(showApplyButton || showClearButton) && (
            <div className="flex gap-3 mt-4">
              {showApplyButton && (
                <button
                  onClick={handleApply}
                  className="bg-accent-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-600 transition-colors flex items-center gap-2"
                >
                  Apply Filters
                </button>
              )}
              {showClearButton && (
                <button
                  onClick={handleClear}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

FilterPanel.displayName = "FilterPanel";

export default FilterPanel;
