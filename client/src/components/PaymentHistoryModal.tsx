import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  CreditCard,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { RootState, AppDispatch } from "../store";
import {
  fetchPaymentHistory,
  clearPaymentError,
  resetPayment,
} from "../store/slices/paymentSlice";
import PaymentDetailModal from "./PaymentDetailModal.tsx";
import type { Payment } from "../services/paymentService";

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

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: Payment["status"]) => {
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
  };

  const getPaymentType = (payment: Payment) => {
    if (payment.purpose?.startsWith("Membership:")) return "Membership";
    if (payment.purpose?.startsWith("Job:")) return "Job Payment";
    return "Payment";
  };

  const renderPagination = () => {
    if (
      history.loading ||
      !history.pagination ||
      history.pagination.pages <= 1
    ) {
      return null;
    }

    const {
      page = 1,
      pages = 1,
      total = 0,
      limit = 10,
    } = history.pagination || {};

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-xl">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              {page} of {pages}
            </span>
          </div>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pages}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing {Math.max(1, (page - 1) * limit + 1)} to{" "}
              {Math.min(page * limit, total)} of {total} results
            </p>
          </div>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                {page} of {pages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

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
            {history.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
              </div>
            ) : history.error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Error Loading Payments
                  </h3>
                  <p className="text-gray-600">{history.error}</p>
                </div>
              </div>
            ) : history.payments.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-gray-400 text-4xl mb-4">💳</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Payments Found
                  </h3>
                  <p className="text-gray-600">
                    You don't have any payment history yet.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.payments.map((payment) => (
                        <tr
                          key={payment._id}
                          onClick={() => handleViewDetails(payment)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
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
                                <div className="text-sm text-gray-500">
                                  {payment.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {getPaymentType(payment)}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatAmount(payment.amount)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(payment.createdAt)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="hidden md:block lg:hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.payments.map((payment) => (
                        <tr
                          key={payment._id}
                          onClick={() => handleViewDetails(payment)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-3 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-accent-100 flex items-center justify-center">
                                  <CreditCard className="h-4 w-4 text-accent-600" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                  {payment.purpose || "Payment"}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                  {payment.email}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(payment.createdAt)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatAmount(payment.amount)}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden">
                  <div className="p-3 space-y-3">
                    {history.payments.map((payment) => (
                      <div
                        key={payment._id}
                        onClick={() => handleViewDetails(payment)}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
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
                                    {new Date(
                                      payment.createdAt
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {renderPagination()}
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

export default PaymentHistoryModal;
