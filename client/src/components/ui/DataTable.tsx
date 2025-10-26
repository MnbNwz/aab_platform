import React, { memo, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "./Loader";

// Column Definition Types
export interface TableColumn<
  T extends Record<string, unknown> = Record<string, unknown>
> {
  key: string;
  header: string;
  accessor?: (row: T) => string | number | boolean | null | undefined;
  render?: (row: T, index: number) => React.ReactNode;
  mobileRender?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  mobileLabel?: string; // Label for mobile card view
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}

// Action Definition Types
export interface TableAction<
  T extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T, index: number) => void;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  disabled?: (row: T) => boolean;
  show?: (row: T) => boolean;
  className?: string;
}

// Pagination Types
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Pagination Label Info
export interface PaginationLabelInfo {
  startItem: number;
  endItem: number;
  totalCount: number;
}

// DataTable Props
export interface DataTableProps<
  T extends Record<string, unknown> = Record<string, unknown>
> {
  // Data
  data: T[];
  columns: TableColumn<T>[];

  // Loading & Empty States
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;

  // Actions
  actions?: TableAction<T>[];
  onRowClick?: (row: T, index: number) => void;

  // Pagination
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  paginationLabel?: (info: PaginationLabelInfo) => string;

  // Responsive Breakpoints
  mobileBreakpoint?: "lg" | "xl";

  // Styling
  className?: string;
  tableClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  headerClassName?: string;

  // Configuration
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  showRowNumbers?: boolean;

  // Key extractor for better performance
  getRowKey?: (row: T, index: number) => string | number;
}

const DataTable = memo(
  <T extends Record<string, unknown>>({
    data,
    columns,
    loading = false,
    error = null,
    emptyMessage = "No data found",
    emptyIcon,
    actions = [],
    onRowClick,
    pagination,
    onPageChange,
    paginationLabel,
    mobileBreakpoint = "lg",
    className = "",
    tableClassName = "",
    rowClassName = "",
    headerClassName = "",
    striped = false,
    hoverable = true,
    compact = false,
    showRowNumbers = false,
    getRowKey,
  }: DataTableProps<T>) => {
    // Calculate pagination info
    const paginationInfo = useMemo<PaginationLabelInfo | null>(() => {
      if (!pagination) return null;
      return {
        startItem: (pagination.currentPage - 1) * pagination.limit + 1,
        endItem: Math.min(
          pagination.currentPage * pagination.limit,
          pagination.totalCount
        ),
        totalCount: pagination.totalCount,
      };
    }, [pagination]);

    // Filter visible columns for desktop
    const desktopColumns = useMemo(
      () => columns.filter((col) => !col.hideOnDesktop),
      [columns]
    );

    // Filter visible columns for mobile
    const mobileColumns = useMemo(
      () => columns.filter((col) => !col.hideOnMobile),
      [columns]
    );

    // Get row class name - memoized
    const getRowClassName = useCallback(
      (row: T, index: number): string => {
        const baseClasses = "transition-colors";
        const stripedClass = striped && index % 2 === 1 ? "bg-primary-50" : "";
        const hoverClass = hoverable ? "hover:bg-primary-50" : "";
        const clickableClass = onRowClick ? "cursor-pointer" : "";
        const customClass =
          typeof rowClassName === "function"
            ? rowClassName(row, index)
            : rowClassName;
        return `${baseClasses} ${stripedClass} ${hoverClass} ${clickableClass} ${customClass}`.trim();
      },
      [striped, hoverable, onRowClick, rowClassName]
    );

    // Render cell content - memoized
    const renderCell = useCallback(
      (column: TableColumn<T>, row: T, index: number): React.ReactNode => {
        if (column.render) {
          return column.render(row, index);
        }
        if (column.accessor) {
          const value = column.accessor(row);
          return value ?? "";
        }
        const value = row[column.key];
        if (value === null || value === undefined) {
          return "";
        }
        return String(value);
      },
      []
    );

    // Handle row click - memoized
    const handleRowClick = useCallback(
      (row: T, index: number) => {
        if (onRowClick) {
          onRowClick(row, index);
        }
      },
      [onRowClick]
    );

    // Stop propagation for action buttons - memoized
    const handleActionClick = useCallback(
      (
        e: React.MouseEvent<HTMLButtonElement>,
        action: TableAction<T>,
        row: T,
        index: number
      ) => {
        e.stopPropagation();
        action.onClick(row, index);
      },
      []
    );

    // Get row key - memoized
    const getKey = useCallback(
      (row: T, index: number): string | number => {
        if (getRowKey) {
          return getRowKey(row, index);
        }
        // Try to find a common ID field
        if ("_id" in row && typeof row._id === "string") {
          return row._id;
        }
        if (
          "id" in row &&
          (typeof row.id === "string" || typeof row.id === "number")
        ) {
          return row.id;
        }
        return index;
      },
      [getRowKey]
    );

    // Variant classes - memoized (using AAS brand colors)
    const variantClasses = useMemo(
      () => ({
        default: "text-primary-600 hover:text-primary-900",
        success: "text-primary-600 hover:text-primary-800",
        danger: "text-accent-600 hover:text-accent-700",
        warning: "text-accent-500 hover:text-accent-600",
        info: "text-primary-500 hover:text-primary-700",
      }),
      []
    );

    // Render actions for a row - memoized
    const renderActions = useCallback(
      (row: T, index: number): React.ReactNode => {
        const visibleActions = actions.filter(
          (action) => action.show === undefined || action.show(row)
        );

        if (visibleActions.length === 0) return null;

        return (
          <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center justify-center gap-2">
              {visibleActions.map((action) => {
                const isDisabled =
                  action.disabled !== undefined && action.disabled(row);
                const variantClass =
                  variantClasses[action.variant || "default"];

                return (
                  <button
                    key={action.id}
                    onClick={(e) => handleActionClick(e, action, row, index)}
                    disabled={isDisabled}
                    className={`${variantClass} ${
                      action.className || ""
                    } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                    title={action.label}
                    type="button"
                  >
                    {action.icon || action.label}
                  </button>
                );
              })}
            </div>
          </td>
        );
      },
      [actions, variantClasses, handleActionClick]
    );

    // Error State (using accent colors from brand)
    if (error) {
      return (
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 sm:p-6">
          <p className="text-accent-700">{error}</p>
        </div>
      );
    }

    // Loading State (using brand colors)
    if (loading) {
      return (
        <div className="min-h-[400px] bg-primary-50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader size="large" color="accent" />
            <p className="text-primary-600 mt-4 font-medium text-lg">
              Loading...
            </p>
          </div>
        </div>
      );
    }

    // Empty State (using brand colors)
    if (!loading && data.length === 0) {
      return (
        <div className="p-8 text-center text-primary-500">
          {emptyIcon || (
            <div className="h-12 w-12 mx-auto mb-4 text-primary-300">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="h-full w-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
          )}
          <p className="text-lg text-primary-600">{emptyMessage}</p>
        </div>
      );
    }

    const breakpointClass =
      mobileBreakpoint === "lg" ? "lg:hidden" : "xl:hidden";
    const desktopBreakpointClass =
      mobileBreakpoint === "lg" ? "hidden lg:block" : "hidden xl:block";

    return (
      <div className={className}>
        {/* Desktop Table View */}
        <div className={`${desktopBreakpointClass} overflow-x-auto`}>
          <table className={`w-full ${tableClassName}`}>
            <thead className={`bg-primary-50 ${headerClassName}`}>
              <tr>
                {showRowNumbers && (
                  <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">
                    #
                  </th>
                )}
                {desktopColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider ${
                      column.headerClassName || ""
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-200">
              {data.map((row, index) => {
                const rowKey = getKey(row, index);
                return (
                  <tr
                    key={rowKey}
                    className={getRowClassName(row, index)}
                    onClick={() => handleRowClick(row, index)}
                  >
                    {showRowNumbers && pagination && (
                      <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 whitespace-nowrap text-sm text-primary-600">
                        {(pagination.currentPage - 1) * pagination.limit +
                          index +
                          1}
                      </td>
                    )}
                    {desktopColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 ${
                          compact ? "py-1 sm:py-2" : ""
                        } ${column.className || ""}`}
                      >
                        {renderCell(column, row, index)}
                      </td>
                    ))}
                    {actions.length > 0 && renderActions(row, index)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className={`${breakpointClass}`}>
          <div className="space-y-3 p-4">
            {data.map((row, index) => {
              const rowKey = getKey(row, index);
              return (
                <div
                  key={rowKey}
                  className={`bg-white border border-primary-200 rounded-lg p-4 shadow-sm transition-shadow ${
                    hoverable ? "hover:shadow-md" : ""
                  } ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => handleRowClick(row, index)}
                >
                  {/* Mobile Card Content */}
                  <div className="space-y-3">
                    {mobileColumns.map((column) => {
                      const label = column.mobileLabel || column.header;
                      const content = column.mobileRender
                        ? column.mobileRender(row, index)
                        : renderCell(column, row, index);

                      return (
                        <div key={column.key} className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-primary-600 uppercase">
                            {label}
                          </span>
                          <div className="text-sm text-primary-900">
                            {content}
                          </div>
                        </div>
                      );
                    })}

                    {/* Mobile Actions */}
                    {actions.length > 0 && (
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-primary-200">
                        {actions
                          .filter(
                            (action) =>
                              action.show === undefined || action.show(row)
                          )
                          .map((action) => {
                            const isDisabled =
                              action.disabled !== undefined &&
                              action.disabled(row);
                            return (
                              <button
                                key={action.id}
                                onClick={(e) =>
                                  handleActionClick(e, action, row, index)
                                }
                                disabled={isDisabled}
                                className="text-sm px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title={action.label}
                                type="button"
                              >
                                {action.icon || action.label}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        {pagination && paginationInfo && onPageChange && (
          <div className="px-4 sm:px-6 py-3 border-t border-primary-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-primary-700">
              {paginationLabel
                ? paginationLabel(paginationInfo)
                : `Showing ${paginationInfo.startItem} to ${paginationInfo.endItem} of ${paginationInfo.totalCount} items`}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading}
                className="p-2 border border-primary-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm text-primary-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage || loading}
                className="p-2 border border-primary-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
) as <T extends Record<string, unknown>>(
  props: DataTableProps<T>
) => React.ReactElement;

// Create a wrapper to set displayName properly
const DataTableWithDisplayName = DataTable as typeof DataTable & {
  displayName: string;
};
DataTableWithDisplayName.displayName = "DataTable";

export default DataTableWithDisplayName;
