import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import type { ContractorJob } from "../types";
import { showToast } from "../utils/toast";
import { contractorBidApi } from "../services/contractorBidService";
import { useGeocoding } from "../hooks/useGeocoding";

interface ContractorJobDetailsModalProps {
  job: ContractorJob | null;
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
  leadInfo?: {
    canAccess: boolean;
    leadsUsed: number;
    leadsLimit: number;
    remaining?: number;
    resetDate?: string;
  } | null;
  bidInfo?: {
    alreadyBid: boolean;
  } | null;
  onBidSubmitted?: () => void;
}

const ContractorJobDetailsModal: React.FC<ContractorJobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  loading = false,
  leadInfo,
  bidInfo,
  onBidSubmitted,
}) => {
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidTimeline, setBidTimeline] = useState("");
  const [materials, setMaterials] = useState("");
  const [warranty, setWarranty] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);

  // Get lead stats from dashboard to check if can bid
  const { contractorData } = useSelector((state: RootState) => state.dashboard);
  const leadStats = contractorData?.contractor?.leadStats;
  const canBid = leadStats?.canBid ?? true; // Default to true if not available

  // Get property location address
  const propertyCoords = job?.property?.location?.coordinates;
  const { address: propertyAddress, loading: addressLoading } = useGeocoding(
    propertyCoords ? [propertyCoords[0], propertyCoords[1]] : null
  );

  if (!isOpen) return null;

  const handleCopyLocation = () => {
    if (propertyCoords) {
      const locationText = `${propertyCoords[1].toFixed(
        6
      )}, ${propertyCoords[0].toFixed(6)}`;
      navigator.clipboard.writeText(locationText);
      showToast.success("Location coordinates copied to clipboard!");
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    if (!job) return;
    e.preventDefault();

    // Check if can bid based on lead limit
    if (!canBid) {
      showToast.error(
        "You have reached your lead limit. Please upgrade your membership."
      );
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      showToast.error("Please enter a valid bid amount");
      return;
    }

    if (!bidTimeline || parseInt(bidTimeline) <= 0) {
      showToast.error("Please enter a valid timeline");
      return;
    }

    if (!bidMessage.trim()) {
      showToast.error("Please add a message for your bid");
      return;
    }

    setSubmittingBid(true);

    try {
      // Calculate timeline dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(bidTimeline));

      const bidData = {
        jobRequestId: job._id,
        bidAmount: parseFloat(bidAmount) * 100, // Convert to cents
        message: bidMessage,
        timeline: {
          startDate: startDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
          endDate: endDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        },
        ...(materials && { materials }),
        ...(warranty && { warranty }),
      };

      const response = await contractorBidApi.submitBid(bidData);

      // Show lead info from response
      if (response.data?.leadInfo) {
        const { leadsUsed, remaining, leadsLimit } = response.data.leadInfo;
        showToast.success(
          `Bid submitted! ${leadsUsed}/${leadsLimit} leads used (${remaining} remaining)`
        );
      } else {
        showToast.success("Bid submitted successfully!");
      }

      setShowBidForm(false);
      setBidAmount("");
      setBidMessage("");
      setBidTimeline("");
      setMaterials("");
      setWarranty("");
      if (onBidSubmitted) onBidSubmitted();
      onClose();
    } catch (error: any) {
      showToast.error(error.message || "Failed to submit bid");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Check if contractor has already bid from either bidInfo or job.alreadyBid
  const alreadyBid = bidInfo?.alreadyBid || job?.alreadyBid || false;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 p-2 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto relative my-4">
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
              <p className="mt-4 text-gray-600 font-medium">
                Loading job details...
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 sm:p-6 rounded-t-lg z-10">
          <button
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:text-gray-200 text-3xl font-bold leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-xl sm:text-2xl font-bold pr-8 mb-2">
            {job?.title || "Job Details"}
          </h2>
          {job && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {job.service}
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {job.type === "off_market" ? "Off-Market" : "Regular"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full ${
                    job.status === "open"
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <div className="text-sm text-white text-opacity-90">
                Posted:{" "}
                {new Date(job.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          )}
        </div>

        {/* Lead Info Banner */}
        {leadInfo && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mx-4 sm:mx-6 mt-4 rounded">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Lead Usage: {leadInfo.leadsUsed}/{leadInfo.leadsLimit} leads
                  used
                  {leadInfo.remaining !== undefined &&
                    ` (${leadInfo.remaining} remaining)`}
                </p>
                {leadInfo.resetDate && (
                  <p className="text-xs text-blue-700 mt-1">
                    Resets on:{" "}
                    {new Date(leadInfo.resetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Already Bid Banner */}
        {alreadyBid && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-yellow-500 p-4 mx-4 sm:mx-6 mt-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-yellow-900">
                  Bid Already Submitted
                </p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  You have already placed a bid on this job. Check "My Bids" to
                  view it.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {job && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed">{job.description}</p>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="text-sm text-gray-600 font-medium mb-2">
                  Customer Estimate
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  ${(job.estimate / 100).toLocaleString()}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="text-sm text-gray-600 font-medium mb-2">
                  Timeline Required
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {job.timeline} days
                </div>
              </div>
            </div>

            {/* Property Info */}
            {job.property && (
              <div className="bg-primary-50 rounded-lg p-5 border border-primary-200">
                <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-primary-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Property Information
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-medium text-primary-600 mb-1.5">
                      Property Name
                    </div>
                    <div className="text-base font-semibold text-primary-900">
                      {job.property.title}
                    </div>
                  </div>

                  {job.property.location && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-primary-600">
                          Location
                        </div>
                        <button
                          onClick={handleCopyLocation}
                          className="text-primary-600 hover:text-primary-800 transition-colors p-1.5 hover:bg-primary-50 rounded"
                          title="Copy coordinates"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                      {addressLoading ? (
                        <div className="text-sm text-primary-700">
                          Loading address...
                        </div>
                      ) : propertyAddress ? (
                        <div className="text-sm text-primary-900 font-medium mb-2">
                          {propertyAddress}
                        </div>
                      ) : null}
                      <div className="text-xs text-primary-700 font-mono bg-primary-50 px-2 py-1 rounded">
                        {job.property.location.coordinates[1].toFixed(6)}°N,{" "}
                        {job.property.location.coordinates[0].toFixed(6)}°E
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer Contact */}
            {job.createdBy && (
              <div className="bg-accent-50 rounded-lg p-5 border border-accent-200">
                <h3 className="text-lg font-semibold text-accent-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-accent-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Customer Contact
                </h3>
                <div className="space-y-3">
                  <a
                    href={`mailto:${job.createdBy.email}`}
                    className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-200 hover:border-accent-300 hover:bg-accent-50 transition-all"
                  >
                    <div className="bg-accent-100 p-2 rounded-lg">
                      <svg
                        className="w-5 h-5 text-accent-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-accent-600 font-medium mb-0.5">
                        Email
                      </div>
                      <div className="text-sm text-gray-900 font-semibold">
                        {job.createdBy.email}
                      </div>
                    </div>
                  </a>
                  <a
                    href={`tel:${job.createdBy.phone}`}
                    className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-200 hover:border-accent-300 hover:bg-accent-50 transition-all"
                  >
                    <div className="bg-accent-100 p-2 rounded-lg">
                      <svg
                        className="w-5 h-5 text-accent-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-accent-600 font-medium mb-0.5">
                        Phone
                      </div>
                      <div className="text-sm text-gray-900 font-semibold">
                        {job.createdBy.phone}
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Bid Form */}
            {!showBidForm && !alreadyBid && (
              <div>
                {!canBid && leadStats && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-red-800 font-medium">
                      Lead limit reached ({leadStats.used}/{leadStats.limit}).
                      Upgrade your membership to continue bidding.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setShowBidForm(true)}
                  disabled={!canBid}
                  className="w-full bg-gradient-to-r from-accent-500 to-accent-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-accent-600 hover:to-accent-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                >
                  {canBid ? "Submit a Bid" : "Lead Limit Reached"}
                </button>
              </div>
            )}

            {showBidForm && !alreadyBid && (
              <form
                onSubmit={handleSubmitBid}
                className="bg-white border-2 border-accent-200 rounded-lg p-4 sm:p-6 space-y-4"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Submit Your Bid
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bid Amount ($) *
                    </label>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="e.g., 3500"
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeline (days) *
                    </label>
                    <input
                      type="number"
                      value={bidTimeline}
                      onChange={(e) => setBidTimeline(e.target.value)}
                      placeholder="e.g., 7"
                      min="1"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message / Proposal *
                  </label>
                  <textarea
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Describe your approach, experience, and why you're the best fit for this job..."
                    rows={4}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materials (Optional)
                  </label>
                  <textarea
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="e.g., Premium fixtures and pipes included..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty (Optional)
                  </label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g., 1 year parts and labor warranty"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="flex-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-accent-600 hover:to-accent-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingBid ? "Submitting..." : "Submit Bid"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBidForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ContractorJobDetailsModal;
