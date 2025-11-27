import React, { memo, useMemo } from "react";
import { Text, Badge } from "../reusable";
import DataTable from "../ui/DataTable";
import type { PendingFeedbackJob } from "../../services/feedbackService";
import { formatDate } from "../../utils/date";

interface PendingFeedbackProps {
  jobs: PendingFeedbackJob[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  } | null;
  onJobClick: (jobId: string) => void;
  onPageChange: (page: number) => void;
}

const PendingFeedback: React.FC<PendingFeedbackProps> = memo(
  ({ jobs, loading, error, pagination, onJobClick, onPageChange }) => {
    const columns = useMemo(
      () =>
        [
          {
            key: "title",
            header: "Job",
            accessor: (row: PendingFeedbackJob) => row.title,
          },
          {
            key: "service",
            header: "Service",
            accessor: (row: PendingFeedbackJob) => row.service,
          },
          {
            key: "estimate",
            header: "Estimate",
            render: (row: PendingFeedbackJob) =>
              new Intl.NumberFormat("en-CA", {
                style: "currency",
                currency: "CAD",
              }).format(row.estimate / 100),
          },
          {
            key: "status",
            header: "Status",
            render: () => (
              <Badge variant="success" size="sm">
                Completed
              </Badge>
            ),
          },
          {
            key: "createdAt",
            header: "Completed On",
            accessor: (row: PendingFeedbackJob) => formatDate(row.updatedAt),
            mobileLabel: "Completed",
          },
        ] as const,
      []
    );

    return (
      <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-4 sm:p-6 transition-all duration-200 ease-out">
        <div className="flex items-center justify-between mb-4">
          <Text size="lg" weight="semibold" className="text-primary-900">
            Jobs Awaiting Your Feedback
          </Text>
          <Text size="sm" className="text-primary-700">
            {pagination?.total || jobs.length} pending
          </Text>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-accent-50 px-4 py-2 text-sm text-accent-700">
            {error}
          </div>
        )}

        <DataTable<PendingFeedbackJob>
          data={jobs}
          columns={columns as any}
          loading={loading}
          emptyMessage={
            loading
              ? "Loading pending feedback..."
              : "No pending feedback. Great job staying up to date!"
          }
          onRowClick={(row) => onJobClick(row._id)}
          showRowNumbers={false}
          striped
          hoverable
          pagination={
            pagination
              ? {
                  currentPage: pagination.page,
                  totalPages: pagination.totalPages,
                  totalCount: pagination.total,
                  limit: pagination.limit,
                  hasNextPage: pagination.page < pagination.totalPages,
                  hasPrevPage: pagination.page > 1,
                }
              : undefined
          }
          onPageChange={onPageChange}
        />
      </div>
    );
  }
);

PendingFeedback.displayName = "PendingFeedback";

export default PendingFeedback;

