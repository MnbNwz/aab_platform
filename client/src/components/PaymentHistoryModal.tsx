import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, CreditCard, Calendar, DollarSign } from "lucide-react";
import { RootState, AppDispatch } from "../store";
import {
  fetchPaymentHistory,
  clearPaymentError,
  resetPayment,
} from "../store/slices/paymentSlice";
import PaymentDetailModal from "./PaymentDetailModal.tsx";
import type { Payment } from "../services/paymentService";
import DataTable, { TableColumn, PaginationInfo } from "./ui/DataTable";

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { history } = useSelector((state: RootState) => state.payment);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchPaymentHistory({ page: currentPage, limit: 10 }));
    }
  }, [dispatch, isOpen, currentPage]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(1);
      setSelectedPayment(null);
      setDetailModalOpen(false);
      dispatch(clearPaymentError());
      dispatch(resetPayment());
    }
  }, [isOpen, dispatch]);

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
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const getStatusColor = useCallback((status: Payment["status"]) => {
    switch (status) {
      case "succeeded":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getPaymentType = useCallback((payment: Payment) => {
    if (payment.purpose?.startsWith("Membership:")) return "Membership";
    if (payment.purpose?.startsWith("Job:")) return "Job Payment";
    return "Payment";
  }, []);

  // Memoized columns
  const columns = useMemo<TableColumn<Payment & Record<string, unknown>>[]>(
    () => [
      {
        key: "payment",
        header: "Payment",
        render: (payment) => (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8">
              <div className="h-8 w-8 rounded-full bg-accent-100 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-accent-600" />
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
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center flex-1 min-w-0">
                <div className="h-6 w-6 rounded-full bg-accent-100 flex items-center justify-center mr-2 flex-shrink-0">
                  <CreditCard className="h-3 w-3 text-accent-600" />
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
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Amount:</span>
                <div className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {formatAmount(payment.amount)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    payment.status
                  )}`}
                >
                  {payment.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Date:</span>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="font-medium text-gray-900 text-xs">
                    {new Date(payment.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
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
        hideOnMobile: true,
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
            {payment.status}
          </span>
        ),
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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl mx-auto relative flex flex-col max-h-[95vh] overflow-hidden sm:max-w-6xl lg:max-w-7xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment History
                </h3>
                <p className="text-sm text-gray-500">
                  View your payment transactions and receipts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <DataTable<Payment & Record<string, unknown>>
              data={history.payments as (Payment & Record<string, unknown>)[]}
              columns={columns}
              loading={history.loading}
              error={history.error}
              emptyMessage="You don't have any payment history yet."
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
        </div>
      </div>

      {selectedPayment && (
        <PaymentDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          paymentId={selectedPayment._id}
        />
      )}
    </>
  );
};

export default memo(PaymentHistoryModal);
