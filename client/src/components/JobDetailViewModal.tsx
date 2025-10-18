import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  X,
  DollarSign,
  Calendar,
  Briefcase,
  FileText,
  User,
  Phone,
  Mail,
  Check,
  XCircle,
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
  ChevronUp,
} from "lucide-react";
import ProfileViewModal from "./ProfileViewModal";
import { showToast } from "../utils/toast";
import { jobApi } from "../services/jobService";
import type { RootState } from "../store";
import type { JobDetailViewModalProps, Bid, PropertyInJob } from "../types/job";

const JobDetailViewModal: React.FC<JobDetailViewModalProps> = ({
  isOpen,
  onClose,
  job,
  onRefreshJobs,
  onEditJob,
  shouldRefetch = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFetchedJobId = useRef<string | null>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"details" | "bids">("details");
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);
  const [rejectingBid, setRejectingBid] = useState<string | null>(null);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<
    Bid["contractor"] | null
  >(null);
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

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (profileViewOpen) return;

      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose, profileViewOpen]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, handleClickOutside]);

  const hasAcceptedBid = bids.some((bid) => bid.status === "accepted");

  const handleAcceptBid = useCallback(
    async (bidId: string) => {
      setAcceptingBid(bidId);
      try {
        await jobApi.updateBidStatus(bidId, "accept");
        showToast.success("Bid accepted successfully!");

        setBids((prevBids) =>
          prevBids.map((bid) =>
            bid._id === bidId ? { ...bid, status: "accepted" as const } : bid
          )
        );

        onRefreshJobs();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to accept bid";
        showToast.error(errorMessage);
      } finally {
        setAcceptingBid(null);
      }
    },
    [onRefreshJobs]
  );

  const handleRejectBid = useCallback(async (bidId: string) => {
    setRejectingBid(bidId);
    try {
      await jobApi.updateBidStatus(bidId, "reject");
      showToast.success("Bid rejected successfully!");

      setBids((prevBids) =>
        prevBids.map((bid) =>
          bid._id === bidId ? { ...bid, status: "rejected" as const } : bid
        )
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reject bid";
      showToast.error(errorMessage);
    } finally {
      setRejectingBid(null);
    }
  }, []);

  const handleViewContractorProfile = useCallback(
    (contractor: Bid["contractor"]) => {
      setSelectedContractor(contractor);
      setProfileViewOpen(true);
    },
    []
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

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toLocaleString("en-US", {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-accent-100 text-accent-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Type guard to check if property is populated
  const isPropertyPopulated = (
    property: string | PropertyInJob | undefined
  ): property is PropertyInJob => {
    return (
      typeof property === "object" && property !== null && "_id" in property
    );
  };

  const propertyData = isPropertyPopulated(job.property) ? job.property : null;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-primary-900 truncate">
                {job.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {job.service} • Posted on {formatDate(job.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Loading State for Initial Data Fetch */}
          {bidsLoading && bids.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Loading job details...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Status Badges */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getJobStatusColor(
                    job.status
                  )}`}
                >
                  {job.status}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-100 text-accent-700">
                  {bids.length} {bids.length === 1 ? "Bid" : "Bids"}
                </span>
              </div>

              {/* Tabs */}
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

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
                {activeTab === "details" ? (
                  <div className="space-y-6">
                    {/* Description */}
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

                    {/* Job Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Category */}
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

                      {/* Budget */}
                      <div>
                        <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-accent-600" />
                          Estimated Budget
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-green-600 font-bold text-xl">
                            {formatCurrency(job.estimate)}
                          </p>
                        </div>
                      </div>

                      {/* Timeline */}
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

                    {/* Property Details Section */}
                    {propertyData && (
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-xl font-bold text-primary-900 mb-4 flex items-center gap-2">
                          <Home className="h-6 w-6 text-accent-600" />
                          Property Details
                        </h3>

                        {/* Property Images */}
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

                        {/* Property Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Property Title */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Home className="h-4 w-4" />
                              <span className="font-medium">Title</span>
                            </div>
                            <p className="text-gray-900 font-semibold">
                              {propertyData.title}
                            </p>
                          </div>

                          {/* Area */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Maximize className="h-4 w-4" />
                              <span className="font-medium">Area</span>
                            </div>
                            <p className="text-gray-900 font-semibold">
                              {propertyData.area} {propertyData.areaUnit}
                            </p>
                          </div>

                          {/* Bedrooms */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Bed className="h-4 w-4" />
                              <span className="font-medium">Bedrooms</span>
                            </div>
                            <p className="text-gray-900 font-semibold">
                              {propertyData.bedrooms}
                            </p>
                          </div>

                          {/* Bathrooms */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Bath className="h-4 w-4" />
                              <span className="font-medium">Bathrooms</span>
                            </div>
                            <p className="text-gray-900 font-semibold">
                              {propertyData.bathrooms}
                            </p>
                          </div>

                          {/* Kitchens */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <UtensilsCrossed className="h-4 w-4" />
                              <span className="font-medium">Kitchens</span>
                            </div>
                            <p className="text-gray-900 font-semibold">
                              {propertyData.kitchens}
                            </p>
                          </div>

                          {/* Total Rooms */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Grid3x3 className="h-4 w-4" />
                              <span className="font-medium">Total Rooms</span>
                            </div>
                            <p className="text-gray-900 font-semibold">
                              {propertyData.totalRooms}
                            </p>
                          </div>

                          {/* Location */}
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

                        {/* Property Description */}
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
                    {/* Accepted Bid Warning */}
                    {hasAcceptedBid && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold text-green-800 mb-1">
                              Bid Accepted
                            </h4>
                            <p className="text-sm text-green-700">
                              A bid has been accepted for this job. No further
                              bid actions are allowed.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loading Bids */}
                    {bidsLoading && (
                      <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <div className="flex justify-center items-center mb-4">
                          <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-600">Loading bids...</p>
                      </div>
                    )}

                    {/* No Bids */}
                    {!bidsLoading && bids.length === 0 && (
                      <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg mb-2">
                          No bids submitted yet
                        </p>
                        <p className="text-gray-500 text-sm">
                          Contractors will be able to submit their bids once
                          they view your job request.
                        </p>
                      </div>
                    )}

                    {/* Bids List */}
                    {!bidsLoading &&
                      bids.length > 0 &&
                      bids.map((bid: any) => {
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
                              {/* Header with Contractor Info and Toggle */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  {/* Profile Picture - Opens Profile */}
                                  <div
                                    onClick={() =>
                                      handleViewContractorProfile(
                                        bid.contractor
                                      )
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
                                        <User className="h-6 w-6 text-primary-600" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Contact Info - Opens Profile */}
                                  <div
                                    className="flex-1 min-w-0"
                                    onClick={() =>
                                      handleViewContractorProfile(
                                        bid.contractor
                                      )
                                    }
                                  >
                                    <h4 className="font-semibold text-gray-900 hover:text-primary-600 truncate cursor-pointer">
                                      {bid.contractor.firstName}{" "}
                                      {bid.contractor.lastName}
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 truncate cursor-pointer hover:text-primary-600 transition">
                                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="truncate">
                                        {bid.contractor.email}
                                      </span>
                                    </div>
                                    {bid.contractor.phone && (
                                      <div className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-primary-600 transition">
                                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{bid.contractor.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Status Badge and Toggle Button */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-semibold border whitespace-nowrap ${getStatusBadge(
                                      bid.status
                                    )}`}
                                  >
                                    {bid.status}
                                  </span>
                                  {/* Toggle Button */}
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

                              {/* Bid Amount - Always Visible */}
                              <div
                                className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                                onClick={() => toggleBidExpanded(bid._id)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600 font-medium">
                                    Bid Amount:
                                  </span>
                                  <span className="text-2xl font-bold text-green-600">
                                    {formatCurrency(bid.bidAmount)}
                                  </span>
                                </div>
                              </div>

                              {/* Collapsible Details */}
                              {isExpanded && (
                                <div className="space-y-4">
                                  {/* Timeline */}
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

                                  {/* Message */}
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

                                  {/* Materials */}
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

                                  {/* Warranty */}
                                  {bid.warranty && (
                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-gray-600" />
                                        Warranty
                                      </h5>
                                      <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                                        <p className="font-medium mb-1">
                                          {bid.warranty.period}{" "}
                                          {bid.warranty.period === 1
                                            ? "Month"
                                            : "Months"}{" "}
                                          Warranty
                                        </p>
                                        {bid.warranty.description && (
                                          <p className="text-xs text-gray-600 mt-2">
                                            {bid.warranty.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Submitted Date */}
                                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>
                                      Submitted on {formatDate(bid.createdAt)}
                                    </span>
                                  </div>

                                  {/* Action Buttons */}
                                  {bid.status === "pending" &&
                                    job.status === "open" &&
                                    !hasAcceptedBid && (
                                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                                        <button
                                          onClick={() =>
                                            handleAcceptBid(bid._id)
                                          }
                                          disabled={
                                            !!acceptingBid || !!rejectingBid
                                          }
                                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {acceptingBid === bid._id ? (
                                            <>
                                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                              <span>Accepting...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Check className="h-5 w-5" />
                                              <span>Accept Bid</span>
                                            </>
                                          )}
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleRejectBid(bid._id)
                                          }
                                          disabled={
                                            !!acceptingBid || !!rejectingBid
                                          }
                                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {rejectingBid === bid._id ? (
                                            <>
                                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                              <span>Rejecting...</span>
                                            </>
                                          ) : (
                                            <>
                                              <XCircle className="h-5 w-5" />
                                              <span>Reject Bid</span>
                                            </>
                                          )}
                                        </button>
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

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                {onEditJob && (
                  <div className="relative group">
                    <button
                      onClick={
                        isAdmin || !hasAcceptedBid ? onEditJob : undefined
                      }
                      disabled={!isAdmin && hasAcceptedBid}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        !isAdmin && hasAcceptedBid
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-accent-500 hover:bg-accent-600 text-white"
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                      Edit Job
                    </button>
                    {!isAdmin && hasAcceptedBid && (
                      <div className="absolute bottom-full mb-2 right-0 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 z-50">
                        Cannot edit job after accepting a bid
                        <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile View Modal */}
      {profileViewOpen && selectedContractor && (
        <ProfileViewModal
          user={selectedContractor as any}
          isOpen={profileViewOpen}
          onClose={handleCloseProfileView}
        />
      )}
    </>
  );
};

export default JobDetailViewModal;
