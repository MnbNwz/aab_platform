import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import type { Job } from "../../store/slices/jobSlice";
import { getJobsThunk } from "../../store/thunks/jobThunks";
import { setJobFilters } from "../../store/slices/jobSlice";
import { getMyPropertiesThunk } from "../../store/thunks/propertyThunks";
import JobCreate from "../JobCreate";
import JobDetailViewModal from "../JobDetailViewModal";
import JobViewEditModal from "../JobViewEditModal";
import ConfirmModal from "../ui/ConfirmModal";
import { JOB_STATUSES, SORT_OPTIONS, SERVICES } from "../../constants";
import DataTable, { TableColumn } from "../ui/DataTable";
import type { PaginationInfo } from "../ui/DataTable";
import {
  getJobStatusBadge,
  formatJobStatusText,
} from "../../utils/badgeColors";
import FilterPanel from "../ui/FilterPanel";
import {
  createSelectFieldWithAll,
  createInputField,
  createSelectField,
} from "../ui/FilterPanel.utils";

// Job type for table
interface TableJob extends Record<string, unknown> {
  _id: string;
  title: string;
  description?: string;
  service: string;
  status: string;
  bidCount?: number;
  createdAt: string;
}

const JobManagementTable: React.FC = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    pagination,
    filters,
  } = useSelector((state: RootState) => state.job);
  const { properties } = useSelector((state: RootState) => state.property);
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [jobDetailViewOpen, setJobDetailViewOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [noPropertyConfirmOpen, setNoPropertyConfirmOpen] = useState(false);
  const [editFromDetailView, setEditFromDetailView] = useState(false);
  const [shouldRefetchBids, setShouldRefetchBids] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";

  useEffect(() => {
    setSearchTerm(filters.search || "");
  }, [filters.search]);

  useEffect(() => {
    dispatch(getJobsThunk(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (user) {
      dispatch(getMyPropertiesThunk());
    }
  }, [user, dispatch]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle search input with debouncing
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for debounced search
      debounceTimerRef.current = setTimeout(() => {
        dispatch(setJobFilters({ search: value, page: 1 }));
      }, 500);
    },
    [dispatch]
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      dispatch(setJobFilters({ ...newFilters, page: 1 }));
    },
    [dispatch]
  );

  type JobFilterPanelValues = {
    status: string;
    category?: string;
    sortBy?: string;
    search: string;
  };

  const handlePageChange = useCallback(
    (page: number) => {
      dispatch(setJobFilters({ page }));
    },
    [dispatch]
  );

  const handleViewJobDetails = useCallback((job: Job) => {
    setSelectedJob(job);
    setShouldRefetchBids(true);
    setJobDetailViewOpen(true);
  }, []);

  const handleCloseJobDetailView = useCallback(() => {
    setJobDetailViewOpen(false);
    setSelectedJob(null);
  }, []);

  const handleEditJobFromDetail = useCallback(() => {
    if (selectedJob) {
      setJobDetailViewOpen(false);
      setEditModalOpen(true);
      setEditFromDetailView(true);
    }
  }, [selectedJob]);

  const handleCloseEditModal = useCallback(
    async (wasSaved?: boolean) => {
      setEditModalOpen(false);

      if (wasSaved) {
        const result = await dispatch(getJobsThunk(filters));

        if (editFromDetailView && selectedJob) {
          if (getJobsThunk.fulfilled.match(result)) {
            const updatedJob = result.payload.jobs?.find(
              (j: Job) => j._id === selectedJob._id
            );

            if (updatedJob) {
              setSelectedJob(updatedJob);
              setShouldRefetchBids(true);
              setJobDetailViewOpen(true);
            }
          }
          setEditFromDetailView(false);
        } else {
          setSelectedJob(null);
        }
      } else {
        if (editFromDetailView && selectedJob) {
          setShouldRefetchBids(false);
          setJobDetailViewOpen(true);
          setEditFromDetailView(false);
        } else {
          setSelectedJob(null);
        }
      }
    },
    [dispatch, filters, editFromDetailView, selectedJob]
  );

  const handleRefreshJobs = useCallback(() => {
    dispatch(getJobsThunk(filters));
  }, [dispatch, filters]);

  const handleCreateJobClick = useCallback(() => {
    const hasActiveProperties = properties.some((p) => p.isActive);

    if (properties.length === 0 || !hasActiveProperties) {
      setNoPropertyConfirmOpen(true);
    } else {
      setShowCreateModal(true);
    }
  }, [properties]);

  const handleNoPropertyConfirm = useCallback(() => {
    setNoPropertyConfirmOpen(false);
  }, []);

  const handleNoPropertyCancel = useCallback(() => {
    setNoPropertyConfirmOpen(false);
  }, []);

  // Use centralized badge utilities
  const getStatusBadge = useCallback(
    (status: string) => getJobStatusBadge(status),
    []
  );
  const formatStatusText = useCallback(
    (status: string) => formatJobStatusText(status),
    []
  );

  // Memoized table columns
  const columns = useMemo<TableColumn<TableJob>[]>(
    () => [
      {
        key: "title",
        header: "Title",
        render: (job) => (
          <div>
            <div className="text-sm font-semibold text-primary-900 max-w-xs">
              <span className="block truncate" title={job.title}>
                {job.title.length > 40
                  ? `${job.title.substring(0, 40)}...`
                  : job.title}
              </span>
            </div>
            {job.description && (
              <div className="text-xs text-primary-600 mt-1">
                {job.description.slice(0, 60)}
                {job.description.length > 60 ? "..." : ""}
              </div>
            )}
          </div>
        ),
        mobileLabel: "Job",
        mobileRender: (job) => (
          <div>
            <h3 className="font-semibold text-primary-900 text-sm">
              <span className="block truncate" title={job.title}>
                {job.title.length > 30
                  ? `${job.title.substring(0, 30)}...`
                  : job.title}
              </span>
            </h3>
            <div className="text-xs text-accent-600 font-medium mt-1">
              {job.bidCount || 0} {job.bidCount === 1 ? "Bid" : "Bids"}
            </div>
          </div>
        ),
      },
      {
        key: "service",
        header: "Service",
        render: (job) => (
          <span className="text-sm text-primary-700">{job.service}</span>
        ),
        mobileLabel: "Service",
      },
      {
        key: "status",
        header: "Status",
        render: (job) => (
          <span
            className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${getStatusBadge(
              job.status
            )}`}
          >
            {formatStatusText(job.status)}
          </span>
        ),
        mobileLabel: "Status",
      },
      {
        key: "bidCount",
        header: "Bids",
        render: (job) => (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-accent-100 text-accent-800">
            {job.bidCount || 0}
          </span>
        ),
        hideOnMobile: true,
      },
    ],
    [getStatusBadge, formatStatusText]
  );

  // Format pagination for DataTable
  const filterFields = useMemo(() => {
    const statusOptions = JOB_STATUSES.map((status) => ({
      label: formatJobStatusText(status),
      value: status,
    }));

    const baseFields = [
      createSelectFieldWithAll(
        "status",
        "Status",
        statusOptions,
        filters.status || ""
      ),
    ];

    if (isAdmin) {
      const serviceOptions = SERVICES.map((service) => ({
        label: service.charAt(0).toUpperCase() + service.slice(1),
        value: service,
      }));
      const sortOptions = SORT_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value,
      }));

      baseFields.push(
        createSelectFieldWithAll(
          "category",
          "Service",
          serviceOptions,
          filters.category || ""
        )
      );

      baseFields.push(
        createSelectField(
          "sortBy",
          "Sort By",
          sortOptions,
          filters.sortBy || "createdAt"
        )
      );
    }

    baseFields.push(
      createInputField("search", "Search", searchTerm, "Search jobs...")
    );

    return baseFields;
  }, [filters.status, filters.category, filters.sortBy, isAdmin, searchTerm]);

  const filterValues = useMemo<JobFilterPanelValues>(() => {
    const values: JobFilterPanelValues = {
      status: filters.status || "",
      search: searchTerm,
    };

    if (isAdmin) {
      values.category = filters.category || "";
      values.sortBy = filters.sortBy || "createdAt";
    }

    return values;
  }, [filters.status, filters.category, filters.sortBy, isAdmin, searchTerm]);

  const filterColumns = useMemo(
    () => ({
      mobile: 1,
      tablet: isAdmin ? 2 : 1,
      desktop: isAdmin ? 4 : 2,
    }),
    [isAdmin]
  );

  const handleFilterPanelChange = useCallback(
    (newValues: Record<string, any>) => {
      const nextValues = newValues as JobFilterPanelValues;
      const updates: Partial<typeof filters> = {};

      if ((nextValues.status || "") !== (filters.status || "")) {
        updates.status = nextValues.status || "";
      }

      if (isAdmin) {
        if ((nextValues.category || "") !== (filters.category || "")) {
          updates.category = nextValues.category || "";
        }

        if ((nextValues.sortBy || "") !== (filters.sortBy || "")) {
          updates.sortBy = nextValues.sortBy || "createdAt";
        }
      }

      const nextSearch = nextValues.search ?? "";
      if (nextSearch !== searchTerm) {
        handleSearchChange(nextSearch);
      }

      if (Object.keys(updates).length > 0) {
        handleFilterChange(updates);
      }
    },
    [
      filters.status,
      filters.category,
      filters.sortBy,
      handleFilterChange,
      handleSearchChange,
      isAdmin,
      searchTerm,
    ]
  );

  const tablePagination = useMemo<PaginationInfo | undefined>(() => {
    if (!pagination) return undefined;
    const paginationAny = pagination as any;
    return {
      currentPage: pagination.currentPage || paginationAny.page || 1,
      totalPages: pagination.totalPages || paginationAny.pages || 1,
      limit: pagination.limit || pagination.itemsPerPage || 10,
      totalCount: pagination.totalCount || pagination.totalItems || 0,
      hasNextPage: pagination.hasNextPage ?? false,
      hasPrevPage: pagination.hasPrevPage ?? false,
    };
  }, [pagination]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Jobs Management
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage and filter job requests
              </p>
            </div>
            {/* Create Button */}
            {isCustomer && (
              <button
                className="flex-shrink-0 flex items-center px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition"
                onClick={handleCreateJobClick}
                title="Create Job"
              >
                Create Job
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <FilterPanel
          mode="inline"
          fields={filterFields}
          values={filterValues}
          onChange={handleFilterPanelChange}
          columns={filterColumns}
          showFilterIcon
        />
      </div>

      {/* Jobs List Card */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200">
        <DataTable<TableJob>
          data={jobs as unknown as TableJob[]}
          columns={columns}
          loading={jobsLoading}
          error={jobsError}
          emptyMessage="No jobs found."
          onRowClick={(job) => handleViewJobDetails(job as unknown as Job)}
          pagination={tablePagination}
          onPageChange={handlePageChange}
          paginationLabel={({ startItem, endItem, totalCount }) =>
            `Showing ${startItem} to ${endItem} of ${totalCount} jobs`
          }
          getRowKey={(job) => (job as TableJob)._id}
          hoverable
        />
      </div>

      {/* Job Create Modal - Rendered as Portal */}
      {showCreateModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 p-4"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <div className="p-4 sm:p-6 lg:p-8">
                <JobCreate
                  properties={properties}
                  onClose={() => setShowCreateModal(false)}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Job Detail View Modal with Bids Section */}
      {jobDetailViewOpen && selectedJob && (
        <JobDetailViewModal
          isOpen={jobDetailViewOpen}
          onClose={handleCloseJobDetailView}
          job={selectedJob}
          onRefreshJobs={handleRefreshJobs}
          onEditJob={handleEditJobFromDetail}
          shouldRefetch={shouldRefetchBids}
        />
      )}

      {/* Job Edit Modal */}
      {editModalOpen && selectedJob && (
        <JobViewEditModal
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          job={selectedJob}
          properties={properties}
        />
      )}

      {/* No Property Confirmation Modal */}
      <ConfirmModal
        isOpen={noPropertyConfirmOpen}
        onCancel={handleNoPropertyCancel}
        onConfirm={handleNoPropertyConfirm}
        title="No Active Property"
        message="You need at least one active property to create a job request."
        default={true}
      />
    </div>
  );
});

export default JobManagementTable;
