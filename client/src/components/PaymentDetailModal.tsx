import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, CreditCard, DollarSign, User, Tag } from "lucide-react";
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
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Metadata</h4>
        <div className="space-y-2">
          {Object.entries(detail.payment.metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-600 capitalize">
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
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
          <Tag className="h-4 w-4 mr-2" />
          Membership Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-blue-700">Plan:</span>
            <span className="ml-2 font-medium text-blue-900">
              {membership.plan?.name} ({membership.plan?.tier})
            </span>
          </div>
          <div>
            <span className="text-blue-700">Status:</span>
            <span className="ml-2 font-medium text-blue-900">
              {membership.status}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Billing Period:</span>
            <span className="ml-2 font-medium text-blue-900 capitalize">
              {membership.billingPeriod}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Billing Type:</span>
            <span className="ml-2 font-medium text-blue-900 capitalize">
              {membership.billingType}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Auto Renewal:</span>
            <span className="ml-2 font-medium text-blue-900">
              {membership.isAutoRenew ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Leads Used:</span>
            <span className="ml-2 font-medium text-blue-900">
              {membership.leadsUsedThisMonth}
            </span>
          </div>
          {membership.startDate && (
            <div>
              <span className="text-blue-700">Start Date:</span>
              <span className="ml-2 font-medium text-blue-900">
                {formatDate(membership.startDate)}
              </span>
            </div>
          )}
          {membership.endDate && (
            <div>
              <span className="text-blue-700">End Date:</span>
              <span className="ml-2 font-medium text-blue-900">
                {formatDate(membership.endDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderJobInfo = () => {
    if (!detail.payment?.jobDetails) return null;

    const job = detail.payment.jobDetails;
    return (
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center">
          <Tag className="h-4 w-4 mr-2" />
          Job Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-green-700">Title:</span>
            <span className="ml-2 font-medium text-green-900">{job.title}</span>
          </div>
          <div>
            <span className="text-green-700">Service:</span>
            <span className="ml-2 font-medium text-green-900">
              {job.service}
            </span>
          </div>
          <div>
            <span className="text-green-700">Status:</span>
            <span className="ml-2 font-medium text-green-900">
              {job.status}
            </span>
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto relative flex flex-col max-h-[95vh] overflow-hidden"
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
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      Payment #{detail.payment._id.slice(-8).toUpperCase()}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(detail.payment.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      detail.payment.status
                    )}`}
                  >
                    {detail.payment.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Payment Amount
                  </h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatAmount(detail.payment.amount)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {detail.payment.currency.toUpperCase()}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    User Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {detail.payment.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {renderMembershipInfo()}
              {renderJobInfo()}

              {renderMetadata()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;
