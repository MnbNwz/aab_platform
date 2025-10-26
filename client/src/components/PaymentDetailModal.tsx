import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, CreditCard, DollarSign, User as UserIcon, Tag } from "lucide-react";
import { RootState, AppDispatch } from "../store";
import {
  fetchPaymentDetail,
  clearPaymentDetail,
} from "../store/slices/paymentSlice";

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  paymentId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { detail } = useSelector((state: RootState) => state.payment);

  useEffect(() => {
    if (isOpen && paymentId) {
      dispatch(fetchPaymentDetail(paymentId));
    }
  }, [dispatch, isOpen, paymentId]);

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearPaymentDetail());
    }
  }, [isOpen, dispatch]);

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
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

  const renderMetadata = () => {
    if (!detail.payment?.metadata) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Additional Information
        </h4>
        <div className="space-y-2">
          {Object.entries(detail.payment.metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}:
              </span>
              <span className="text-gray-900 font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMembershipInfo = () => {
    if (!detail.payment?.membership) return null;

    const membership = detail.payment.membership;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-accent-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            Membership Details
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Plan</p>
            <p className="font-medium text-gray-900">
              {membership.plan?.name} ({membership.plan?.tier})
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Status</p>
            <p className="font-medium text-gray-900 capitalize">
              {membership.status}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Billing Period</p>
            <p className="font-medium text-gray-900 capitalize">
              {membership.billingPeriod}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Auto Renewal</p>
            <p className="font-medium text-gray-900">
              {membership.isAutoRenew ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderJobInfo = () => {
    if (!detail.payment?.jobDetails) return null;

    const job = detail.payment.jobDetails;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-accent-600" />
          <h4 className="text-sm font-semibold text-gray-900">Job Details</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Title</p>
            <p className="font-medium text-gray-900">{job.title}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Service</p>
            <p className="font-medium text-gray-900">{job.service}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Status</p>
            <p className="font-medium text-gray-900 capitalize">{job.status}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto relative flex flex-col max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Details
              </h3>
              <p className="text-sm text-gray-500">
                Transaction information and receipt
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {detail.loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
            </div>
          ) : detail.error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error Loading Payment
                </h3>
                <p className="text-gray-600">{detail.error}</p>
              </div>
            </div>
          ) : detail.payment ? (
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-lg p-4 sm:p-6 border border-accent-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Payment ID
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">
                      #{detail.payment._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full self-start sm:self-auto ${getStatusColor(
                      detail.payment.status
                    )}`}
                  >
                    {detail.payment.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-600 text-xl sm:text-2xl">$</span>
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {formatAmount(detail.payment.amount)}
                  </span>
                  <span className="text-gray-600 text-base sm:text-lg uppercase">
                    {detail.payment.currency}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {formatDate(detail.payment.createdAt)}
                  </p>
                </div>
              </div>

              {/* Key Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-900">
                      Customer
                    </h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    {detail.payment.email}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-900">
                      Purpose
                    </h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    {detail.payment.purpose || "Payment"}
                  </p>
                </div>
              </div>

              {/* Context-Specific Information */}
              {renderMembershipInfo()}
              {renderJobInfo()}

              {/* Additional Metadata */}
              {renderMetadata()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;
