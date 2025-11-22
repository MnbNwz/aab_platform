import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import type { ContractorJobDetails } from "../types";
import type { SubmitBidPayload } from "../services/contractorBidService";
import { showToast } from "../utils/toast";
import { submitBidThunk } from "../store/thunks/contractorBidsThunks";
import { addRecentBid } from "../store/slices/dashboardSlice";
import { useGeocoding } from "../hooks/useGeocoding";
import { formatJobStatusText } from "../utils/badgeColors";
import { BaseModal, InfoField, Badge, Text, Button } from "./reusable";
import ImageViewerModal from "./dashboard/ImageViewerModal";

interface ContractorJobDetailsModalProps {
  job: ContractorJobDetails | null;
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
  activeTab?: "available" | "started" | "completed"; // Add activeTab prop
}

// Extracted ImageCarousel component for better structure and performance
interface ImageCarouselProps {
  images: string[];
  onImageClick: (url: string) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = memo(
  ({ images, onImageClick }) => {
    const [imageCarouselIndex, setImageCarouselIndex] = useState(0);
    const imagesToShowDesktop = 3;
    const imagesToShowTablet = 2;

    // Calculate carousel limits - memoized
    const maxCarouselIndex = useMemo(() => {
      return images.length <= imagesToShowDesktop
        ? 0
        : images.length - imagesToShowDesktop;
    }, [images.length, imagesToShowDesktop]);

    // Memoized navigation states
    const canGoPrevious = useMemo(
      () => imageCarouselIndex > 0,
      [imageCarouselIndex]
    );
    const canGoNext = useMemo(
      () => imageCarouselIndex < maxCarouselIndex,
      [imageCarouselIndex, maxCarouselIndex]
    );

    // Memoized navigation handlers
    const handlePrevious = useCallback(() => {
      setImageCarouselIndex((prev) => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
      setImageCarouselIndex((prev) => Math.min(maxCarouselIndex, prev + 1));
    }, [maxCarouselIndex]);

    // Memoized image slices
    const desktopImages = useMemo(() => {
      return images.slice(
        imageCarouselIndex,
        imageCarouselIndex + imagesToShowDesktop
      );
    }, [images, imageCarouselIndex, imagesToShowDesktop]);

    const tabletImages = useMemo(() => {
      return images.slice(
        imageCarouselIndex,
        imageCarouselIndex + imagesToShowTablet
      );
    }, [images, imageCarouselIndex, imagesToShowTablet]);

    const handleImageClick = useCallback(
      (imageUrl: string) => {
        onImageClick(imageUrl);
      },
      [onImageClick]
    );

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Previous Arrow */}
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous image"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Images Container */}
          <div className="flex-1 flex gap-2 sm:gap-3">
            {/* Show 1 image on small screens */}
            <div className="flex-1 md:hidden">
              <div
                onClick={() =>
                  handleImageClick(images[imageCarouselIndex] || "")
                }
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={images[imageCarouselIndex] || ""}
                  alt={`Property ${imageCarouselIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Show 2 images on tablet */}
            {tabletImages.map((image, index) => (
              <div
                key={`tablet-${imageCarouselIndex}-${index}-${image}`}
                onClick={() => handleImageClick(image)}
                className="flex-1 relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity hidden md:block lg:hidden"
              >
                <img
                  src={image}
                  alt={`Property ${imageCarouselIndex + index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {/* Show 3 images on desktop */}
            {desktopImages.map((image, index) => (
              <div
                key={`desktop-${imageCarouselIndex}-${index}-${image}`}
                onClick={() => handleImageClick(image)}
                className="flex-1 relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-all duration-300 ease-in-out transform hover:scale-105 hidden lg:block"
              >
                <img
                  src={image}
                  alt={`Property ${imageCarouselIndex + index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            disabled={!canGoNext || images.length === 0}
            className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next image"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="text-center mt-2">
          <span className="text-xs sm:text-sm text-primary-600">
            {imageCarouselIndex + 1} of {images.length}
          </span>
        </div>
      </div>
    );
  }
);

ImageCarousel.displayName = "ImageCarousel";

const ContractorJobDetailsModal: React.FC<ContractorJobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  loading = false,
  leadInfo,
  onBidSubmitted,
  activeTab = "available", // Default to "available"
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const bidFormRef = useRef<HTMLFormElement>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidTimeline, setBidTimeline] = useState("");
  const [materials, setMaterials] = useState("");
  const [warranty, setWarranty] = useState("");
  const [warrantyDescription, setWarrantyDescription] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);

  // Memoized images array
  const propertyImages = useMemo(
    () => job?.property?.images || [],
    [job?.property?.images]
  );

  // Memoized image click handler
  const handleImageClick = useCallback((imageUrl: string) => {
    setFullSizeImage(imageUrl);
  }, []);

  // Memoized carousel key to force remount when job changes
  const carouselKey = useMemo(() => `carousel-${job?._id || ""}`, [job?._id]);

  // Get lead stats from dashboard to check if can bid
  const { contractorData } = useSelector((state: RootState) => state.dashboard);
  const leadStats = contractorData?.contractor?.leadStats;
  const canBid = leadStats?.canBid ?? true; // Default to true if not available

  // Get property location address
  const propertyCoords = job?.property?.location?.coordinates;
  const { address: propertyAddress, loading: addressLoading } = useGeocoding(
    propertyCoords ? [propertyCoords[0], propertyCoords[1]] : null
  );

  // Check if contractor has already bid using job.self
  const alreadyBid = job?.self || false;
  const myBid = job?.myBid || null;
  const bidAccepted = job?.selfBidAccepted || false;

  // Timer state for started jobs
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    extraDays?: number;
    extraHours?: number;
    extraMinutes?: number;
    extraSeconds?: number;
  } | null>(null);

  // Store interval ID in ref to prevent stale closures
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize endDate to avoid recreating on every render
  const endDate = useMemo(() => {
    if (activeTab === "started" && myBid?.timeline?.endDate) {
      return new Date(myBid.timeline.endDate);
    }
    return null;
  }, [activeTab, myBid?.timeline?.endDate]);

  // Memoized calculation function for time breakdown
  const calculateTimeBreakdown = useCallback(
    (diff: number, isExpired: boolean) => {
      const absDiff = Math.abs(diff);
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

      if (isExpired) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          extraDays: days,
          extraHours: hours,
          extraMinutes: minutes,
          extraSeconds: seconds,
        };
      }

      return {
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      };
    },
    []
  );

  // Calculate time remaining when viewing from started tab
  useEffect(() => {
    if (!endDate) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      const isExpired = diff <= 0;
      const newTimeRemaining = calculateTimeBreakdown(diff, isExpired);

      setTimeRemaining((prev) => {
        // Only update if values changed
        if (!prev) return newTimeRemaining;

        if (isExpired) {
          if (
            prev.isExpired &&
            prev.extraDays === newTimeRemaining.extraDays &&
            prev.extraHours === newTimeRemaining.extraHours &&
            prev.extraMinutes === newTimeRemaining.extraMinutes &&
            prev.extraSeconds === newTimeRemaining.extraSeconds
          ) {
            return prev;
          }
        } else {
          if (
            !prev.isExpired &&
            prev.days === newTimeRemaining.days &&
            prev.hours === newTimeRemaining.hours &&
            prev.minutes === newTimeRemaining.minutes &&
            prev.seconds === newTimeRemaining.seconds
          ) {
            return prev;
          }
        }

        return newTimeRemaining;
      });
    };

    // Initial update
    updateTimer();

    // Set up interval
    intervalRef.current = setInterval(updateTimer, 1000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endDate, calculateTimeBreakdown]);

  if (!isOpen) return null;

  const handleCopyLocation = () => {
    if (propertyAddress) {
      // Copy the actual address if available
      navigator.clipboard.writeText(propertyAddress);
      showToast.success("Location address copied to clipboard!");
    } else if (propertyCoords) {
      // Fallback to coordinates if address not loaded
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

    // Validate that bid amount is a whole number (no decimals)
    if (parseFloat(bidAmount) % 1 !== 0) {
      showToast.error("Bid amount must be a whole number (no decimals)");
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

      const bidDataBase: Omit<SubmitBidPayload, "materials" | "warranty"> = {
        jobRequestId: job._id,
        bidAmount: Math.round(parseFloat(bidAmount) * 100), // Convert dollars to cents for backend
        message: bidMessage,
        timeline: {
          startDate: startDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
          endDate: endDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        },
      };

      const bidData: SubmitBidPayload = {
        ...bidDataBase,
        ...(materials && materials.trim()
          ? {
              materials: {
                included: true,
                description: materials.trim(),
              },
            }
          : {}),
        ...(warranty && warranty.trim()
          ? (() => {
              const period = parseFloat(warranty.trim());
              if (!isNaN(period) && period > 0) {
                return {
                  warranty: {
                    period: Math.round(period), // Round to nearest whole month
                    // Use custom description if provided, otherwise auto-generate
                    description: warrantyDescription.trim()
                      ? warrantyDescription.trim()
                      : `${Math.round(period)} month${
                          Math.round(period) !== 1 ? "s" : ""
                        } warranty`,
                  },
                };
              }
              return {};
            })()
          : {}),
      };

      const result = await dispatch(submitBidThunk(bidData));

      // Check if bid submission was successful
      if (submitBidThunk.fulfilled.match(result)) {
        const { leadInfo, bid: bidResult } = result.payload || {};

        // Add the new bid to recent bids in dashboard (only if we have complete data)
        if (bidResult?._id && job?.title && job?.service) {
          dispatch(
            addRecentBid({
              bidId: bidResult._id,
              jobTitle: job.title,
              service: job.service,
              bidAmount: bidData.bidAmount, // Already in cents from bidData
              status: "pending",
            })
          );
        }

        // Show success message with lead info if available
        const message = leadInfo
          ? `Bid submitted! ${leadInfo.leadsUsed}/${
              leadInfo.leadsLimit
            } leads used (${leadInfo.remaining ?? 0} remaining)`
          : "Bid submitted successfully!";
        showToast.success(message);
      } else {
        // Handle rejection
        throw new Error((result.payload as string) || "Failed to submit bid");
      }

      // Reset form and close modal
      setShowBidForm(false);
      setBidAmount("");
      setBidMessage("");
      setBidTimeline("");
      setMaterials("");
      setWarranty("");
      setWarrantyDescription("");
      onBidSubmitted?.();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit bid";
      showToast.error(errorMessage);
    } finally {
      setSubmittingBid(false);
    }
  };

  // Format date as "X days ago" or full date
  const formatPostedDate = (dateString: string) => {
    const postedDate = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - postedDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMonths < 1) {
      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "1 day ago";
      return `${diffInDays} days ago`;
    }

    return postedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format subtitle with job info
  const subtitle = job
    ? `${job.service} • Posted: ${formatPostedDate(job.createdAt)}`
    : undefined;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={job?.title || "Job Details"}
        subtitle={subtitle}
        maxWidth="4xl"
        showFooter={false}
        className="relative"
        headerClassName="bg-gradient-to-r from-primary-600 to-accent-600 text-white"
        bodyClassName={loading || !job ? "min-h-[500px]" : ""}
      >
        {/* Loading State - Overlay that doesn't affect layout */}
        {(loading || !job) && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 rounded-lg backdrop-blur-sm">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
              <Text className="mt-4 text-primary-600 font-medium">
                Loading job details...
              </Text>
            </div>
          </div>
        )}

        {/* Badges */}
        {job && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="info">{job.service}</Badge>
            <Badge variant="info">Regular</Badge>
            <Badge
              variant={
                job.status === "completed"
                  ? "success"
                  : job.status === "cancelled"
                  ? "danger"
                  : "warning"
              }
            >
              {formatJobStatusText(job.status)}
            </Badge>
          </div>
        )}

        {/* Content area - always rendered to maintain modal height */}
        <div className="space-y-6 min-h-[400px]">
          {job ? (
            <>
              {/* Timer for Started Jobs */}
              {activeTab === "started" && timeRemaining && myBid?.timeline && (
                <div
                  className={`mx-4 sm:mx-6 mt-4 border-l-4 rounded-lg p-4 shadow-sm ${
                    timeRemaining.isExpired
                      ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-500"
                      : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-500"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1">
                      <div
                        className={`text-sm font-semibold mb-1 ${
                          timeRemaining.isExpired
                            ? "text-red-900"
                            : "text-green-900"
                        }`}
                      >
                        Job Started - Time Remaining
                      </div>
                      {timeRemaining.isExpired ? (
                        <div>
                          <div className="text-base font-semibold text-red-700 mb-2">
                            Overdue by:
                          </div>
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl sm:text-3xl font-bold text-red-700">
                                {timeRemaining.extraDays || 0}
                              </span>
                              <span className="text-sm text-red-600 font-medium">
                                {(timeRemaining.extraDays || 0) === 1
                                  ? "Day"
                                  : "Days"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl sm:text-3xl font-bold text-red-700">
                                {String(timeRemaining.extraHours || 0).padStart(
                                  2,
                                  "0"
                                )}
                              </span>
                              <span className="text-sm text-red-600 font-medium">
                                {(timeRemaining.extraHours || 0) === 1
                                  ? "Hour"
                                  : "Hours"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl sm:text-3xl font-bold text-red-700">
                                {String(
                                  timeRemaining.extraMinutes || 0
                                ).padStart(2, "0")}
                              </span>
                              <span className="text-sm text-red-600 font-medium">
                                {(timeRemaining.extraMinutes || 0) === 1
                                  ? "Min"
                                  : "Mins"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl sm:text-3xl font-bold text-red-700">
                                {String(
                                  timeRemaining.extraSeconds || 0
                                ).padStart(2, "0")}
                              </span>
                              <span className="text-sm text-red-600 font-medium">
                                {(timeRemaining.extraSeconds || 0) === 1
                                  ? "Sec"
                                  : "Secs"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-bold text-green-700">
                              {timeRemaining.days}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              {timeRemaining.days === 1 ? "Day" : "Days"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-bold text-green-700">
                              {String(timeRemaining.hours).padStart(2, "0")}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              {timeRemaining.hours === 1 ? "Hour" : "Hours"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-bold text-green-700">
                              {String(timeRemaining.minutes).padStart(2, "0")}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              {timeRemaining.minutes === 1 ? "Min" : "Mins"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-bold text-green-700">
                              {String(timeRemaining.seconds).padStart(2, "0")}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              {timeRemaining.seconds === 1 ? "Sec" : "Secs"}
                            </span>
                          </div>
                        </div>
                      )}
                      <div
                        className={`text-xs mt-2 ${
                          timeRemaining.isExpired
                            ? "text-red-700"
                            : "text-green-700"
                        }`}
                      >
                        End Date:{" "}
                        {myBid?.timeline?.endDate &&
                          new Date(myBid.timeline.endDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lead Info Banner */}
              {leadInfo && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mx-4 sm:mx-6 mt-4 rounded">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Lead Usage: {leadInfo.leadsUsed}/{leadInfo.leadsLimit}{" "}
                        leads used
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

              {/* My Bid Display - Show if contractor has bid (self: true) */}
              {alreadyBid && myBid && (
                <div
                  className={`border-l-4 p-4 sm:p-6 mx-4 sm:mx-6 mt-4 rounded-lg shadow-sm ${
                    myBid.status === "accepted"
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-500"
                      : myBid.status === "rejected"
                      ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-500"
                      : "bg-gradient-to-r from-amber-50 to-yellow-50 border-yellow-500"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`p-2 rounded-full ${
                        myBid.status === "accepted"
                          ? "bg-green-100"
                          : myBid.status === "rejected"
                          ? "bg-red-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${
                          myBid.status === "accepted"
                            ? "text-green-600"
                            : myBid.status === "rejected"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            myBid.status === "accepted"
                              ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              : myBid.status === "rejected"
                              ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          }
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-bold ${
                          myBid.status === "accepted"
                            ? "text-green-900"
                            : myBid.status === "rejected"
                            ? "text-red-900"
                            : "text-yellow-900"
                        }`}
                      >
                        {myBid.status === "accepted"
                          ? "🎉 Your Bid Was Accepted!"
                          : myBid.status === "rejected"
                          ? "Bid Rejected"
                          : "Your Bid (Pending Review)"}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          myBid.status === "accepted"
                            ? "text-green-700"
                            : myBid.status === "rejected"
                            ? "text-red-700"
                            : "text-yellow-700"
                        }`}
                      >
                        {myBid.status === "accepted"
                          ? "Congratulations! The customer has accepted your bid. Contact details are now available below."
                          : myBid.status === "rejected"
                          ? "Unfortunately, your bid was not selected for this job."
                          : "Waiting for customer to review your bid."}
                      </p>
                    </div>
                  </div>

                  {/* Bid Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">
                        Your Bid Amount
                      </div>
                      <div className="text-lg font-bold text-primary-700">
                        $
                        {(myBid.bidAmount
                          ? myBid.bidAmount / 100
                          : 0
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    {myBid.timeline && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">
                          Timeline
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(
                            myBid.timeline.startDate
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(
                            myBid.timeline.endDate
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {myBid.materials && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">
                          Materials
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {myBid.materials.included
                            ? "✓ Included"
                            : "✗ Not Included"}
                        </div>
                        {myBid.materials.description && (
                          <div className="text-xs text-gray-600 mt-1">
                            {myBid.materials.description}
                          </div>
                        )}
                      </div>
                    )}

                    {myBid.warranty && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">
                          Warranty
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {myBid.warranty.period}{" "}
                          {myBid.warranty.period === 1 ? "Month" : "Months"}
                        </div>
                        {myBid.warranty.description && (
                          <div className="text-xs text-gray-600 mt-1">
                            {myBid.warranty.description}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {myBid.message && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200 mt-3">
                      <div className="text-xs text-gray-600 mb-1">
                        Your Message
                      </div>
                      <div className="text-sm text-gray-900">
                        {myBid.message}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {job && (
                <InfoField
                  label="Description"
                  value={job.description}
                  valueClassName="block text-primary-700 leading-relaxed text-sm sm:text-base"
                />
              )}

              {/* Key Details Grid */}
              {job && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField
                    label="Customer Estimate"
                    value={`$${(job.estimate
                      ? job.estimate / 100
                      : 0
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
                    valueClassName="text-3xl font-bold text-accent-700"
                  />
                  <InfoField
                    label="Timeline Required"
                    value={`${job.timeline} days`}
                    valueClassName="text-3xl font-bold text-primary-900"
                  />
                </div>
              )}

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

                  {/* Property Images */}
                  {propertyImages.length > 0 && (
                    <div key={carouselKey}>
                      <ImageCarousel
                        images={propertyImages}
                        onImageClick={handleImageClick}
                      />
                    </div>
                  )}

                  {/* Property Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-4 border border-primary-200">
                      <div className="text-xs font-medium text-primary-600 mb-1.5">
                        Property Name
                      </div>
                      <div className="text-base font-semibold text-primary-900">
                        {job.property.title}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-primary-200">
                      <div className="text-xs font-medium text-primary-600 mb-1.5">
                        Type
                      </div>
                      <div className="text-base font-semibold text-primary-900 capitalize">
                        {job.property.propertyType}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-primary-200">
                      <div className="text-xs font-medium text-primary-600 mb-1.5">
                        Area
                      </div>
                      <div className="text-base font-semibold text-primary-900">
                        {job.property.area} {job.property.areaUnit}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-primary-200">
                      <div className="text-xs font-medium text-primary-600 mb-1.5">
                        Bedrooms
                      </div>
                      <div className="text-base font-semibold text-primary-900">
                        {job.property.bedrooms}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-primary-200">
                      <div className="text-xs font-medium text-primary-600 mb-1.5">
                        Bathrooms
                      </div>
                      <div className="text-base font-semibold text-primary-900">
                        {job.property.bathrooms}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-primary-200">
                      <div className="text-xs font-medium text-primary-600 mb-1.5">
                        Kitchens
                      </div>
                      <div className="text-base font-semibold text-primary-900">
                        {job.property.kitchens}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-primary-200">
                      <div className="text-xs font-medium text-primary-600 mb-1.5">
                        Total Rooms
                      </div>
                      <div className="text-base font-semibold text-primary-900">
                        {job.property.totalRooms}
                      </div>
                    </div>

                    {job.property.location && (
                      <div className="bg-white rounded-lg p-4 border border-primary-200 sm:col-span-2">
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

                  {/* Property Description */}
                  {job.property.description && (
                    <div className="mt-4 bg-white rounded-lg p-4 border border-primary-200">
                      <div className="text-xs font-medium text-primary-600 mb-2">
                        Property Description
                      </div>
                      <p className="text-sm text-primary-900 leading-relaxed">
                        {job.property.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Contact - Only show if bid is accepted */}
              {bidAccepted &&
                job.createdBy &&
                (job.createdBy.email ||
                  job.createdBy.phone ||
                  job.createdBy.name) && (
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
                      {job.createdBy.name && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-3">
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
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-accent-600 font-medium mb-0.5">
                                Customer Name
                              </div>
                              <div className="text-sm text-gray-900 font-semibold">
                                {job.createdBy.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {job.createdBy.email && (
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
                      )}
                      {job.createdBy.phone && (
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
                      )}
                    </div>
                  </div>
                )}

              {/* Lead Limit Warning */}
              {!alreadyBid && !canBid && leadStats && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">
                    Lead limit reached ({leadStats.used}/{leadStats.limit}).
                    Upgrade your membership to continue bidding.
                  </p>
                </div>
              )}

              {/* Submit Bid Button - Show when contractor can bid and hasn't bid yet */}
              {!alreadyBid && canBid && activeTab === "available" && job && (
                <div className="mx-4 sm:mx-6 mt-6 pb-4">
                  <Button
                    variant="accent"
                    fullWidth
                    onClick={() => setShowBidForm(true)}
                    className="py-3 text-base font-semibold"
                  >
                    Submit Bid
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Placeholder to maintain modal height during loading */
            <div className="h-full" />
          )}
        </div>
      </BaseModal>

      {/* Bid Form Modal */}
      <BaseModal
        isOpen={showBidForm && !alreadyBid && activeTab === "available"}
        onClose={() => setShowBidForm(false)}
        title="Submit Your Bid"
        subtitle="Provide details about your bid for this job"
        maxWidth="2xl"
        showFooter={false}
        headerClassName="bg-gradient-to-r from-primary-600 to-accent-600 text-white"
      >
        <form
          ref={bidFormRef}
          onSubmit={handleSubmitBid}
          className="space-y-4 pb-0"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Bid Amount ($) *
              </label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow whole numbers (no decimals)
                  if (value === "" || /^\d+$/.test(value)) {
                    setBidAmount(value);
                  }
                }}
                placeholder="e.g., 3500"
                step="1"
                min="1"
                required
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 placeholder-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Timeline (days) *
              </label>
              <input
                type="number"
                value={bidTimeline}
                onChange={(e) => setBidTimeline(e.target.value)}
                placeholder="e.g., 7"
                min="1"
                required
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 placeholder-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Message / Proposal *
            </label>
            <textarea
              value={bidMessage}
              onChange={(e) => setBidMessage(e.target.value)}
              placeholder="Describe your approach, experience, and why you're the best fit for this job..."
              rows={4}
              required
              className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Materials (Optional)
            </label>
            <textarea
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="e.g., Premium fixtures and pipes included..."
              rows={2}
              className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Warranty Period in Months (Optional)
            </label>
            <input
              type="text"
              value={warranty}
              onChange={(e) => {
                // Allow only numbers and decimal point
                const value = e.target.value;
                if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
                  setWarranty(value);
                }
              }}
              placeholder="e.g., 12"
              className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              inputMode="decimal"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter warranty period in months (numbers only)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Warranty Description (Optional)
            </label>
            <textarea
              value={warrantyDescription}
              onChange={(e) => setWarrantyDescription(e.target.value)}
              placeholder="e.g., 18 months warranty on all work, including labor and materials..."
              rows={2}
              className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Custom warranty description. If left empty, will auto-generate
              from period.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowBidForm(false)}
            disabled={submittingBid}
            className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (bidFormRef.current) {
                const isValid = bidFormRef.current.checkValidity();
                if (isValid) {
                  const form = bidFormRef.current;
                  const formEvent = new Event("submit", {
                    bubbles: true,
                    cancelable: true,
                  });
                  const syntheticEvent: React.FormEvent<HTMLFormElement> = {
                    ...formEvent,
                    preventDefault: () => formEvent.preventDefault(),
                    stopPropagation: () => formEvent.stopPropagation(),
                    currentTarget: form,
                    target: form,
                    nativeEvent: formEvent,
                    isDefaultPrevented: () => formEvent.defaultPrevented,
                    isPropagationStopped: () => !formEvent.bubbles,
                    persist: () => {},
                    timeStamp: formEvent.timeStamp,
                    type: formEvent.type,
                    bubbles: formEvent.bubbles,
                    cancelable: formEvent.cancelable,
                  } as React.FormEvent<HTMLFormElement>;
                  handleSubmitBid(syntheticEvent);
                } else {
                  bidFormRef.current.reportValidity();
                }
              }
            }}
            disabled={submittingBid}
            className="flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 bg-accent-500 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-accent-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-500"
          >
            {submittingBid ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              "Submit Bid"
            )}
          </button>
        </div>
      </BaseModal>

      {/* Full-Size Image Lightbox */}
      {fullSizeImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setFullSizeImage(null)}
        >
          <button
            onClick={() => setFullSizeImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <img
            src={fullSizeImage}
            alt="Property full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Image Viewer Modal */}
      {fullSizeImage && (
        <ImageViewerModal
          isOpen={!!fullSizeImage}
          onClose={() => setFullSizeImage(null)}
          imageUrl={fullSizeImage}
        />
      )}
    </>
  );
};

export default ContractorJobDetailsModal;
