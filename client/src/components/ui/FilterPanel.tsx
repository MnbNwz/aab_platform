import { useState, useCallback, memo, useMemo } from "react";
import { Filter, X, Check, Search, Calendar, DollarSign } from "lucide-react";
import { TextInput, SelectInput, NumberInput, Button } from "../reusable";

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
  showFilterIcon = true, // Always show filter icon by default
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

  // Memoize icon components to prevent recreation on each render
  const searchIcon = useMemo(
    () => <Search className="h-4 w-4 text-gray-400" />,
    []
  );
  const dollarIcon = useMemo(
    () => <DollarSign className="h-4 w-4 text-gray-400" />,
    []
  );
  const calendarIcon = useMemo(
    () => <Calendar className="h-4 w-4 text-gray-400 pointer-events-none" />,
    []
  );

  // Helper functions to check field types - memoized for performance
  const isSearchField = useCallback((fieldName: string) => {
    return fieldName.toLowerCase().includes("search");
  }, []);

  // Memoize options transformation helper
  const transformOptions = useCallback((options?: FilterOption[]) => {
    return (
      options?.map((option) => ({
        value: String(option.value),
        label: option.label,
      })) || []
    );
  }, []);

  // Render filter field based on type
  const renderField = useCallback(
    (field: FilterField) => {
      switch (field.type) {
        case "select": {
          return (
            <SelectInput
              id={field.name}
              name={field.name}
              label={field.label}
              value={field.value || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              options={transformOptions(field.options)}
              containerClassName="w-full"
            />
          );
        }

        case "input": {
          return (
            <TextInput
              id={field.name}
              name={field.name}
              label={field.label}
              value={field.value || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              containerClassName="w-full"
              leftIcon={isSearchField(field.name) ? searchIcon : undefined}
            />
          );
        }

        case "number": {
          return (
            <NumberInput
              id={field.name}
              name={field.name}
              label={field.label}
              value={field.value || ""}
              onChange={(e) => {
                const value = e.target.value;
                handleFieldChange(field.name, value === "" ? "" : value);
              }}
              placeholder={field.placeholder}
              containerClassName="w-full"
              leftIcon={dollarIcon}
            />
          );
        }

        case "date": {
          return (
            <div className="w-full">
              <label
                className="block text-sm font-medium text-gray-700 mb-1.5"
                htmlFor={field.name}
              >
                {field.label}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {calendarIcon}
                </div>
                <input
                  type="date"
                  id={field.name}
                  value={field.value || ""}
                  onChange={(e) =>
                    handleFieldChange(field.name, e.target.value)
                  }
                  className="w-full rounded-lg pl-10 pr-3 py-2 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm bg-white text-primary-900 placeholder-gray-300 transition-all duration-200"
                  aria-label={field.label}
                />
              </div>
            </div>
          );
        }

        default:
          return null;
      }
    },
    [
      handleFieldChange,
      searchIcon,
      dollarIcon,
      calendarIcon,
      isSearchField,
      transformOptions,
    ]
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
              <span className="text-sm mr-2 font-medium text-gray-700 whitespace-nowrap">
                {field.label}:
              </span>
              <div className="flex-1 max-w-xs">
                {field.type === "select" ? (
                  <SelectInput
                    id={field.name}
                    name={field.name}
                    value={field.value || ""}
                    onChange={(e) =>
                      handleFieldChange(field.name, e.target.value)
                    }
                    options={transformOptions(field.options)}
                    containerClassName="w-full"
                    label=""
                  />
                ) : field.type === "input" ? (
                  <TextInput
                    id={field.name}
                    name={field.name}
                    value={field.value || ""}
                    onChange={(e) =>
                      handleFieldChange(field.name, e.target.value)
                    }
                    placeholder={field.placeholder}
                    containerClassName="w-full"
                    label=""
                    leftIcon={
                      isSearchField(field.name) ? searchIcon : undefined
                    }
                  />
                ) : field.type === "number" ? (
                  <NumberInput
                    id={field.name}
                    name={field.name}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange(field.name, value === "" ? "" : value);
                    }}
                    placeholder={field.placeholder}
                    containerClassName="w-full"
                    label=""
                    leftIcon={dollarIcon}
                  />
                ) : (
                  renderField(field)
                )}
              </div>
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
              <div key={field.name}>{renderField(field)}</div>
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
      <Button
        onClick={handleToggle}
        variant="secondary"
        leftIcon={<Filter className="h-4 w-4" />}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Show filters" : "Hide filters"}
      >
        {title || "Filters"}
      </Button>

      {/* Collapsible Panel */}
      {!isCollapsed && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className={gridClasses}>
            {fields.map((field) => (
              <div key={field.name}>{renderField(field)}</div>
            ))}
          </div>

          {/* Action Buttons */}
          {(showApplyButton || showClearButton) && (
            <div className="flex gap-3 mt-4">
              {showApplyButton && (
                <Button
                  onClick={handleApply}
                  variant="primary"
                  leftIcon={<Check className="h-4 w-4" />}
                >
                  Apply Filters
                </Button>
              )}
              {showClearButton && (
                <Button
                  onClick={handleClear}
                  variant="secondary"
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Clear All
                </Button>
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
