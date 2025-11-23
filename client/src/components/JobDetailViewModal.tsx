import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  DollarSign,
  Calendar,
  Briefcase,
  FileText,
  User as UserIcon,
  Phone,
  Mail,
  Check,
  AlertCircle,
  CheckCircle,
  Package,
  Shield,
  Clock,
  Edit,
  Home,
  MapPin,
  Maximize,
  Bed,
  Bath,
  UtensilsCrossed,
  Grid3x3,
  ChevronDown,
  X,
  ChevronUp,
} from "lucide-react";
import ProfileViewModal from "./ProfileViewModal";
import { jobApi } from "../services/jobService";
import { paymentService } from "../services/paymentService";
import type { RootState } from "../store";
import type { JobDetailViewModalProps, Bid, PropertyInJob } from "../types/job";
import type { User, PaymentType } from "../types";
import { showToast } from "../utils/toast";
import {
  getBidStatusBadgeWithBorder,
  formatJobStatusText,
} from "../utils/badgeColors";
import { BaseModal, Button, Badge, Text } from "./reusable";

const JOB_STATUS_IN_PROGRESS = "inprogress";

const JobDetailViewModal: React.FC<JobDetailViewModalProps> = ({
  isOpen,
  onClose,
  job,
  onRefreshJobs: _onRefreshJobs,
  onEditJob,
  shouldRefetch = true,
}) => {
  const lastFetchedJobId = React.useRef<string | null>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const { updateLoading } = useSelector((state: RootState) => state.job);
  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";
  const isContractor = user?.role === "contractor";

  const [activeTab, setActiveTab] = useState<"details" | "bids">("details");
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<User | null>(
    null
  );
  const [expandedBids, setExpandedBids] = useState<Set<string>>(new Set());

  const fetchBids = useCallback(async () => {
    setBidsLoading(true);
    try {
      const response = await jobApi.getBidsForJob(job._id);
      setBids(response.data || []);
    } catch (_err) {
      setBids([]);
    } finally {
      setBidsLoading(false);
    }
  }, [job._id]);

  useEffect(() => {
    if (isOpen && job._id) {
      if (lastFetchedJobId.current !== job._id || shouldRefetch) {
        fetchBids();
        lastFetchedJobId.current = job._id;
      }
    }
  }, [isOpen, job._id, shouldRefetch, fetchBids]);

  const hasAcceptedBid = bids.some((bid) => bid.status === "accepted");
  const acceptedBid = bids.find((bid) => bid.status === "accepted");

  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => {
      if (a.status === "accepted" && b.status !== "accepted") return -1;
      if (a.status !== "accepted" && b.status === "accepted") return 1;
      return 0;
    });
  }, [bids]);

  const handleViewContractorProfile = useCallback(
    (contractor: Bid["contractor"]) => {
      const contractorUser: User = {
        _id: contractor._id,
        email: contractor.email,
        firstName: contractor.firstName,
        lastName: contractor.lastName,
        phone: contractor.phone || undefined,
        profileImage: contractor.profileImage || undefined,
        role: "contractor" as const,
        status: "active" as const,
        approval: "approved" as const,
        emailVerified: true,
        contractor: contractor.contractor
          ? {
              companyName: contractor.contractor.companyName || "",
              services: contractor.contractor.services || [],
              license: contractor.contractor.license || "",
              taxId: contractor.contractor.taxId || "",
              docs: [],
            }
          : undefined,
        createdAt: "",
        updatedAt: "",
      };
      setSelectedContractor(contractorUser);
      setProfileViewOpen(true);
    },
    []
  );

  const handlePaymentCheckout = useCallback(
    async (bidId: string, paymentType: PaymentType) => {
      try {
        const currentUrl = window.location.origin;
        const jobId = job._id;

        const successUrl =
          paymentType === "bid_acceptance"
            ? `${currentUrl}/dashboard?payment=success&jobId=${jobId}&bidId=${bidId}`
            : `${currentUrl}/dashboard?completed=true&jobId=${jobId}&bidId=${bidId}`;
        const cancelUrl = `${currentUrl}/dashboard?payment=cancelled&jobId=${jobId}`;

        showToast.loading(
          paymentType === "bid_acceptance"
            ? "Creating payment session for bid acceptance..."
            : "Creating payment session for job completion..."
        );

        const response = await paymentService.createJobCheckout({
          bidId,
          paymentType,
          successUrl,
          cancelUrl,
        });

        showToast.dismiss();

        if (!response || !response.checkoutUrl) {
          throw new Error("Invalid checkout response: missing checkoutUrl");
        }

        window.location.href = response.checkoutUrl;
      } catch (err) {
        showToast.dismiss();
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create payment checkout session";
        showToast.error(errorMessage);
      }
    },
    [job._id]
  );

  const handleAcceptBid = useCallback(
    (bidId: string) => {
      handlePaymentCheckout(bidId, "bid_acceptance");
    },
    [handlePaymentCheckout]
  );

  const handleCompleteJob = useCallback(
    (bidId: string) => {
      handlePaymentCheckout(bidId, "job_completion");
    },
    [handlePaymentCheckout]
  );

  const toggleBidExpanded = useCallback((bidId: string) => {
    setExpandedBids((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bidId)) {
        newSet.delete(bidId);
      } else {
        newSet.add(bidId);
      }
      return newSet;
    });
  }, []);

  const handleCloseProfileView = useCallback(() => {
    setProfileViewOpen(false);
    setSelectedContractor(null);
  }, []);

  const handleMarkJobAsComplete = useCallback(async () => {
    const acceptedBid = bids.find((bid) => bid.status === "accepted");

    if (!acceptedBid) {
      showToast.error("No accepted bid found.");
      return;
    }

    if (!acceptedBid._id) {
      showToast.error("Bid ID is missing.");
      return;
    }

    try {
      showToast.loading("Creating completion payment...");

      const currentUrl = window.location.origin;
      const successUrl = `${currentUrl}/jobs/${job._id}/completion/success`;
      const cancelUrl = `${currentUrl}/jobs/${job._id}/completion/cancel`;

      const response = await paymentService.createJobCompletionPayment({
        bidId: acceptedBid._id,
        successUrl,
        cancelUrl,
      });

      showToast.dismiss();

      if (response && response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error("Invalid checkout response: missing checkoutUrl");
      }
    } catch (err) {
      showToast.dismiss();
      let errorMessage = "Failed to create completion payment";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const apiError = err as { response?: { data?: { message?: string } } };
        errorMessage = apiError.response?.data?.message || errorMessage;
      }
      showToast.error(errorMessage);
    }
  }, [bids, job._id]);

  const formatCurrency = (amountInDollars: number) => {
    return `$${amountInDollars.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) =>
    getBidStatusBadgeWithBorder(status);

  const formatStatusText = (status: string) => formatJobStatusText(status);

  const isPropertyPopulated = (
    property: string | PropertyInJob | undefined
  ): property is PropertyInJob => {
    return (
      typeof property === "object" && property !== null && "_id" in property
    );
  };

  const propertyData = isPropertyPopulated(job.property) ? job.property : null;

  if (!isOpen) return null;

  const shouldShowCompleteJob =
    !isContractor &&
    (isAdmin ||
      (isCustomer &&
        (job.status === JOB_STATUS_IN_PROGRESS ||
          job.status === "in_progress")));
  const modalFooter = (
    <div className="flex justify-end items-center gap-3">
      <Button
        variant="secondary"
        onClick={onClose}
        leftIcon={<X className="h-4 w-4" />}
      >
        Close
      </Button>
      {onEditJob && (isAdmin || !hasAcceptedBid) && (
        <Button
          variant="accent"
          onClick={onEditJob}
          leftIcon={<Edit className="h-4 w-4" />}
        >
          Edit Job
        </Button>
      )}
      {shouldShowCompleteJob && (
        <Button
          variant="primary"
          onClick={handleMarkJobAsComplete}
          leftIcon={<CheckCircle className="h-4 w-4" />}
          loading={updateLoading}
          disabled={updateLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          Complete Job
        </Button>
      )}
    </div>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={job.title}
        subtitle={`${job.service} • Posted on ${formatDate(job.createdAt)}`}
        maxWidth="6xl"
        footer={modalFooter}
        showFooter={true}
        closeOnOverlayClick={!profileViewOpen}
      >
        {bidsLoading && bids.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <Text size="base" weight="medium" color="gray">
                Loading job details...
              </Text>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-2 -mx-6 -mt-6 mb-6">
              <Badge
                variant={
                  job.status === "open"
                    ? "success"
                    : job.status === JOB_STATUS_IN_PROGRESS ||
                      job.status === "in_progress"
                    ? "warning"
                    : "info"
                }
              >
                {formatStatusText(job.status)}
              </Badge>
              <Badge variant="primary">
                {bids.length} {bids.length === 1 ? "Bid" : "Bids"}
              </Badge>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 px-6 py-3 font-medium transition ${
                  activeTab === "details"
                    ? "text-accent-500 border-b-2 border-accent-500"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Job Details
              </button>
              <button
                onClick={() => setActiveTab("bids")}
                className={`flex-1 px-6 py-3 font-medium transition ${
                  activeTab === "bids"
                    ? "text-accent-500 border-b-2 border-accent-500"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Bids ({bids.length})
              </button>
            </div>

            <div className="space-y-6">
              {activeTab === "details" ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-accent-600" />
                      Description
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {job.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-accent-600" />
                        Service Category
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-900 font-medium capitalize">
                          {job.service}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-accent-600" />
                        {hasAcceptedBid ? "Accepted Price" : "Estimated Budget"}
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-green-600 font-bold text-xl">
                          {formatCurrency(
                            hasAcceptedBid && acceptedBid?.bidAmount
                              ? acceptedBid.bidAmount / 100
                              : job.estimate
                              ? job.estimate / 100
                              : 0
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-accent-600" />
                        Timeline
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-900 font-medium">
                          {job.timeline} {job.timeline === 1 ? "Day" : "Days"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {propertyData && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-xl font-bold text-primary-900 mb-4 flex items-center gap-2">
                        <Home className="h-6 w-6 text-accent-600" />
                        Property Details
                      </h3>

                      {propertyData.images &&
                        propertyData.images.length > 0 && (
                          <div className="mb-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {propertyData.images
                                .slice(0, 4)
                                .map((image, index) => (
                                  <div
                                    key={index}
                                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                                  >
                                    <img
                                      src={image}
                                      alt={`Property ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                            </div>
                            {propertyData.images.length > 4 && (
                              <p className="text-sm text-gray-500 mt-2">
                                +{propertyData.images.length - 4} more images
                              </p>
                            )}
                          </div>
                        )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Home className="h-4 w-4" />
                            <span className="font-medium">Title</span>
                          </div>
                          <p className="text-gray-900 font-semibold">
                            {propertyData.title}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Maximize className="h-4 w-4" />
                            <span className="font-medium">Area</span>
                          </div>
                          <p className="text-gray-900 font-semibold">
                            {propertyData.area} {propertyData.areaUnit}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Bed className="h-4 w-4" />
                            <span className="font-medium">Bedrooms</span>
                          </div>
                          <p className="text-gray-900 font-semibold">
                            {propertyData.bedrooms}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Bath className="h-4 w-4" />
                            <span className="font-medium">Bathrooms</span>
                          </div>
                          <p className="text-gray-900 font-semibold">
                            {propertyData.bathrooms}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <UtensilsCrossed className="h-4 w-4" />
                            <span className="font-medium">Kitchens</span>
                          </div>
                          <p className="text-gray-900 font-semibold">
                            {propertyData.kitchens}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Grid3x3 className="h-4 w-4" />
                            <span className="font-medium">Total Rooms</span>
                          </div>
                          <p className="text-gray-900 font-semibold">
                            {propertyData.totalRooms}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Location</span>
                          </div>
                          <p className="text-gray-900 font-semibold text-sm">
                            {propertyData.location.coordinates[1].toFixed(6)},{" "}
                            {propertyData.location.coordinates[0].toFixed(6)}
                          </p>
                        </div>
                      </div>

                      {propertyData.description && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Property Description
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">
                              {propertyData.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {hasAcceptedBid && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-green-800 mb-1">
                            Bid Accepted
                          </h4>
                          <p className="text-sm text-green-700">
                            A bid has been accepted for this job. No further bid
                            actions are allowed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {bidsLoading && (
                    <div className="bg-gray-50 rounded-lg p-12 text-center">
                      <div className="flex justify-center items-center mb-4">
                        <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-gray-600">Loading bids...</p>
                    </div>
                  )}

                  {!bidsLoading && bids.length === 0 && (
                    <div className="bg-gray-50 rounded-lg p-12 text-center">
                      <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">
                        No bids submitted yet
                      </p>
                      <p className="text-gray-500 text-sm">
                        Contractors will be able to submit their bids once they
                        view your job request.
                      </p>
                    </div>
                  )}

                  {!bidsLoading &&
                    sortedBids.length > 0 &&
                    sortedBids.map((bid) => {
                      const isExpanded = expandedBids.has(bid._id);

                      return (
                        <div
                          key={bid._id}
                          className={`border-2 rounded-lg overflow-hidden ${
                            bid.status === "accepted"
                              ? "border-green-300 bg-green-50"
                              : bid.status === "rejected"
                              ? "border-red-200 bg-red-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div
                                  onClick={() =>
                                    handleViewContractorProfile(bid.contractor)
                                  }
                                  className="cursor-pointer hover:opacity-80 transition flex-shrink-0"
                                >
                                  {bid.contractor.profileImage ? (
                                    <img
                                      src={bid.contractor.profileImage}
                                      alt={`${bid.contractor.firstName} ${bid.contractor.lastName}`}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                      <UserIcon className="h-6 w-6 text-primary-600" />
                                    </div>
                                  )}
                                </div>

                                <div
                                  className="flex-1 min-w-0 cursor-pointer"
                                  onClick={() =>
                                    handleViewContractorProfile(bid.contractor)
                                  }
                                >
                                  <h4 className="font-semibold text-accent-600 hover:text-primary-600 mb-1">
                                    {bid.contractor.firstName}{" "}
                                    {bid.contractor.lastName}
                                  </h4>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">
                                      {bid.contractor.email}
                                    </span>
                                  </div>
                                  {bid.contractor.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition">
                                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="truncate">
                                        {bid.contractor.phone}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-semibold border whitespace-nowrap ${getStatusBadge(
                                    bid.status
                                  )}`}
                                >
                                  {formatStatusText(bid.status)}
                                </span>
                                <button
                                  onClick={() => toggleBidExpanded(bid._id)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  aria-label={
                                    isExpanded
                                      ? "Collapse details"
                                      : "Expand details"
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-600" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div
                              className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                              onClick={() => toggleBidExpanded(bid._id)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 font-medium">
                                  Bid Amount:
                                </span>
                                <span className="text-2xl font-bold text-green-600">
                                  {formatCurrency(
                                    bid.bidAmount ? bid.bidAmount / 100 : 0
                                  )}
                                </span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="space-y-4">
                                {bid.timeline && (
                                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-gray-600" />
                                      Proposed Timeline
                                    </h5>
                                    <div className="flex items-center gap-4 text-sm text-gray-700">
                                      <div>
                                        <span className="text-gray-500">
                                          Start:{" "}
                                        </span>
                                        <span className="font-medium">
                                          {formatDate(bid.timeline.startDate)}
                                        </span>
                                      </div>
                                      <span className="text-gray-400">→</span>
                                      <div>
                                        <span className="text-gray-500">
                                          End:{" "}
                                        </span>
                                        <span className="font-medium">
                                          {formatDate(bid.timeline.endDate)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {bid.message && (
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-900 mb-2">
                                      Message from Contractor
                                    </h5>
                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                                      {bid.message}
                                    </p>
                                  </div>
                                )}

                                {bid.materials && (
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <Package className="h-4 w-4 text-gray-600" />
                                      Materials
                                    </h5>
                                    <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                                      <p className="font-medium mb-1">
                                        {bid.materials.included
                                          ? "✓ Materials Included"
                                          : "✗ Materials Not Included"}
                                      </p>
                                      {bid.materials.description && (
                                        <p className="text-xs text-gray-600 mt-2">
                                          {bid.materials.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {bid.warranty && (
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <Shield className="h-4 w-4 text-gray-600" />
                                      Warranty
                                    </h5>
                                    <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                                      {bid.warranty.description ? (
                                        <p className="font-medium">
                                          {bid.warranty.description}
                                        </p>
                                      ) : (
                                        <p className="font-medium">
                                          {bid.warranty.period}{" "}
                                          {bid.warranty.period === 1
                                            ? "Month"
                                            : "Months"}{" "}
                                          Warranty
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>
                                    Submitted on {formatDate(bid.createdAt)}
                                  </span>
                                </div>

                                {bid.status === "pending" &&
                                  job.status === "open" &&
                                  !hasAcceptedBid && (
                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                      <Button
                                        variant="accent"
                                        fullWidth
                                        onClick={() => handleAcceptBid(bid._id)}
                                        leftIcon={<Check className="h-5 w-5" />}
                                      >
                                        Accept Bid (Pay 15% Deposit)
                                      </Button>
                                    </div>
                                  )}

                                {bid.status === "accepted" &&
                                  bid.depositPaid &&
                                  !bid.completionPaid && (
                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                      <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={() =>
                                          handleCompleteJob(bid._id)
                                        }
                                        leftIcon={<Check className="h-5 w-5" />}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Complete Job (Pay 85% Final)
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </BaseModal>

      {profileViewOpen && selectedContractor && (
        <ProfileViewModal
          user={selectedContractor}
          isOpen={profileViewOpen}
          onClose={handleCloseProfileView}
        />
      )}
    </>
  );
};

export default JobDetailViewModal;
