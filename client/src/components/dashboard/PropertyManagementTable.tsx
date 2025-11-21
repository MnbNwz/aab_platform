import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import ConfirmModal from "../ui/ConfirmModal";
import PropertyViewModal from "./PropertyViewModal";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { getMyPropertiesThunk } from "../../store/thunks/propertyThunks";
import { updatePropertyStatusThunk } from "../../store/thunks/propertyThunks";
import { searchPropertiesApi } from "../../services/propertyService";
import { showToast } from "../../utils/toast";
import { isApiError } from "../../services/apiService";
import { Search, Filter } from "lucide-react";
import DataTable, { TableColumn, TableAction } from "../ui/DataTable";
import type { PaginationInfo } from "../ui/DataTable";
import { TextInput, SelectInput, Badge, Text, Button } from "../reusable";

interface Property {
  _id: string;
  title: string;
  propertyType: string;
  location: { type: string; coordinates: [number, number] };
  dimensions: { length: number; width: number };
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  description: string;
  images: string[];
  isActive: boolean;
}

interface PropertyManagementTableProps {
  filter: "all" | "active" | "inactive";
  setFilter: React.Dispatch<
    React.SetStateAction<"all" | "active" | "inactive">
  >;
  sortOrder: "asc" | "desc";
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  properties: Property[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  onCreateNew: () => void;
}

const PropertyManagementTable: React.FC<PropertyManagementTableProps> = memo(
  ({
    filter,
    setFilter,
    sortOrder,
    search,
    setSearch,
    properties: _propsProperties,
    page,
    setPage,
    pageSize,
    onCreateNew,
  }) => {
    const dispatch = useDispatch<AppDispatch>();

    const [confirmStatusChange, setConfirmStatusChange] = useState<{
      id: string;
      action: "activate" | "deactivate";
    } | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewProperty, setViewProperty] = useState<Property | null>(null);
    const [hasActiveJobsModal, setHasActiveJobsModal] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Get jobs to check if property has active jobs
    const { jobs } = useSelector((state: RootState) => state.job);

    // Check if property has any active jobs
    const hasActiveJobs = useCallback(
      (propertyId: string): boolean => {
        return jobs.some(
          (job) =>
            job.property === propertyId &&
            job.status !== "cancelled" &&
            job.status !== "completed"
        );
      },
      [jobs]
    );

    // Handle deactivate click
    const handleDeactivateClick = useCallback(
      (propertyId: string) => {
        if (hasActiveJobs(propertyId)) {
          setHasActiveJobsModal(true);
        } else {
          setConfirmStatusChange({
            id: propertyId,
            action: "deactivate",
          });
        }
      },
      [hasActiveJobs]
    );

    const handleStatusChange = useCallback(async () => {
      if (!confirmStatusChange) return;

      setStatusLoading(true);

      try {
        await dispatch(
          updatePropertyStatusThunk({
            id: confirmStatusChange.id,
            isActive: false, // Always deactivating
          })
        ).unwrap();

        showToast.success("Property has been permanently deactivated");
      } catch (error: any) {
        // For 400 errors, show the specific backend message
        if (isApiError(error) && error.status === 400) {
          showToast.error(error.message);
        } else if (typeof error === "string") {
          showToast.error(error);
        } else {
          showToast.error("Failed to deactivate property. Please try again.");
        }
      } finally {
        setStatusLoading(false);
        setConfirmStatusChange(null);
      }
    }, [confirmStatusChange, dispatch]);

    const { properties, loading } = useSelector(
      (state: RootState) => state.property
    );
    const [searchResults, setSearchResults] = useState<Property[] | null>(null);

    useEffect(() => {
      dispatch(getMyPropertiesThunk());
    }, [dispatch]);

    const [searchLoading, setSearchLoading] = useState(false);

    const handleSearch = useCallback(async () => {
      setSearchLoading(true);
      try {
        const res = await searchPropertiesApi(search);
        setSearchResults(res.data.properties || []);
      } catch (_e) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, [search]);

    // Debounced search handler
    const handleSearchChange = useCallback(
      (value: string) => {
        setSearch(value);

        // Clear existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Set new timer for debounced search
        debounceTimerRef.current = setTimeout(() => {
          if (value.trim() === "") {
            setSearchResults(null);
          } else {
            handleSearch();
          }
        }, 500);
      },
      [handleSearch, setSearch]
    );

    // Cleanup debounce timer on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const filtered = useMemo(() => {
      return (searchResults ?? properties).filter((p) => {
        if (filter === "all") return true;
        return filter === "active" ? p.isActive : !p.isActive;
      });
    }, [searchResults, properties, filter]);

    const sorted = useMemo(() => {
      return [...filtered].sort((a, b) => {
        if (sortOrder === "asc") return a.title.localeCompare(b.title);
        return b.title.localeCompare(a.title);
      });
    }, [filtered, sortOrder]);

    // Pagination logic
    const total = sorted.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginated = useMemo(() => {
      return sorted.slice((page - 1) * pageSize, page * pageSize);
    }, [sorted, page, pageSize]);

    // Handle row click
    const handleRowClick = useCallback((property: Property) => {
      const mapped = {
        ...property,
        dimensions: (property as any).dimensions || {
          length: 0,
          width: 0,
        },
        isActive:
          typeof property.isActive === "boolean" ? property.isActive : true,
        images: (property.images || []).filter(
          (img: any) => typeof img === "string"
        ),
      };
      setViewProperty(mapped as Property);
      setViewModalOpen(true);
    }, []);

    // Memoized columns
    const columns = useMemo<TableColumn<Property & Record<string, unknown>>[]>(
      () => [
        {
          key: "title",
          header: "Title",
          render: (property) => (
            <Text truncate className="block max-w-xs" title={property.title}>
              {property.title.length > 40
                ? `${property.title.substring(0, 40)}...`
                : property.title}
            </Text>
          ),
          mobileLabel: "Title",
          mobileRender: (property) => (
            <div>
              <h3 className="font-semibold text-gray-900 text-sm flex-1 min-w-0">
                <Text truncate className="block" title={property.title}>
                  {property.title.length > 30
                    ? `${property.title.substring(0, 30)}...`
                    : property.title}
                </Text>
              </h3>
              <Badge
                variant={property.isActive ? "success" : "warning"}
                className="mt-2"
              >
                {property.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          ),
        },
        {
          key: "propertyType",
          header: "Type",
          render: (property) => (
            <Text color="secondary">{property.propertyType}</Text>
          ),
          mobileLabel: "Type",
          mobileRender: (property) => (
            <div className="text-sm text-gray-600">
              <Text size="sm" weight="medium" className="inline">
                Type:
              </Text>{" "}
              <Text
                size="sm"
                truncate
                className="block"
                title={property.propertyType}
              >
                {property.propertyType.length > 25
                  ? `${property.propertyType.substring(0, 25)}...`
                  : property.propertyType}
              </Text>
            </div>
          ),
        },
        {
          key: "status",
          header: "Status",
          render: (property) => (
            <Badge variant={property.isActive ? "success" : "warning"}>
              {property.isActive ? "Active" : "Inactive"}
            </Badge>
          ),
          mobileLabel: "Status",
          hideOnDesktop: true,
        },
      ],
      []
    );

    // Memoized actions
    const actions = useMemo<TableAction<Property & Record<string, unknown>>[]>(
      () => [
        {
          id: "deactivate",
          label: "Deactivate",
          onClick: (property) => {
            if (typeof property._id === "string" && property.isActive) {
              handleDeactivateClick(property._id);
            } else if (!property.isActive) {
              showToast.error("Property is already deactivated");
            }
          },
          variant: "danger",
          disabled: (property) => !property.isActive,
          show: (property) => property.isActive,
        },
      ],
      [handleDeactivateClick]
    );

    // Pagination info
    const paginationInfo = useMemo<PaginationInfo | undefined>(() => {
      if (total === 0) return undefined;
      return {
        currentPage: page,
        totalPages,
        totalCount: total,
        limit: pageSize,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    }, [page, totalPages, total, pageSize]);

    const handlePageChange = useCallback(
      (newPage: number) => {
        setPage(newPage);
      },
      [setPage]
    );

    const isLoading = loading || searchLoading;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-primary-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                My Properties
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage and filter your properties
              </p>
            </div>
            {/* Create Button */}
            <Button
              variant="accent"
              size="md"
              onClick={onCreateNew}
              title="Create Property"
              className="flex-shrink-0"
            >
              Create Property
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Filters:</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status Filter */}
              <SelectInput
                label="Status"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                options={[
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />

              {/* Search with Icon */}
              <TextInput
                label="Search"
                placeholder="Search properties..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
          </div>
        </div>

        {/* DataTable */}
        <DataTable<Property & Record<string, unknown>>
          data={paginated as (Property & Record<string, unknown>)[]}
          columns={columns}
          actions={actions}
          loading={isLoading}
          emptyMessage="No properties found."
          onRowClick={handleRowClick}
          pagination={paginationInfo}
          onPageChange={handlePageChange}
          paginationLabel={({ startItem, endItem, totalCount }) =>
            `Showing ${startItem} to ${endItem} of ${totalCount} properties`
          }
          getRowKey={(property) => property._id}
          hoverable
          className="bg-white"
        />

        {/* Confirm Modal for Status Change */}
        <ConfirmModal
          isOpen={!!confirmStatusChange}
          title="⚠️ Deactivate Property?"
          message="Warning: This action cannot be undone. Once deactivated, you will not be able to reactivate this property. Are you absolutely sure you want to proceed?"
          confirmText="Confirm"
          cancelText="Cancel"
          loading={statusLoading}
          onCancel={() => setConfirmStatusChange(null)}
          onConfirm={handleStatusChange}
        />

        {/* Active Jobs Warning Modal */}
        <ConfirmModal
          isOpen={hasActiveJobsModal}
          title="⚠️ Cannot Deactivate Property"
          message="This property has active job requests. Please cancel or complete all associated jobs before deactivating the property."
          confirmText="OK"
          onCancel={() => setHasActiveJobsModal(false)}
          onConfirm={() => setHasActiveJobsModal(false)}
          default={true}
        />

        {/* Property View Modal */}
        {viewModalOpen && (
          <PropertyViewModal
            isOpen={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setViewProperty(null);
            }}
            property={viewProperty}
          />
        )}
      </div>
    );
  }
);

PropertyManagementTable.displayName = "PropertyManagementTable";

export default PropertyManagementTable;
