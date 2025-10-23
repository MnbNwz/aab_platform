import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import {
  createInvestmentOpportunityThunk,
  updateInvestmentOpportunityThunk,
} from "../../store/slices/investmentOpportunitySlice";
import type {
  InvestmentOpportunity,
  InvestmentPropertyType,
} from "../../types";
import { X, Plus, Trash2, MapPin } from "lucide-react";
import { showToast } from "../../utils/toast";
import {
  validateInvestmentOpportunityForm,
  buildInvestmentOpportunityFormData,
  validateFile,
} from "../../utils/investmentOpportunity";
import { formatFileSize } from "../../utils/imageCompression";
import { useGeocoding, useCurrentLocation } from "../../hooks/useGeocoding";
import LocationSelector from "../LocationSelector";

interface InvestmentOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: InvestmentOpportunity | null;
  onBack?: () => void; // Optional back handler for returning to view mode
}

const InvestmentOpportunityModal: React.FC<InvestmentOpportunityModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  onBack,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    propertyType: "house" as InvestmentPropertyType,
    location: [0, 0] as [number, number], // [longitude, latitude]
    askingPrice: "",
    projectedROI: "",
    description: "",
    lotSize: "",
    buildingSize: "",
    numberOfUnits: "",
    yearBuilt: "",
    renovationNeeded: false,
    estimatedRenovationCost: "",
    estimatedCompletionTime: "",
    renovationDetails: "",
  });

  const [showMapPicker, setShowMapPicker] = useState(false);

  // Get current location automatically (like signup form)
  const { location: currentLocation, loading: currentLocationLoading } =
    useCurrentLocation();

  // Get readable address from coordinates
  const { address: locationAddress, loading: addressLoading } = useGeocoding(
    formData.location[0] !== 0 || formData.location[1] !== 0
      ? { lat: formData.location[1], lng: formData.location[0] }
      : null
  );

  // Auto-set location from IP when creating new opportunity
  useEffect(() => {
    if (!opportunity && currentLocation && isOpen) {
      // Only set if location hasn't been manually changed
      if (formData.location[0] === 0 && formData.location[1] === 0) {
        setFormData((prev) => ({
          ...prev,
          location: [currentLocation.lng, currentLocation.lat],
        }));
      }
    }
  }, [currentLocation, opportunity, isOpen, formData.location]);

  const [highlights, setHighlights] = useState<string[]>([""]);

  // File-based attachments (images, docs, pdfs)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
  const [attachmentTypes, setAttachmentTypes] = useState<string[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    Array<{ url: string; name: string; type: string }>
  >([]);
  const [existingCarouselIndex, setExistingCarouselIndex] = useState(0);
  const [newCarouselIndex, setNewCarouselIndex] = useState(0);

  useEffect(() => {
    if (opportunity) {
      // Handle both old (city/province) and new (coordinates) location format
      let locationCoords: [number, number] = [0, 0];
      if (
        opportunity.location.coordinates &&
        opportunity.location.coordinates.length === 2
      ) {
        locationCoords = [
          opportunity.location.coordinates[0],
          opportunity.location.coordinates[1],
        ];
      }

      setFormData({
        title: opportunity.title,
        propertyType: opportunity.propertyType,
        location: locationCoords,
        askingPrice: String(opportunity.askingPrice / 100),
        projectedROI: opportunity.projectedROI
          ? String(opportunity.projectedROI)
          : "",
        description: opportunity.description,
        lotSize: opportunity.lotSize || "",
        buildingSize: opportunity.buildingSize || "",
        numberOfUnits: opportunity.numberOfUnits
          ? String(opportunity.numberOfUnits)
          : "",
        yearBuilt: opportunity.yearBuilt ? String(opportunity.yearBuilt) : "",
        renovationNeeded: opportunity.renovationNeeded || false,
        estimatedRenovationCost: opportunity.estimatedRenovationCost
          ? String(opportunity.estimatedRenovationCost / 100)
          : "",
        estimatedCompletionTime: opportunity.estimatedCompletionTime
          ? String(opportunity.estimatedCompletionTime)
          : "",
        renovationDetails: opportunity.renovationDetails || "",
      });

      if (opportunity.highlights && opportunity.highlights.length > 0) {
        setHighlights(opportunity.highlights);
      }
      // Combine photos and documents into attachments
      const allAttachments: Array<{
        url: string;
        name: string;
        type: string;
      }> = [];

      if (opportunity.photos && opportunity.photos.length > 0) {
        opportunity.photos.forEach((photo) => {
          const ext = photo.url.split(".").pop()?.toLowerCase() || "jpg";
          allAttachments.push({
            url: photo.url,
            name: photo.caption || `Photo ${allAttachments.length + 1}`,
            type: ext,
          });
        });
      }

      if (opportunity.documents && opportunity.documents.length > 0) {
        allAttachments.push(...opportunity.documents);
      }

      if (allAttachments.length > 0) {
        setExistingAttachments(allAttachments);
      }
    }
  }, [opportunity]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value, type } = e.target;
      if (type === "checkbox") {
        setFormData((prev) => ({
          ...prev,
          [name]: (e.target as HTMLInputElement).checked,
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    },
    []
  );

  const handleHighlightChange = useCallback((index: number, value: string) => {
    setHighlights((prev) => {
      const newHighlights = [...prev];
      newHighlights[index] = value;
      return newHighlights;
    });
  }, []);

  const addHighlight = useCallback(() => {
    setHighlights((prev) => [...prev, ""]);
  }, []);

  const removeHighlight = useCallback((index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Attachment file handlers
  const handleAttachmentFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const totalAttachments =
        attachmentFiles.length + existingAttachments.length;

      if (totalAttachments + files.length > 10) {
        showToast.error("Maximum 10 attachments allowed");
        return;
      }

      // Validate files
      for (const file of files) {
        const validation = validateFile(file, "document");
        if (!validation.valid) {
          showToast.error(validation.error!);
          return;
        }
      }

      setAttachmentFiles((prev) => [...prev, ...files]);
      setAttachmentNames((prev) => [...prev, ...files.map((f) => f.name)]);
      setAttachmentTypes((prev) => [
        ...prev,
        ...files.map((f) => {
          const ext = f.name.split(".").pop()?.toLowerCase() || "pdf";
          return ext;
        }),
      ]);
    },
    [attachmentFiles.length, existingAttachments.length]
  );

  const handleAttachmentMetaChange = useCallback(
    (index: number, value: string) => {
      setAttachmentNames((prev) => {
        const newNames = [...prev];
        newNames[index] = value;
        return newNames;
      });
    },
    []
  );

  const removeNewAttachment = useCallback((index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentNames((prev) => prev.filter((_, i) => i !== index));
    setAttachmentTypes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeExistingAttachment = useCallback((index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Check if there are attachments (new or existing)
      const hasAttachments =
        attachmentFiles.length > 0 || existingAttachments.length > 0;

      // Validation using utility function
      const validation = validateInvestmentOpportunityForm(
        formData,
        highlights,
        hasAttachments
      );
      if (!validation.valid) {
        showToast.error(validation.error!);
        return;
      }

      setIsSubmitting(true);

      try {
        // Build FormData with files
        const formDataToSend = buildInvestmentOpportunityFormData(
          formData,
          highlights,
          attachmentFiles,
          attachmentNames,
          attachmentTypes,
          existingAttachments
        );

        if (opportunity) {
          await dispatch(
            updateInvestmentOpportunityThunk({
              id: opportunity._id,
              updateData: formDataToSend as any,
            })
          ).unwrap();
        } else {
          await dispatch(
            createInvestmentOpportunityThunk(formDataToSend)
          ).unwrap();
        }

        onClose();
      } catch (_error) {
        // Error handled by thunk
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      dispatch,
      formData,
      highlights,
      attachmentFiles,
      attachmentNames,
      attachmentTypes,
      existingAttachments,
      opportunity,
      onClose,
    ]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-primary-900">
            {opportunity
              ? "Edit Investment Opportunity"
              : "Create Investment Opportunity"}
          </h2>
          <button
            onClick={opportunity && onBack ? onBack : onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                  placeholder="e.g., Luxury Duplex Investment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                >
                  <option value="house">House</option>
                  <option value="duplex">Duplex</option>
                  <option value="triplex">Triplex</option>
                  <option value="sixplex">Sixplex</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asking Price ($) *
                </label>
                <input
                  type="number"
                  name="askingPrice"
                  value={formData.askingPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                  placeholder="450000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projected ROI (%) *
                </label>
                <input
                  type="number"
                  name="projectedROI"
                  value={formData.projectedROI}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                  placeholder="12.5"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                  placeholder="Detailed description of the investment opportunity..."
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              Location *
            </h3>
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="w-full flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-300 hover:border-accent-500 hover:bg-gray-50 transition"
            >
              <span className="text-left text-gray-700">
                {currentLocationLoading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-accent-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Detecting your location...</span>
                  </span>
                ) : addressLoading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-accent-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading address...</span>
                  </span>
                ) : locationAddress ? (
                  locationAddress
                ) : formData.location[0] !== 0 || formData.location[1] !== 0 ? (
                  `${formData.location[1].toFixed(
                    4
                  )}, ${formData.location[0].toFixed(4)}`
                ) : (
                  "Click to select location on map"
                )}
              </span>
              <MapPin className="h-5 w-5 text-accent-500" />
            </button>
            <p className="text-xs text-gray-600 mt-1">
              Select the property location on the map
            </p>
          </div>

          {/* Location Selector Modal */}
          <LocationSelector
            isOpen={showMapPicker}
            onClose={() => setShowMapPicker(false)}
            onLocationSelect={(location) => {
              setFormData({
                ...formData,
                location: [location.lng, location.lat],
              });
              setShowMapPicker(false);
            }}
          />

          {/* Property Details */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              Property Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lot Size *
                </label>
                <input
                  type="text"
                  name="lotSize"
                  value={formData.lotSize}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                  placeholder="5000 sq ft"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building Size *
                </label>
                <input
                  type="text"
                  name="buildingSize"
                  value={formData.buildingSize}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                  placeholder="3000 sq ft"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Units *
                </label>
                <input
                  type="number"
                  name="numberOfUnits"
                  value={formData.numberOfUnits}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Built *
                </label>
                <input
                  type="number"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  required
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                  placeholder="1995"
                />
              </div>
            </div>
          </div>

          {/* Renovation Details */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              Renovation Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="renovationNeeded"
                  checked={formData.renovationNeeded}
                  onChange={handleChange}
                  className="h-4 w-4 text-accent-500 focus:ring-accent-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Renovation Needed
                </label>
              </div>

              {formData.renovationNeeded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Renovation Cost ($)
                    </label>
                    <input
                      type="number"
                      name="estimatedRenovationCost"
                      value={formData.estimatedRenovationCost}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                      placeholder="50000.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Completion Time (months)
                    </label>
                    <input
                      type="number"
                      name="estimatedCompletionTime"
                      value={formData.estimatedCompletionTime}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                      placeholder="6"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Renovation Details
                    </label>
                    <textarea
                      name="renovationDetails"
                      value={formData.renovationDetails}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                      placeholder="Kitchen and bathroom updates needed..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-900">
                Highlights *
              </h3>
              <button
                type="button"
                onClick={addHighlight}
                className="text-accent-500 hover:text-accent-600 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Highlight
              </button>
            </div>
            <div className="space-y-2">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={highlight}
                    onChange={(e) =>
                      handleHighlightChange(index, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                    placeholder="e.g., Close to public transit"
                  />
                  {highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      className="text-red-500 hover:text-red-600 p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-primary-900">
                  Attachments (Max 10) *
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  At least one attachment required - Images, PDFs, Word, Excel -
                  Max 10MB each
                </p>
              </div>
              <label
                className={`text-accent-500 hover:text-accent-600 text-sm font-medium flex items-center gap-1 cursor-pointer ${
                  attachmentFiles.length + existingAttachments.length >= 10
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Upload Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleAttachmentFileSelect}
                  disabled={
                    attachmentFiles.length + existingAttachments.length >= 10
                  }
                  className="hidden"
                />
              </label>
            </div>

            {/* Existing Attachments Carousel */}
            {existingAttachments.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Existing Attachments:
                </p>
                <div className="relative w-full flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden py-4">
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 disabled:opacity-30"
                    onClick={() =>
                      setExistingCarouselIndex((prev) => Math.max(prev - 1, 0))
                    }
                    disabled={existingCarouselIndex === 0}
                  >
                    &#8592;
                  </button>
                  <div className="flex gap-4 w-full justify-center px-12">
                    {existingAttachments
                      .slice(existingCarouselIndex, existingCarouselIndex + 3)
                      .map((attachment, idx) => {
                        const actualIndex = existingCarouselIndex + idx;
                        const isImage =
                          attachment.type.startsWith("image/") ||
                          ["image", "photo"].includes(attachment.type);

                        return (
                          <div
                            key={`existing-${actualIndex}`}
                            className="relative w-32 h-32 flex-shrink-0 bg-white rounded-lg border-2 border-blue-200"
                          >
                            {isImage ? (
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="object-cover w-full h-full rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                <div className="text-3xl mb-1">📄</div>
                                <div className="text-xs text-center text-gray-700 font-medium truncate w-full px-1">
                                  {attachment.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {attachment.type.toUpperCase()}
                                </div>
                              </div>
                            )}
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-red-600 transition-colors border-2 border-white"
                              onClick={() =>
                                removeExistingAttachment(actualIndex)
                              }
                            >
                              <span className="text-lg leading-none">
                                &times;
                              </span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 disabled:opacity-30"
                    onClick={() =>
                      setExistingCarouselIndex((prev) =>
                        Math.min(prev + 1, existingAttachments.length - 3)
                      )
                    }
                    disabled={
                      existingCarouselIndex >= existingAttachments.length - 3 ||
                      existingAttachments.length <= 3
                    }
                  >
                    &#8594;
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-600 text-center">
                  Showing {existingCarouselIndex + 1} -{" "}
                  {Math.min(
                    existingCarouselIndex + 3,
                    existingAttachments.length
                  )}{" "}
                  of {existingAttachments.length}
                </div>
              </div>
            )}

            {/* New Attachments Carousel */}
            {attachmentFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  New Attachments:
                </p>
                <div className="relative w-full flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden py-4">
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 disabled:opacity-30"
                    onClick={() =>
                      setNewCarouselIndex((prev) => Math.max(prev - 1, 0))
                    }
                    disabled={newCarouselIndex === 0}
                  >
                    &#8592;
                  </button>
                  <div className="flex gap-4 w-full justify-center px-12">
                    {attachmentFiles
                      .slice(newCarouselIndex, newCarouselIndex + 3)
                      .map((file, idx) => {
                        const actualIndex = newCarouselIndex + idx;
                        const isImage = file.type.startsWith("image/");

                        return (
                          <div
                            key={`new-${actualIndex}`}
                            className="relative w-32 flex-shrink-0"
                          >
                            <div className="relative w-32 h-32 bg-white rounded-lg border-2 border-gray-300">
                              {isImage ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`New ${actualIndex + 1}`}
                                  className="object-cover w-full h-full rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                  <div className="text-3xl mb-1">📄</div>
                                  <div className="text-xs text-center text-gray-700 font-medium truncate w-full px-1">
                                    {file.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-red-600 transition-colors border-2 border-white"
                                onClick={() => removeNewAttachment(actualIndex)}
                              >
                                <span className="text-lg leading-none">
                                  &times;
                                </span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={attachmentNames[actualIndex] || ""}
                              onChange={(e) =>
                                handleAttachmentMetaChange(
                                  actualIndex,
                                  e.target.value
                                )
                              }
                              className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 placeholder-gray-400"
                              placeholder="File name/description"
                            />
                          </div>
                        );
                      })}
                  </div>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 disabled:opacity-30"
                    onClick={() =>
                      setNewCarouselIndex((prev) =>
                        Math.min(prev + 1, attachmentFiles.length - 3)
                      )
                    }
                    disabled={
                      newCarouselIndex >= attachmentFiles.length - 3 ||
                      attachmentFiles.length <= 3
                    }
                  >
                    &#8594;
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-600 text-center">
                  Showing {newCarouselIndex + 1} -{" "}
                  {Math.min(newCarouselIndex + 3, attachmentFiles.length)} of{" "}
                  {attachmentFiles.length}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={opportunity && onBack ? onBack : onClose}
            className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 sm:px-6 py-2 bg-accent-500 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-accent-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Saving..."
              : opportunity
              ? "Update Opportunity"
              : "Create Opportunity"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentOpportunityModal;
