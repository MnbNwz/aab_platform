import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import {
  fetchInvestmentOpportunityByIdThunk,
  clearSelectedOpportunity,
  updateOpportunityStatus,
  expressInterestThunk,
  withdrawInterestThunk,
} from "../../store/slices/investmentOpportunitySlice";
import { investmentOpportunityApi } from "../../services/investmentOpportunityService";
import type { ContactStatus, User } from "../../types";
import Loader from "../ui/Loader";
import ProfileViewModal from "../ProfileViewModal";
import {
  X,
  MapPin,
  DollarSign,
  TrendingUp,
  Home,
  Calendar,
  Ruler,
  Wrench,
  Users,
  Phone,
  Mail,
  Building2,
  FileText,
  Edit,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Heart,
  Send,
} from "lucide-react";
import {
  formatInvestmentPrice,
  getContactStatusBadge,
} from "../../utils/investmentOpportunity";
import { showToast } from "../../utils/toast";
import { useGeocoding } from "../../hooks/useGeocoding";

interface InvestmentOpportunityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  onEdit?: () => void;
  onStatusChange?: (newStatus: "available" | "under_offer" | "sold") => void;
  isContractor?: boolean;
}

const InvestmentOpportunityDetailsModal: React.FC<
  InvestmentOpportunityDetailsModalProps
> = ({
  isOpen,
  onClose,
  opportunityId,
  onEdit,
  onStatusChange,
  isContractor = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedOpportunity, detailsLoading } = useSelector(
    (state: RootState) => state.investmentOpportunity
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const modalRef = useRef<HTMLDivElement>(null);
  const interestModalRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"details" | "interests">(
    "details"
  );
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [photoCarouselIndex, setPhotoCarouselIndex] = useState(0);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<User | null>(
    null
  );
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Get readable address from coordinates
  const { address: locationAddress, loading: addressLoading } = useGeocoding(
    selectedOpportunity?.location?.coordinates &&
      selectedOpportunity.location.coordinates.length === 2
      ? {
          lat: selectedOpportunity.location.coordinates[1],
          lng: selectedOpportunity.location.coordinates[0],
        }
      : null
  );

  // Copy location handler
  const handleCopyLocation = useCallback(() => {
    if (locationAddress) {
      navigator.clipboard.writeText(locationAddress);
      showToast.success("Location copied to clipboard!");
    } else if (selectedOpportunity?.location?.coordinates) {
      const coords = selectedOpportunity.location.coordinates;
      const locationText = `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`;
      navigator.clipboard.writeText(locationText);
      showToast.success("Coordinates copied to clipboard!");
    }
  }, [selectedOpportunity, locationAddress]);

  // Image viewer handlers
  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setImageViewerOpen(true);
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewerOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    const photos = selectedOpportunity?.photos;
    if (photos && photos.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % photos.length);
    }
  }, [selectedOpportunity]);

  const prevImage = useCallback(() => {
    const photos = selectedOpportunity?.photos;
    if (photos && photos.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? photos.length - 1 : prev - 1
      );
    }
  }, [selectedOpportunity]);

  useEffect(() => {
    if (opportunityId) {
      dispatch(fetchInvestmentOpportunityByIdThunk(opportunityId));
    }

    return () => {
      dispatch(clearSelectedOpportunity());
    };
  }, [dispatch, opportunityId]);

  const handleUpdateInterestStatus = useCallback(
    async (contractorId: string, status: ContactStatus, notes?: string) => {
      if (!selectedOpportunity) return;

      try {
        // Directly call the API to update interest status
        await investmentOpportunityApi.updateInterestStatus(
          opportunityId,
          contractorId,
          { contactStatus: status, adminNotes: notes || "" }
        );

        // Optimistically update the Redux state
        const updatedInterests = selectedOpportunity.interests.map((interest) =>
          interest.contractorId._id === contractorId
            ? { ...interest, contactStatus: status, adminNotes: notes || "" }
            : interest
        );

        // If accepting, also update property status to "under_offer"
        const updatedOpportunity = {
          ...selectedOpportunity,
          status:
            status === "accepted"
              ? ("under_offer" as const)
              : selectedOpportunity.status,
          interests: updatedInterests,
        };

        // Dispatch action to update Redux state immediately (no API re-fetch)
        dispatch(updateOpportunityStatus(updatedOpportunity));

        showToast.success("Interest status updated successfully");
      } catch (error: any) {
        showToast.error(error.message || "Failed to update interest status");
        // On error, refresh to get correct state
        dispatch(fetchInvestmentOpportunityByIdThunk(opportunityId));
      }
    },
    [dispatch, opportunityId, selectedOpportunity]
  );

  const handleExpressInterest = useCallback(async () => {
    if (!selectedOpportunity) return;

    setSubmittingInterest(true);

    try {
      await dispatch(
        expressInterestThunk({
          id: selectedOpportunity._id,
          message: interestMessage.trim() || undefined,
        })
      ).unwrap();

      // Close interest input modal
      setShowInterestModal(false);
      setInterestMessage("");

      // Show success modal
      setShowSuccessModal(true);

      // Auto-close success modal and details modal after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        onClose(); // Close the details modal
        dispatch(clearSelectedOpportunity());
      }, 2000);
    } catch (_error) {
      // Error already handled by toast in thunk
      setShowInterestModal(false);
    } finally {
      setSubmittingInterest(false);
    }
  }, [dispatch, selectedOpportunity, interestMessage, onClose]);

  const handleWithdrawInterest = useCallback(async () => {
    if (!selectedOpportunity) return;

    setSubmittingInterest(true);

    try {
      await dispatch(withdrawInterestThunk(selectedOpportunity._id)).unwrap();

      // Refresh opportunity details
      dispatch(fetchInvestmentOpportunityByIdThunk(selectedOpportunity._id));
    } catch (_error) {
      // Error already handled by toast in thunk
    } finally {
      setSubmittingInterest(false);
    }
  }, [dispatch, selectedOpportunity]);

  const handleViewContractorProfile = useCallback((interest: any) => {
    // Convert interest data to User format for ProfileViewModal
    const contractorUser: User = {
      _id: interest.contractorId._id,
      email: interest.contractorId.email,
      firstName: interest.contractorId.firstName,
      lastName: interest.contractorId.lastName,
      phone: interest.contractorId.phone,
      profileImage: interest.contractorId.profileImage,
      role: "contractor" as const,
      status: "active" as const,
      approval: "approved" as const,
      emailVerified: true,
      contractor: interest.contractorId.contractor,
      createdAt: "",
      updatedAt: "",
    };
    setSelectedContractor(contractorUser);
    setProfileViewOpen(true);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setProfileViewOpen(false);
    setSelectedContractor(null);
  }, []);

  const renderContactStatusBadge = useCallback((status: ContactStatus) => {
    const { className, label } = getContactStatusBadge(status);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {label}
      </span>
    );
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    dispatch(clearSelectedOpportunity());
  }, [onClose, dispatch]);

  // Click outside to close (only when sub-modals are not open)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close main modal if any sub-modal is open
      if (
        imageViewerOpen ||
        showInterestModal ||
        showSuccessModal ||
        profileViewOpen
      )
        return;

      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isOpen,
    imageViewerOpen,
    showInterestModal,
    showSuccessModal,
    profileViewOpen,
    handleClose,
  ]);

  if (!isOpen) return null;

  if (detailsLoading || !selectedOpportunity) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader size="large" color="accent" />
        </div>
      </div>
    );
  }

  const opportunity = selectedOpportunity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-primary-900">
              {opportunity.title}
            </h2>
            <div className="text-sm text-gray-600 mt-1 capitalize">
              {opportunity.propertyType}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Admin Actions Bar */}
        {isAdmin && onStatusChange && opportunity.status !== "sold" && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">
                Change Status:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {opportunity.status !== "available" && (
                  <button
                    onClick={() => onStatusChange("available")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-all font-semibold shadow-sm hover:shadow"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Set Available
                  </button>
                )}
                {opportunity.status !== "under_offer" && (
                  <button
                    onClick={() => onStatusChange("under_offer")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 active:bg-yellow-700 transition-all font-semibold shadow-sm hover:shadow"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Set Under Offer
                  </button>
                )}
                <button
                  onClick={() => onStatusChange("sold")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-all font-semibold shadow-sm hover:shadow"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark as Sold
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("details")}
            className={`${
              isAdmin ? "flex-1" : "w-full"
            } px-6 py-3 font-medium transition ${
              activeTab === "details"
                ? "text-accent-500 border-b-2 border-accent-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Property Details
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("interests")}
              className={`flex-1 px-6 py-3 font-medium transition ${
                activeTab === "interests"
                  ? "text-accent-500 border-b-2 border-accent-500"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Contractor Interests ({opportunity.interests.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 min-h-[500px]">
          {activeTab === "details" ? (
            <div className="space-y-6 h-full">
              {/* Photos Carousel */}
              {opportunity.photos && opportunity.photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-3">
                    Photos ({opportunity.photos.length})
                  </h3>
                  <div className="relative">
                    {/* Carousel Navigation */}
                    {opportunity.photos.length > 1 &&
                      photoCarouselIndex > 0 && (
                        <button
                          onClick={() =>
                            setPhotoCarouselIndex((prev) =>
                              Math.max(0, prev - 1)
                            )
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-700" />
                        </button>
                      )}

                    {opportunity.photos.length > 1 &&
                      photoCarouselIndex < opportunity.photos.length - 1 && (
                        <button
                          onClick={() =>
                            setPhotoCarouselIndex((prev) =>
                              Math.min(opportunity.photos!.length - 1, prev + 1)
                            )
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-700" />
                        </button>
                      )}

                    {/* Main Image */}
                    <div
                      onClick={() => handleImageClick(photoCarouselIndex)}
                      className="relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer group max-w-xl mx-auto h-48 sm:h-64"
                    >
                      <img
                        src={opportunity.photos[photoCarouselIndex].url}
                        alt={
                          opportunity.photos[photoCarouselIndex].caption ||
                          `Photo ${photoCarouselIndex + 1}`
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to view full screen
                        </span>
                      </div>
                      {opportunity.photos[photoCarouselIndex].caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4">
                          <p className="text-sm font-medium">
                            {opportunity.photos[photoCarouselIndex].caption}
                          </p>
                        </div>
                      )}

                      {/* Photo Counter */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                        {photoCarouselIndex + 1} / {opportunity.photos.length}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Information */}
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  Key Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Asking Price</span>
                    </div>
                    <div className="text-xl font-bold text-primary-900">
                      {formatInvestmentPrice(opportunity.askingPrice)}
                    </div>
                  </div>

                  {opportunity.projectedROI && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Projected ROI</span>
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {opportunity.projectedROI}%
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Home className="h-4 w-4" />
                      <span className="text-sm">Property Type</span>
                    </div>
                    <div className="text-xl font-bold text-primary-900 capitalize">
                      {opportunity.propertyType}
                    </div>
                  </div>

                  {opportunity.numberOfUnits && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">Units</span>
                      </div>
                      <div className="text-xl font-bold text-primary-900">
                        {opportunity.numberOfUnits}
                      </div>
                    </div>
                  )}

                  {opportunity.yearBuilt && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Year Built</span>
                      </div>
                      <div className="text-xl font-bold text-primary-900">
                        {opportunity.yearBuilt}
                      </div>
                    </div>
                  )}

                  {opportunity.lotSize && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Ruler className="h-4 w-4" />
                        <span className="text-sm">Lot Size</span>
                      </div>
                      <div className="text-xl font-bold text-primary-900">
                        {opportunity.lotSize}
                      </div>
                    </div>
                  )}

                  {opportunity.buildingSize && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Ruler className="h-4 w-4" />
                        <span className="text-sm">Building Size</span>
                      </div>
                      <div className="text-xl font-bold text-primary-900">
                        {opportunity.buildingSize}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {opportunity.description}
                </p>
              </div>

              {/* Highlights */}
              {opportunity.highlights && opportunity.highlights.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-3">
                    Highlights
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {opportunity.highlights.map((highlight, index) => (
                      <li key={index} className="text-gray-700">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Renovation Details */}
              {opportunity.renovationNeeded && (
                <div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Renovation Details
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {opportunity.estimatedRenovationCost && (
                        <div>
                          <span className="text-sm text-gray-600">
                            Estimated Cost:
                          </span>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatInvestmentPrice(
                              opportunity.estimatedRenovationCost
                            )}
                          </div>
                        </div>
                      )}
                      {opportunity.estimatedCompletionTime && (
                        <div>
                          <span className="text-sm text-gray-600">
                            Estimated Timeline:
                          </span>
                          <div className="text-lg font-semibold text-gray-900">
                            {opportunity.estimatedCompletionTime} months
                          </div>
                        </div>
                      )}
                    </div>
                    {opportunity.renovationDetails && (
                      <div>
                        <span className="text-sm text-gray-600">Details:</span>
                        <p className="text-gray-700 mt-1">
                          {opportunity.renovationDetails}
                        </p>
                      </div>
                    )}
                    {opportunity.totalInvestment && (
                      <div className="pt-3 border-t border-yellow-300">
                        <span className="text-sm text-gray-600">
                          Total Investment (Price + Renovation):
                        </span>
                        <div className="text-xl font-bold text-primary-900">
                          {formatInvestmentPrice(opportunity.totalInvestment)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {opportunity.documents && opportunity.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-3">
                    Attachments
                  </h3>
                  <div className="space-y-2">
                    {opportunity.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                      >
                        <FileText className="h-5 w-5 text-accent-500" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {doc.name}
                          </div>
                          <div className="text-xs text-gray-600 uppercase">
                            {doc.type}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  Location
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <MapPin className="h-5 w-5 text-accent-500 mt-0.5" />
                      <div>
                        {addressLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-accent-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-600">
                              Loading address...
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-gray-900">
                              {locationAddress ||
                                (opportunity.location.coordinates
                                  ? `${opportunity.location.coordinates[1].toFixed(
                                      4
                                    )}, ${opportunity.location.coordinates[0].toFixed(
                                      4
                                    )}`
                                  : "Location not available")}
                            </div>
                            {opportunity.location.coordinates && (
                              <div className="text-xs text-gray-500 mt-1">
                                Coordinates:{" "}
                                {opportunity.location.coordinates[1].toFixed(6)}
                                ,{" "}
                                {opportunity.location.coordinates[0].toFixed(6)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyLocation}
                      className="text-primary-600 hover:text-primary-800 hover:bg-primary-50 transition-colors p-2 rounded-lg border border-primary-200"
                      title="Copy address to clipboard"
                      disabled={addressLoading}
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : isAdmin ? (
            <div className="space-y-4 h-full">
              {/* Check if any interest is already accepted */}
              {(() => {
                const hasAcceptedInterest = opportunity.interests.some(
                  (interest) => interest.contactStatus === "accepted"
                );

                return (
                  <>
                    {/* Sold Property Notice */}
                    {opportunity.status === "sold" &&
                      opportunity.interests.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                                Property Sold
                              </h4>
                              <p className="text-sm text-yellow-700">
                                This property has been marked as sold. Accept
                                and reject actions for contractor interests have
                                been disabled.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Accepted Offer Notice */}
                    {hasAcceptedInterest && opportunity.status !== "sold" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold text-green-800 mb-1">
                              Offer Accepted
                            </h4>
                            <p className="text-sm text-green-700">
                              An offer has been accepted for this property. The
                              property status has been updated to "Under Offer".
                              Accept and reject actions for other contractors
                              have been disabled.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {opportunity.interests.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Interests Yet
                  </h3>
                  <p className="text-gray-600">
                    No contractors have expressed interest in this opportunity
                  </p>
                </div>
              ) : (
                opportunity.interests.map((interest) => (
                  <div
                    key={interest.contractorId._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      {/* Profile Image - Clickable */}
                      <button
                        onClick={() => handleViewContractorProfile(interest)}
                        className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent-500 rounded-full"
                        title="View Profile"
                      >
                        {interest.contractorId.profileImage ? (
                          <img
                            src={interest.contractorId.profileImage}
                            alt={`${interest.contractorId.firstName} ${interest.contractorId.lastName}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-xl border-2 border-gray-300">
                            {interest.contractorId.firstName[0]}
                            {interest.contractorId.lastName[0]}
                          </div>
                        )}
                      </button>

                      {/* Contractor Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <button
                              onClick={() =>
                                handleViewContractorProfile(interest)
                              }
                              className="text-left hover:text-accent-600 transition-colors focus:outline-none focus:text-accent-600"
                              title="View Profile"
                            >
                              <h4 className="text-lg font-semibold text-primary-900">
                                {interest.contractorId.firstName}{" "}
                                {interest.contractorId.lastName}
                              </h4>
                            </button>
                            {interest.contractorId.contractor?.companyName && (
                              <p className="text-sm text-gray-600">
                                {interest.contractorId.contractor.companyName}
                              </p>
                            )}
                          </div>
                          {renderContactStatusBadge(interest.contactStatus)}
                        </div>

                        <div className="space-y-1.5 mt-2">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <a
                              href={`mailto:${interest.contractorId.email}`}
                              className="hover:text-accent-500 truncate"
                            >
                              {interest.contractorId.email}
                            </a>
                          </div>
                          {interest.contractorId.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <a
                                href={`tel:${interest.contractorId.phone}`}
                                className="hover:text-accent-500"
                              >
                                {interest.contractorId.phone}
                              </a>
                            </div>
                          )}
                          {interest.contractorId.contractor?.license && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">License:</span>{" "}
                              {interest.contractorId.contractor.license}
                            </div>
                          )}
                          {interest.contractorId.contractor?.services &&
                            interest.contractorId.contractor.services.length >
                              0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Services:</span>{" "}
                                {interest.contractorId.contractor.services.join(
                                  ", "
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {interest.message && (
                      <div className="mb-3 bg-white rounded-lg p-3 border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">
                          Message:
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {interest.message}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mb-3">
                      Expressed interest on{" "}
                      {new Date(interest.expressedAt).toLocaleDateString()}
                    </div>

                    {interest.adminNotes && (
                      <div className="mb-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <span className="text-sm font-medium text-blue-700">
                          Admin Notes:
                        </span>
                        <p className="text-sm text-gray-700 mt-1">
                          {interest.adminNotes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      {interest.contactStatus === "pending" &&
                        (() => {
                          const hasAcceptedInterest =
                            opportunity.interests.some(
                              (int) => int.contactStatus === "accepted"
                            );
                          const isDisabled =
                            opportunity.status === "sold" ||
                            hasAcceptedInterest;
                          const disabledReason =
                            opportunity.status === "sold"
                              ? "Cannot accept/reject interests for sold properties"
                              : hasAcceptedInterest
                              ? "Another offer has already been accepted"
                              : undefined;

                          return (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateInterestStatus(
                                    interest.contractorId._id,
                                    "accepted",
                                    "Contractor accepted"
                                  )
                                }
                                disabled={isDisabled}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                                title={disabledReason}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateInterestStatus(
                                    interest.contractorId._id,
                                    "rejected",
                                    "Contractor rejected"
                                  )
                                }
                                disabled={isDisabled}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                                title={disabledReason}
                              >
                                Reject
                              </button>
                            </>
                          );
                        })()}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Access Restricted
              </h3>
              <p className="text-gray-600">
                This section is only available to administrators
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 transition"
          >
            Close
          </button>

          {/* Interest Button for Contractors */}
          {isContractor && (
            <>
              {opportunity.hasExpressedInterest ? (
                <button
                  onClick={handleWithdrawInterest}
                  disabled={submittingInterest}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-red-50 text-red-600 border border-red-300 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Withdraw Interest"
                >
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-red-500" />
                  {submittingInterest ? "Processing..." : "Interested"}
                </button>
              ) : (
                <button
                  onClick={() => setShowInterestModal(true)}
                  disabled={submittingInterest}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-accent-500 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-accent-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Express Interest"
                >
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                  Express Interest
                </button>
              )}
            </>
          )}

          {isAdmin &&
            onEdit &&
            (() => {
              // Check if any interest has been accepted
              const hasAcceptedInterest = opportunity.interests.some(
                (int) => int.contactStatus === "accepted"
              );

              return (
                <button
                  onClick={onEdit}
                  disabled={hasAcceptedInterest}
                  className="flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 bg-accent-500 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-accent-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-500"
                  title={
                    hasAcceptedInterest
                      ? "Cannot edit property after accepting an offer"
                      : undefined
                  }
                >
                  <Edit className="h-4 w-4" />
                  Edit Property
                </button>
              );
            })()}
        </div>
      </div>

      {/* Full-Screen Image Viewer */}
      {imageViewerOpen &&
        opportunity.photos &&
        opportunity.photos.length > 0 && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 z-[60] flex items-center justify-center"
            onClick={closeImageViewer}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Close button */}
              <button
                onClick={closeImageViewer}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
              >
                <X className="h-8 w-8" />
              </button>

              {/* Previous button */}
              {opportunity.photos.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-3 transition z-10"
                >
                  <span className="text-2xl">‹</span>
                </button>
              )}

              {/* Image */}
              <div
                className="relative max-w-7xl max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={opportunity.photos[selectedImageIndex].url}
                  alt={
                    opportunity.photos[selectedImageIndex].caption ||
                    `Photo ${selectedImageIndex + 1}`
                  }
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
                {opportunity.photos[selectedImageIndex].caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 text-center">
                    {opportunity.photos[selectedImageIndex].caption}
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {opportunity.photos.length}
                </div>
              </div>

              {/* Next button */}
              {opportunity.photos.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-3 transition z-10"
                >
                  <span className="text-2xl">›</span>
                </button>
              )}
            </div>
          </div>
        )}

      {/* Contractor Profile View Modal */}
      {profileViewOpen && selectedContractor && (
        <ProfileViewModal
          isOpen={profileViewOpen}
          onClose={handleCloseProfile}
          user={selectedContractor}
        />
      )}

      {/* Express Interest Modal - For Contractors */}
      {showInterestModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setShowInterestModal(false);
            setInterestMessage("");
          }}
        >
          <div
            ref={interestModalRef}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Express Interest
              </h3>
              <button
                onClick={() => {
                  setShowInterestModal(false);
                  setInterestMessage("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder="Add a message to stand out from other contractors..."
                  rows={4}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none"
                  maxLength={500}
                  disabled={submittingInterest}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {interestMessage.length}/500 characters
                </p>
              </div>

              <button
                onClick={handleExpressInterest}
                disabled={submittingInterest}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Send className="h-5 w-5" />
                {submittingInterest ? "Submitting..." : "Submit Interest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - For Contractors */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center animate-fade-in">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Interest Submitted!
            </h3>
            <p className="text-gray-600 mb-1">
              Your interest has been successfully submitted.
            </p>
            <p className="text-sm text-gray-500">
              The property has been moved to your Interested Properties list.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentOpportunityDetailsModal;
