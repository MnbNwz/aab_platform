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

  const detailType =
    payment?.details?.type && typeof payment.details.type === "string"
      ? payment.details.type.toLowerCase()
      : "";
  const isMembership = detailType === "membership";
  const isJob = detailType === "job";
  let membershipTypeLabel = "";
  if (isMembership) {
    const detailData = (payment?.details?.data as any) || {};
    const planName =
      detailData?.planName || payment?.membership?.plan?.name || "";
    const planTier =
      detailData?.planTier || payment?.membership?.plan?.tier || "";
    if (planName) {
      membershipTypeLabel = planTier ? `${planName} (${planTier})` : planName;
    } else if (planTier) {
      membershipTypeLabel = planTier;
    }
  }

  const showCustomerCard = isJob && Boolean(payment?.email || payment?.userId);

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

  const placeholderDateTimeLabel = useMemo(
    () => formatDate(new Date().toISOString()),
    [formatDate]
  );

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

    if (detailType === "membership") return "Membership";
    if (detailType === "job") return "Job";

    if (payment.membership) return "Membership";
    if (payment.jobDetails) return "Job";

    const purpose = payment.purpose?.toLowerCase() || "";
    if (purpose.includes("membership")) {
      return "Membership";
    }
    if (purpose.includes("job")) {
      return "Job";
    }

    return "None";
  }, [payment, detailType]);

  const handleOpenJobDetail = useCallback(async () => {
    if (jobLoading || detailType !== "job") return;
    const jobId =
      payment?.jobDetails?._id ||
      (detailType === "job"
        ? (payment?.details?.data as any)?.jobId
        : undefined);
    if (!jobId) return;

    setJobLoading(true);
    try {
      const response = await jobApi.getJobById(jobId);
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
  }, [payment?.jobDetails?._id, payment?.details, jobLoading, detailType]);

  const jobSection = useMemo(() => {
    if (!payment) return null;

    const legacyJob = payment.jobDetails;
    const detailsData =
      detailType === "job" ? (payment.details?.data as any) || {} : null;

    if (!legacyJob && !detailsData) {
      return null;
    }

    const jobSummary = detailsData?.jobSummary;
    const jobTitle = legacyJob?.title || jobSummary?.title || "Job";
    const jobService = legacyJob?.service || jobSummary?.service || "—";
    const jobStatus = legacyJob?.status || jobSummary?.status || "";

    const contractor = detailsData?.participants?.contractor;
    const customer = detailsData?.participants?.customer;

    const statusBadge = getJobStatusBadge(jobStatus || "");
    const statusLabel = formatJobStatusText(jobStatus || "");

    const paymentStageLabel =
      payment?.purpose && payment.purpose.trim().length > 0
        ? payment.purpose
        : paymentTypeLabel === "Job"
        ? "Job Payment"
        : "";
    const transactionId = payment?._id ?? "";
    const hasTransactionId = Boolean(transactionId);
    const transactionDisplay = transactionId;
    const jobInfoCardCount =
      1 + (paymentStageLabel ? 1 : 0) + (hasTransactionId ? 1 : 0);
    const jobInfoGridClass =
      jobInfoCardCount >= 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : jobInfoCardCount === 2
        ? "sm:grid-cols-2 lg:grid-cols-2"
        : "sm:grid-cols-1 lg:grid-cols-1";

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-7 sm:space-y-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-accent-600">
              <Briefcase className="h-5 w-5" />
              <span className="text-xs font-semibold tracking-widest uppercase">
                Job Billing
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-semibold text-gray-900">
                {jobTitle}
              </h4>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="capitalize font-medium text-gray-800">
                    {jobService}
                  </span>
                </span>
                {paymentStageLabel && (
                  <span className="inline-flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">
                      {paymentStageLabel}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {statusLabel && (
              <span
                className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${statusBadge}`}
              >
                {statusLabel}
              </span>
            )}
            <button
              type="button"
              onClick={handleOpenJobDetail}
              disabled={jobLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 text-white px-4 py-2 text-sm font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {jobLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>View Job Details</>
              )}
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${jobInfoGridClass} gap-4 lg:gap-5`}>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Service
            </p>
            <p className="text-base font-semibold text-gray-900 capitalize mt-1">
              {jobService}
            </p>
          </div>
          {paymentStageLabel && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Billing Stage
              </p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {paymentStageLabel}
              </p>
            </div>
          )}
          {hasTransactionId && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Transaction
              </p>
              <p className="text-sm font-mono text-gray-800 mt-1 break-all">
                {transactionDisplay}
              </p>
            </div>
          )}
        </div>

        {(customer || contractor) && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Participants
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customer && (
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {customer.name || "Customer"}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Customer
                    </p>
                    {customer.id && (
                      <p className="text-xs font-mono text-gray-400 break-all">
                        ID: {customer.id}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {contractor && (
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {contractor.name || "Contractor"}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Contractor
                    </p>
                    {contractor.companyName && (
                      <p className="text-xs text-gray-500">
                        {contractor.companyName}
                      </p>
                    )}
                    {contractor.id && (
                      <p className="text-xs font-mono text-gray-400 break-all">
                        ID: {contractor.id}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [payment, paymentTypeLabel, jobLoading, handleOpenJobDetail, detailType]);

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

  const headerCreatedLabel = payment
    ? createdAtLabel || placeholderDateTimeLabel
    : placeholderDateTimeLabel;
  const headerUpdatedLabel = payment
    ? updatedAtLabel || placeholderDateTimeLabel
    : placeholderDateTimeLabel;
  const showHeaderUpdatedLabel = payment ? Boolean(updatedAtLabel) : true;

  const metadataSection = useMemo(() => {
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
  }, [payment?.metadata]);

  const transactionSection = useMemo(() => {
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
  }, [payment]);

  const handleCloseJobModal = useCallback(() => {
    setJobModalOpen(false);
    setJobDetail(null);
  }, []);

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
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-auto relative flex flex-col max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 bg-white">
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
                  <span>{headerCreatedLabel}</span>
                </span>
                {showHeaderUpdatedLabel && (
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Updated {headerUpdatedLabel}</span>
                  </span>
                )}
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${
                showCustomerCard ? "md:grid-cols-2" : "md:grid-cols-1"
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
                  {isMembership && membershipTypeLabel && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">Membership Type</dt>
                      <dd className="font-medium text-right">
                        {membershipTypeLabel}
                      </dd>
                    </div>
                  )}
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

              {showCustomerCard && (
                <div className="p-4 rounded-xl bg-white/70 border border-primary-100">
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    Customer
                  </h4>
                  <dl className="space-y-2 text-sm sm:text-base text-gray-900">
                    {payment?.email && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Email</dt>
                        <dd className="font-medium text-right break-all">
                          {payment.email}
                        </dd>
                      </div>
                    )}
                    {payment?.userId && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">User ID</dt>
                        <dd className="font-mono text-sm text-right break-all">
                          {payment.userId}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200/70 to-transparent" />

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
            <div className="space-y-8 sm:space-y-10">
              <div className="pt-4 sm:pt-6">{jobSection}</div>

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
