import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CreditCard, Calendar, DollarSign } from "lucide-react";
import type { RootState, AppDispatch } from "../../store";
import { fetchPaymentHistory } from "../../store/slices/paymentSlice";
import PaymentDetailModal from "../PaymentDetailModal";
import FilterPanel from "../ui/FilterPanel";
import { FilterConfigs } from "../ui/FilterPanel.utils";
import type { Payment } from "../../services/paymentService";
import DataTable, { TableColumn } from "../ui/DataTable";
import { getPaymentStatusBadge, formatJobStatusText } from "../../utils/badgeColors";
import type { PaginationInfo } from "../ui/DataTable";

interface BillingHistoryTableProps {
  userRole?: "customer" | "contractor";
}

const BillingHistoryTable: React.FC<BillingHistoryTableProps> = memo(
  ({ userRole }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { history } = useSelector((state: RootState) => state.payment);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(
      null
    );
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
      status: "",
      type: "",
    });

    const isCustomer = userRole === "customer";

    useEffect(() => {
      dispatch(
        fetchPaymentHistory({
          page: currentPage,
          limit: 10,
          status: (filters.status || undefined) as
            | "pending"
            | "cancelled"
            | "refunded"
            | "succeeded"
            | "failed"
            | "all"
            | undefined,
          type: (filters.type || undefined) as
            | "all"
            | "membership"
            | "job"
            | undefined,
        })
      );
    }, [dispatch, currentPage, filters.status, filters.type]);

    const handleViewDetails = useCallback((payment: Payment) => {
      setSelectedPayment(payment);
      setDetailModalOpen(true);
    }, []);

    const handlePageChange = useCallback((page: number) => {
      setCurrentPage(page);
    }, []);

    const formatAmount = useCallback((amount: number) => {
      return `$${(amount / 100).toFixed(2)}`;
    }, []);

    const formatDate = useCallback((dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }, []);

    const getStatusColor = useCallback(
      (status: Payment["status"]) => getPaymentStatusBadge(status),
      []
    );

    const getPaymentType = useCallback((payment: Payment) => {
      if (payment.purpose?.startsWith("Membership:")) return "Membership";
      if (payment.purpose?.startsWith("Job:")) return "Job Payment";
      return "Payment";
    }, []);

    const handleFilterChange = useCallback((newFilters: any) => {
      setFilters(newFilters);
      setCurrentPage(1); // Reset to first page when filter changes
    }, []);

    // Memoized columns
    const columns = useMemo<TableColumn<Payment & Record<string, unknown>>[]>(
      () => [
        {
          key: "payment",
          header: "Payment",
          render: (payment) => (
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10">
                <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-accent-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {payment.purpose || "Payment"}
                </div>
                <div className="text-sm text-gray-500">{payment.email}</div>
              </div>
            </div>
          ),
          mobileLabel: "Payment",
          mobileRender: (payment) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-accent-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <CreditCard className="h-4 w-4 text-accent-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {payment.purpose || "Payment"}
                    </h3>
                    <div className="text-xs text-gray-500 truncate">
                      {payment.email}
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(
                    payment.status
                  )}`}
                >
                  {formatJobStatusText(payment.status)}
                </span>
              </div>
            </div>
          ),
        },
        {
          key: "type",
          header: "Type",
          render: (payment) => (
            <span className="text-sm text-gray-900">
              {getPaymentType(payment)}
            </span>
          ),
          mobileLabel: "Type",
          mobileRender: (payment) => (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Type:</span>
              <span className="font-medium text-gray-900">
                {getPaymentType(payment)}
              </span>
            </div>
          ),
          hideOnMobile: true,
        },
        {
          key: "amount",
          header: "Amount",
          render: (payment) => (
            <div className="flex items-center text-sm text-gray-900">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatAmount(payment.amount)}
            </div>
          ),
          mobileLabel: "Amount",
          mobileRender: (payment) => (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Amount:</span>
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {formatAmount(payment.amount)}
                </span>
              </div>
            </div>
          ),
        },
        {
          key: "status",
          header: "Status",
          render: (payment) => (
            <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
              payment.status
            )}`}
          >
            {formatJobStatusText(payment.status)}
          </span>
          ),
          mobileLabel: "Status",
          hideOnMobile: true,
        },
        {
          key: "date",
          header: "Date",
          render: (payment) => (
            <div className="flex items-center text-sm text-gray-900">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(payment.createdAt)}
            </div>
          ),
          mobileLabel: "Date",
          mobileRender: (payment) => (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Date:</span>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                <span className="font-medium text-gray-900 text-xs">
                  {new Date(payment.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ),
          hideOnMobile: true,
        },
      ],
      [formatAmount, formatDate, getStatusColor, getPaymentType]
    );

    // Pagination info
    const paginationInfo = useMemo<PaginationInfo | undefined>(() => {
      if (!history.pagination) return undefined;
      const pagination = history.pagination as any;
      return {
        currentPage: pagination.currentPage || pagination.page || 1,
        totalPages: pagination.totalPages || pagination.pages || 1,
        totalCount: pagination.totalItems || pagination.total || 0,
        limit: pagination.itemsPerPage || pagination.limit || 10,
        hasNextPage:
          pagination.hasNextPage ??
          (pagination.currentPage || pagination.page || 1) <
            (pagination.totalPages || pagination.pages || 1),
        hasPrevPage:
          pagination.hasPrevPage ??
          pagination.hasPreviousPage ??
          (pagination.currentPage || pagination.page || 1) > 1,
      };
    }, [history.pagination]);

    return (
      <>
        <div className="bg-white rounded-lg shadow-sm border border-primary-200">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Billing History
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  View your payment transactions and receipts
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <FilterPanel
            mode="inline"
            fields={[
              FilterConfigs.paymentStatus(filters.status),
              ...(isCustomer ? [FilterConfigs.paymentType(filters.type)] : []),
            ]}
            values={filters}
            onChange={handleFilterChange}
            showFilterIcon={true}
            columns={{ mobile: 1, tablet: 2, desktop: isCustomer ? 2 : 1 }}
          />

          {/* DataTable */}
          <DataTable<Payment & Record<string, unknown>>
            data={history.payments as (Payment & Record<string, unknown>)[]}
            columns={columns}
            loading={history.loading}
            error={history.error}
            emptyMessage={
              filters.status || filters.type
                ? "No payments match the selected filters."
                : "You don't have any payment history yet."
            }
            emptyIcon={<div className="text-gray-400 text-4xl mb-4">💳</div>}
            onRowClick={handleViewDetails}
            pagination={paginationInfo}
            onPageChange={handlePageChange}
            paginationLabel={({ startItem, endItem, totalCount }) =>
              `Showing ${startItem} to ${endItem} of ${totalCount} results`
            }
            getRowKey={(payment) => payment._id}
            hoverable
          />
        </div>

        {/* Payment Detail Modal */}
        {selectedPayment && (
          <PaymentDetailModal
            isOpen={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            paymentId={selectedPayment._id}
          />
        )}
      </>
    );
  }
);

BillingHistoryTable.displayName = "BillingHistoryTable";

export default BillingHistoryTable;
