import React, { useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  CreditCard,
  DollarSign,
  User as UserIcon,
  Tag,
  Hash,
  AlertTriangle,
  Calendar,
  Clock,
  Briefcase,
} from "lucide-react";
import { RootState, AppDispatch } from "../store";
import {
  fetchPaymentDetail,
  clearPaymentDetail,
} from "../store/slices/paymentSlice";
import JobDetailViewModal from "./JobDetailViewModal";
import { jobApi } from "../services/jobService";
import { showToast } from "../utils/toast";
import type { Job } from "../store/slices/jobSlice";
import { getJobStatusBadge, formatJobStatusText } from "../utils/badgeColors";

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
  const payment = detail.payment;
  const [jobModalOpen, setJobModalOpen] = React.useState(false);
  const [jobDetail, setJobDetail] = React.useState<Job | null>(null);
  const [jobLoading, setJobLoading] = React.useState(false);

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearPaymentDetail());
      setJobModalOpen(false);
      setJobDetail(null);
      return;
    }

    if (paymentId) {
      dispatch(fetchPaymentDetail(paymentId));
    }

    return () => {
      dispatch(clearPaymentDetail());
    };
  }, [dispatch, isOpen, paymentId]);

  const formatAmount = useCallback((amount: number) => {
    return (amount / 100).toFixed(2);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
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

  const paymentTypeLabel = useMemo(() => {
    if (!payment) return "None";

    const normalized = payment.details?.type?.toLowerCase();
    if (normalized === "membership") return "Membership";
    if (normalized === "job") return "Job";

    if (payment.membership) return "Membership";
    if (payment.jobDetails) return "Job";

    if (payment.purpose?.toLowerCase().includes("membership")) {
      return "Membership";
    }
    if (payment.purpose?.toLowerCase().includes("job")) {
      return "Job";
    }

    return "None";
  }, [payment]);

  const statusLabel = useMemo(() => {
    if (!payment?.status) return "";
    return payment.status
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, [payment?.status]);

  const createdAtLabel = useMemo(() => {
    if (!payment?.createdAt) return "";
    return formatDate(payment.createdAt);
  }, [payment?.createdAt, formatDate]);

  const updatedAtLabel = useMemo(() => {
    if (!payment?.updatedAt) return "";
    if (payment.createdAt && payment.updatedAt === payment.createdAt) {
      return "";
    }
    return formatDate(payment.updatedAt);
  }, [payment?.updatedAt, payment?.createdAt, formatDate]);

  const renderMetadata = () => {
    if (!payment?.metadata) return null;

    const metadataEntries = Object.entries(payment.metadata).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    );

    if (metadataEntries.length === 0) {
      return null;
    }

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Additional Information
        </h4>
        <div className="space-y-2">
          {metadataEntries.map(([key, value]) => (
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

  const renderTransactionDetails = () => {
    if (!payment) return null;

    const {
      stripePaymentIntentId,
      stripeSessionId,
      stripeSubscriptionId,
      failureReason,
    } = payment;

    if (
      !stripePaymentIntentId &&
      !stripeSessionId &&
      !stripeSubscriptionId &&
      !failureReason
    ) {
      return null;
    }

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Hash className="h-4 w-4 text-accent-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            Transaction Details
          </h4>
        </div>
        <div className="space-y-2 text-sm">
          {stripePaymentIntentId && (
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Intent:</span>
              <span className="font-medium text-gray-900">
                {stripePaymentIntentId}
              </span>
            </div>
          )}
          {stripeSessionId && (
            <div className="flex justify-between">
              <span className="text-gray-500">Session ID:</span>
              <span className="font-medium text-gray-900">
                {stripeSessionId}
              </span>
            </div>
          )}
          {stripeSubscriptionId && (
            <div className="flex justify-between">
              <span className="text-gray-500">Subscription ID:</span>
              <span className="font-medium text-gray-900">
                {stripeSubscriptionId}
              </span>
            </div>
          )}
        </div>

        {failureReason && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Failure Reason</p>
              <p className="mt-1 text-red-600">{failureReason}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMembershipInfo = () => {
    if (!payment) return null;

    const membership = payment.membership;
    const detailsData =
      payment.details && payment.details.type === "membership"
        ? payment.details.data || {}
        : null;

    if (!membership && !detailsData) {
      return null;
    }

    const formatDateShort = (value?: string) =>
      value
        ? new Date(value).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—";

    const planName =
      membership?.plan?.name || detailsData?.planName || "Membership Plan";
    const planTier =
      membership?.plan?.tier ||
      detailsData?.planTier ||
      (detailsData?.planName ? "" : undefined);
    const autoRenew =
      membership?.isAutoRenew !== undefined
        ? membership.isAutoRenew
        : detailsData?.isAutoRenew;
    const endDate =
      membership?.endDate ||
      detailsData?.endDate ||
      detailsData?.cycleEnd ||
      detailsData?.renewalDate;

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 mb-4">
          <h4 className="text-base font-semibold text-gray-900">
            Membership Details
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base">
          <div className="space-y-1.5">
            <p className="text-gray-500 text-xs uppercase tracking-wide">
              Plan
            </p>
            <p className="text-gray-900 font-medium">
              {planName}
              {planTier ? ` (${planTier})` : ""}
            </p>
          </div>
          {autoRenew !== undefined && (
            <div className="space-y-1.5">
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Auto Renewal
              </p>
              <p className="text-gray-900 font-medium">
                {autoRenew ? "Enabled" : "Disabled"}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-gray-500 text-xs uppercase tracking-wide">
              Cycle End
            </p>
            <p className="text-gray-900 font-medium">
              {formatDateShort(endDate)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderJobInfo = () => {
    if (!payment?.jobDetails) return null;

    const job = payment.jobDetails;
    const statusBadge = getJobStatusBadge(job.status || "");
    const statusLabel = formatJobStatusText(job.status || "");

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">
                Job Summary
              </h4>
              <p className="text-sm text-gray-500">
                Linked job for this payment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenJobDetail}
            disabled={jobLoading}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-accent-500 text-white px-4 py-2 text-sm font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {jobLoading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>View Job</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base">
          <div className="space-y-1.5">
            <p className="text-gray-500 text-xs uppercase tracking-wide">
              Job Title
            </p>
            <p className="text-gray-900 font-medium">{job.title || "—"}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-gray-500 text-xs uppercase tracking-wide">
              Job ID
            </p>
            <p className="text-gray-900 font-mono text-sm break-all">
              {job._id}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-gray-500 text-xs uppercase tracking-wide">
              Service
            </p>
            <p className="text-gray-900 font-medium capitalize">
              {job.service || "—"}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-gray-500 text-xs uppercase tracking-wide">
              Status
            </p>
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleOpenJobDetail = useCallback(async () => {
    if (!payment?.jobDetails?._id || jobLoading) return;

    setJobLoading(true);
    try {
      const response = await jobApi.getJobById(payment.jobDetails._id);
      const jobData =
        response.data?.job || response.data?.data || response.data;

      if (jobData) {
        setJobDetail(jobData as Job);
        setJobModalOpen(true);
      } else {
        showToast.error("Job details are not available.");
      }
    } catch (error: any) {
      showToast.error(
        error?.message || "Failed to load job details. Please try again."
      );
    } finally {
      setJobLoading(false);
    }
  }, [payment?.jobDetails?._id, jobLoading]);

  const handleCloseJobModal = useCallback(() => {
    setJobModalOpen(false);
    setJobDetail(null);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const summaryItems = useMemo(() => {
    if (!payment) return [];
    const items = [
      {
        icon: <UserIcon className="h-4 w-4 text-gray-500" />,
        label: "Customer",
        value: payment.email || "—",
      },
      {
        icon: <Hash className="h-4 w-4 text-gray-500" />,
        label: "User ID",
        value: payment.userId || "—",
      },
      {
        icon: <Tag className="h-4 w-4 text-gray-500" />,
        label: "Type",
        value: paymentTypeLabel || "—",
      },
      {
        icon: <DollarSign className="h-4 w-4 text-gray-500" />,
        label: "Purpose",
        value: payment.purpose || "Payment",
      },
      {
        icon: <Calendar className="h-4 w-4 text-gray-500" />,
        label: "Billing Period",
        value: payment.billingPeriod
          ? payment.billingPeriod === "monthly"
            ? "Monthly"
            : "Yearly"
          : "—",
      },
    ];

    if (createdAtLabel) {
      items.push({
        icon: <Calendar className="h-4 w-4 text-gray-500" />,
        label: "Created",
        value: createdAtLabel,
      });
    }

    if (updatedAtLabel) {
      items.push({
        icon: <Clock className="h-4 w-4 text-gray-500" />,
        label: "Updated",
        value: updatedAtLabel,
      });
    }

    return items.filter((item) => item.value && item.value !== "—");
  }, [payment, paymentTypeLabel, createdAtLabel, updatedAtLabel]);

  if (!isOpen) return null;

  const membershipSection = renderMembershipInfo();
  const jobSection = renderJobInfo();
  const transactionSection = renderTransactionDetails();
  const metadataSection = renderMetadata();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-auto relative flex flex-col max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-primary-100 text-primary-600 rounded-xl shadow-inner">
                <CreditCard className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Payment Details
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Comprehensive summary of this transaction
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 self-start lg:self-center"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-primary-50 via-white to-primary-50 rounded-2xl border border-primary-100 shadow-sm p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="space-y-2">
                {statusLabel && (
                  <span
                    className={`inline-flex px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(
                      payment?.status || ""
                    )}`}
                  >
                    {statusLabel}
                  </span>
                )}
                <div className="flex items-baseline gap-3">
                  <span className="text-gray-600 text-lg sm:text-xl">$</span>
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
                    {formatAmount(payment?.amount || 0)}
                  </span>
                  <span className="text-gray-500 text-base sm:text-lg uppercase">
                    {payment?.currency}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{createdAtLabel || "—"}</span>
                </span>
                {updatedAtLabel && (
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Updated {updatedAtLabel}</span>
                  </span>
                )}
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${
                payment && payment.details?.type === "membership"
                  ? "md:grid-cols-1"
                  : "md:grid-cols-2"
              } gap-4 mt-6`}
            >
              <div className="p-4 rounded-xl bg-white/70 border border-primary-100">
                <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Overview
                </h4>
                <dl className="space-y-2 text-sm sm:text-base text-gray-900">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Purpose</dt>
                    <dd className="font-medium text-right">
                      {payment?.purpose || "Payment"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Payment Type</dt>
                    <dd className="font-medium capitalize text-right">
                      {paymentTypeLabel || "—"}
                    </dd>
                  </div>
                  {payment?.billingPeriod && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">Billing Period</dt>
                      <dd className="font-medium text-right capitalize">
                        {payment.billingPeriod}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {payment?.details?.type !== "membership" && (
                <div className="p-4 rounded-xl bg-white/70 border border-primary-100">
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    Customer
                  </h4>
                  <dl className="space-y-2 text-sm sm:text-base text-gray-900">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-medium text-right break-all">
                        {payment?.email || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">User ID</dt>
                      <dd className="font-mono text-sm text-right break-all">
                        {payment?.userId || "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-6 pb-6 bg-gray-50">
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
          ) : payment ? (
            <div className="space-y-6 sm:space-y-7">
              {membershipSection}

              {summaryItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {summaryItems.map((item) => (
                    <div
                      key={item.label}
                      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow transition-shadow duration-150"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {item.icon}
                        <h4 className="text-sm font-medium text-gray-700">
                          {item.label}
                        </h4>
                      </div>
                      <p className="text-sm sm:text-base text-gray-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {jobSection && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                  {jobSection}
                </div>
              )}
              {transactionSection}
              {metadataSection}
            </div>
          ) : null}
        </div>
      </div>

      {jobModalOpen && jobDetail && (
        <JobDetailViewModal
          isOpen={jobModalOpen}
          onClose={handleCloseJobModal}
          job={jobDetail}
          onRefreshJobs={() => {}}
          shouldRefetch={false}
        />
      )}
    </div>
  );
};

export default PaymentDetailModal;
