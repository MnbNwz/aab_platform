import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  Package,
  Shield,
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  Check,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { Job, Bid } from "../store/slices/jobSlice";
import Loader from "./ui/Loader";

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onAcceptBid?: (bidId: string) => void;
  onRejectBid?: (bidId: string) => void;
  acceptingBid?: string | null;
  rejectingBid?: string | null;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  isOpen,
  onClose,
  job,
  onAcceptBid,
  onRejectBid,
  acceptingBid,
  rejectingBid,
}) => {
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);
  const [showAllBids, setShowAllBids] = useState(true);

  if (!isOpen) return null;

  const toggleBidExpansion = (bidId: string) => {
    setExpandedBidId(expandedBidId === bidId ? null : bidId);
  };

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

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
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

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-primary-700 to-primary-800 px-4 sm:px-6 py-4 border-b border-primary-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                  {job.title}
                </h2>
                <p className="text-xs sm:text-sm text-primary-100 mt-1">
                  {job.service} • Posted on {formatDate(job.createdAt)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </button>
            </div>

            {/* Status Badge */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getJobStatusColor(
                  job.status
                )}`}
              >
                {job.status}
              </span>
              {job.bidCount !== undefined && (
                <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-white/20 text-white">
                  {job.bidCount} {job.bidCount === 1 ? "Bid" : "Bids"}
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Job Details Section */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-primary-900 mb-4">
                Job Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="text-sm sm:text-base text-gray-900 mt-1">
                    {job.description}
                  </p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500">
                    Category
                  </label>
                  <p className="text-sm sm:text-base text-gray-900 mt-1 capitalize">
                    {job.category}
                  </p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500">
                    Estimated Budget
                  </label>
                  <p className="text-sm sm:text-base font-semibold text-green-600 mt-1">
                    {formatCurrency(job.estimate)}
                  </p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500">
                    Timeline
                  </label>
                  <p className="text-sm sm:text-base text-gray-900 mt-1">
                    {job.timeline} {job.timeline === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bids Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-primary-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-accent-500" />
                  Bids Received ({job.bids?.length || 0})
                </h3>
                {job.bids && job.bids.length > 0 && (
                  <button
                    onClick={() => setShowAllBids(!showAllBids)}
                    className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
                  >
                    {showAllBids ? (
                      <>
                        Hide Bids <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show Bids <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* No Bids Message */}
              {(!job.bids || job.bids.length === 0) && (
                <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
                  <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm sm:text-base text-gray-600">
                    No bids have been submitted for this job yet.
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Contractors will be able to submit their bids once they view
                    your job request.
                  </p>
                </div>
              )}

              {/* Bids List */}
              {showAllBids &&
                job.bids &&
                job.bids.length > 0 &&
                job.bids.map((bid: Bid) => (
                  <div
                    key={bid._id}
                    className={`border-2 rounded-lg overflow-hidden transition-all ${
                      bid.status === "accepted"
                        ? "border-green-300 bg-green-50"
                        : bid.status === "rejected"
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-white hover:border-primary-300"
                    }`}
                  >
                    {/* Bid Header */}
                    <div
                      className="p-4 sm:p-5 cursor-pointer"
                      onClick={() => toggleBidExpansion(bid._id)}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Contractor Avatar */}
                        <div className="flex-shrink-0">
                          {bid.contractor.profileImage ? (
                            <img
                              src={bid.contractor.profileImage}
                              alt={`${bid.contractor.firstName} ${bid.contractor.lastName}`}
                              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center border-2 border-white shadow-sm">
                              <User className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Bid Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                {bid.contractor.firstName}{" "}
                                {bid.contractor.lastName}
                              </h4>
                              {bid.contractor.contractor?.companyName && (
                                <p className="text-xs sm:text-sm text-gray-600 truncate">
                                  {bid.contractor.contractor.companyName}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-base sm:text-lg font-bold text-primary-900">
                                {formatCurrency(bid.bidAmount)}
                              </p>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getBidStatusColor(
                                  bid.status
                                )}`}
                              >
                                {bid.status}
                              </span>
                            </div>
                          </div>

                          {/* Quick Info */}
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600">
                            {bid.timeline && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span>
                                  {formatDate(bid.timeline.startDate)} -{" "}
                                  {formatDate(bid.timeline.endDate)}
                                </span>
                              </div>
                            )}
                            {bid.materials?.included && (
                              <div className="flex items-center gap-1">
                                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                                <span>Materials Included</span>
                              </div>
                            )}
                            {bid.warranty && (
                              <div className="flex items-center gap-1">
                                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                                <span>
                                  {bid.warranty.period} Month Warranty
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Expand/Collapse Indicator */}
                          <div className="mt-3 flex items-center justify-center">
                            {expandedBidId === bid._id ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Bid Details */}
                    {expandedBidId === bid._id && (
                      <div className="border-t border-gray-200 bg-white p-4 sm:p-5 space-y-4">
                        {/* Contractor Details */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">
                            Contractor Details
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="truncate">
                                {bid.contractor.email}
                              </span>
                            </div>
                            {bid.contractor.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{bid.contractor.phone}</span>
                              </div>
                            )}
                            {bid.contractor.contractor?.license && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Award className="h-4 w-4 text-gray-400" />
                                <span>
                                  License: {bid.contractor.contractor.license}
                                </span>
                              </div>
                            )}
                            {bid.contractor.contractor?.taxId && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Briefcase className="h-4 w-4 text-gray-400" />
                                <span>
                                  Tax ID: {bid.contractor.contractor.taxId}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Services */}
                          {bid.contractor.contractor?.services &&
                            bid.contractor.contractor.services.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                  Services Offered:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {bid.contractor.contractor.services.map(
                                    (service, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                                      >
                                        {service}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Bid Message */}
                        {bid.message && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">
                              Proposal Message
                            </h5>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                              {bid.message}
                            </p>
                          </div>
                        )}

                        {/* Materials Details */}
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

                        {/* Warranty Details */}
                        {bid.warranty && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Shield className="h-4 w-4 text-gray-600" />
                              Warranty
                            </h5>
                            <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                              <p className="font-medium mb-1">
                                {bid.warranty.period}{" "}
                                {bid.warranty.period === 1 ? "Month" : "Months"}{" "}
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
                        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Submitted on {formatDate(bid.createdAt)}</span>
                        </div>

                        {/* Action Buttons */}
                        {bid.status === "pending" && job.status === "open" && (
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAcceptBid && onAcceptBid(bid._id);
                              }}
                              disabled={!!acceptingBid || !!rejectingBid}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                              {acceptingBid === bid._id ? (
                                <>
                                  <Loader size="small" color="white" />
                                  <span>Accepting...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                                  <span>Accept Bid</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRejectBid && onRejectBid(bid._id);
                              }}
                              disabled={!!acceptingBid || !!rejectingBid}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                              {rejectingBid === bid._id ? (
                                <>
                                  <Loader size="small" color="white" />
                                  <span>Rejecting...</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                  <span>Reject Bid</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default JobDetailsModal;
