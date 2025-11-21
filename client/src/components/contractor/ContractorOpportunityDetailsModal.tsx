import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import {
  fetchInvestmentOpportunityByIdThunk,
  clearSelectedOpportunity,
} from "../../store/slices/investmentOpportunitySlice";
import Loader from "../ui/Loader";
import {
  MapPin,
  DollarSign,
  TrendingUp,
  Home,
  Calendar,
  Ruler,
  Wrench,
  Building2,
  FileText,
  X,
  HeartOff,
} from "lucide-react";
import { formatInvestmentPrice } from "../../utils/investmentOpportunity";
import { useGeocoding } from "../../hooks/useGeocoding";
import { BaseModal } from "../reusable";

interface ContractorOpportunityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  hasExpressedInterest: boolean;
  onExpressInterest: (opportunityId: string, message?: string) => void;
  onWithdrawInterest: (opportunityId: string) => void;
}

const ContractorOpportunityDetailsModal: React.FC<
  ContractorOpportunityDetailsModalProps
> = ({
  isOpen,
  onClose,
  opportunityId,
  hasExpressedInterest,
  onExpressInterest,
  onWithdrawInterest,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedOpportunity, loading } = useSelector(
    (state: RootState) => state.investmentOpportunity
  );

  const [showMessageInput, setShowMessageInput] = useState(false);
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    if (opportunityId) {
      dispatch(fetchInvestmentOpportunityByIdThunk(opportunityId));
    }

    return () => {
      dispatch(clearSelectedOpportunity());
    };
  }, [dispatch, opportunityId]);

  const handleExpressInterest = useCallback(() => {
    if (showMessageInput && message.trim()) {
      onExpressInterest(opportunityId, message.trim());
      setMessage("");
      setShowMessageInput(false);
    } else if (showMessageInput) {
      onExpressInterest(opportunityId);
      setShowMessageInput(false);
    } else {
      setShowMessageInput(true);
    }
  }, [showMessageInput, message, onExpressInterest, opportunityId]);

  const handleClose = useCallback(() => {
    onClose();
    setShowMessageInput(false);
    setMessage("");
    dispatch(clearSelectedOpportunity());
  }, [onClose, dispatch]);

  if (!isOpen) return null;

  if (loading || !selectedOpportunity) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading..."
        maxWidth="sm"
        showFooter={false}
      >
        <div className="flex justify-center p-8">
          <Loader size="large" color="accent" />
        </div>
      </BaseModal>
    );
  }

  const opportunity = selectedOpportunity;

  const modalFooter = [
    {
      label: "Close",
      onClick: handleClose,
      variant: "secondary" as const,
      leftIcon: <X className="h-4 w-4" />,
    },
    ...(hasExpressedInterest
      ? [
          {
            label: "Withdraw Interest",
            onClick: () => {
              onWithdrawInterest(opportunityId);
              handleClose();
            },
            variant: "danger" as const,
            leftIcon: <HeartOff className="h-4 w-4" />,
          },
        ]
      : [
          {
            label: showMessageInput ? "Confirm Interest" : "Express Interest",
            onClick: handleExpressInterest,
            variant: "primary" as const,
            leftIcon: <TrendingUp className="h-4 w-4" />,
          },
        ]),
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={opportunity.title}
      subtitle={`${opportunity.location.city}, ${opportunity.location.province}`}
      maxWidth="4xl"
      footer={modalFooter}
      showFooter={true}
    >

      {/* Content */}
      <div className="space-y-6">
          {/* Photos */}
          {opportunity.photos && opportunity.photos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-primary-900 mb-3">
                Photos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {opportunity.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || `Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
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
              <div className="flex items-start gap-2">
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
                          {opportunity.location.coordinates[1].toFixed(6)},{" "}
                          {opportunity.location.coordinates[0].toFixed(6)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Express Interest Section */}
          {showMessageInput && !hasExpressedInterest && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-300"
                placeholder="Tell us why you're interested in this opportunity..."
              />
            </div>
          )}
      </div>
    </BaseModal>
  );
};

export default ContractorOpportunityDetailsModal;
