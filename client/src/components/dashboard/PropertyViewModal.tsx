import React, { useState, useEffect } from "react";
import ImageViewerModal from "./ImageViewerModal";
import { useGeocoding } from "../../hooks/useGeocoding";
import { BaseModal, InfoField, Badge, Text, Button } from "../reusable";

interface PropertyViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    title: string;
    propertyType: string;
    location: { type: string; coordinates: [number, number] };
    area?: number;
    areaUnit?: string;
    bedrooms: number;
    bathrooms: number;
    kitchens: number;
    description: string;
    images: string[];
    isActive: boolean;
    // Add more fields as needed
  } | null;
}

const PropertyViewModal: React.FC<PropertyViewModalProps> = ({
  isOpen,
  onClose,
  property,
}) => {
  // All hooks must be called before any conditional returns
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImg, setViewerImg] = useState("");
  const [imageError, setImageError] = useState<Set<number>>(new Set());

  // Get readable address from coordinates
  const { address: locationAddress, loading: addressLoading } = useGeocoding(
    property?.location?.coordinates
  );

  // Combined effect: Initialize state and reset carousel when property changes
  useEffect(() => {
    if (property) {
      setCarouselIdx(0);
      setImageError(new Set());
    }
  }, [property]);

  // Conditional return AFTER all hooks are called
  if (!isOpen || !property) return null;

  // Filter out empty/null/undefined images
  const images = (property.images || []).filter(
    (img) => img && img.trim() !== ""
  );
  const showPrev = images.length > 1 && carouselIdx > 0;
  const showNext = images.length > 1 && carouselIdx < images.length - 1;

  // Placeholder image for when images are not found or fail to load
  // Clean, professional placeholder with camera icon
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23f3f4f6;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23e5e7eb;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='400' height='300'/%3E%3Cg transform='translate(200,120)'%3E%3Crect fill='none' stroke='%239ca3af' stroke-width='3' x='-50' y='-35' width='100' height='80' rx='8'/%3E%3Ccircle fill='%239ca3af' cx='-30' cy='-20' r='8'/%3E%3Cpath fill='%239ca3af' d='M-45 25 L-35 15 L35 15 L45 25 L45 30 L-45 30 Z'/%3E%3C/g%3E%3Ctext x='200' y='220' font-family='-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' font-size='16' font-weight='500' fill='%236b7280' text-anchor='middle'%3ENo Image Available%3C/text%3E%3C/svg%3E";

  // Add cache-busting parameter to image URL (only when needed)
  const getImageUrl = (url: string, index: number) => {
    if (!url) return url;
    // Use index-based cache busting to force reload when carousel changes
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}_idx=${index}`;
  };

  const handleImageError = (index: number) => {
    setImageError((prev) => new Set(prev).add(index));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={property.title}
      maxWidth="6xl"
      showFooter={false}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Description */}
        <InfoField
          label="Description"
          value={property.description}
          valueClassName="block text-primary-600 whitespace-pre-line text-sm sm:text-base"
        />

        {/* Status and Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Text variant="label" size="sm" className="block mb-1">
              Status:
            </Text>
            <Badge variant={property.isActive ? "success" : "warning"}>
              {property.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <InfoField
            label="Location"
            value={
              addressLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <Text size="sm">Loading address...</Text>
                </div>
              ) : (
                locationAddress ||
                `${property.location?.coordinates[1]?.toFixed(
                  4
                )}, ${property.location?.coordinates[0]?.toFixed(4)}`
              )
            }
          />
        </div>

        {/* Area */}
        {property.area !== undefined && property.areaUnit && (
          <InfoField
            label="Area"
            value={`${property.area} ${property.areaUnit}`}
          />
        )}

        {/* Property Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoField
            label="Type"
            value={property.propertyType}
            labelClassName="block text-primary-700 font-medium text-sm mb-1"
            valueClassName="block text-primary-600 text-sm capitalize"
          />
          <InfoField
            label="Bedrooms"
            value={property.bedrooms}
            labelClassName="block text-primary-700 font-medium text-sm mb-1"
            valueClassName="block text-primary-600 text-sm"
          />
          <InfoField
            label="Bathrooms"
            value={property.bathrooms}
            labelClassName="block text-primary-700 font-medium text-sm mb-1"
            valueClassName="block text-primary-600 text-sm"
          />
          <InfoField
            label="Kitchens"
            value={property.kitchens}
            labelClassName="block text-primary-700 font-medium text-sm mb-1"
            valueClassName="block text-primary-600 text-sm"
          />
        </div>
        {/* Images */}
        {images.length > 0 ? (
          <div className="mt-6">
            <Text variant="label" size="sm" className="block mb-3">
              Images:
            </Text>
            <div className="relative px-12">
              {showPrev && (
                <Button
                  variant="icon"
                  size="md"
                  circular
                  iconOnly
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-95 shadow-lg hover:bg-primary-50"
                  onClick={() => setCarouselIdx((idx) => Math.max(idx - 1, 0))}
                  aria-label="Previous image"
                >
                  <Text size="lg" weight="bold" color="primary">
                    &#8592;
                  </Text>
                </Button>
              )}

              <div className="flex justify-center">
                <div
                  className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl group cursor-pointer"
                  onClick={() => {
                    // Open viewer if we have a valid image URL and it's not in error state
                    if (images[carouselIdx] && !imageError.has(carouselIdx)) {
                      setViewerImg(images[carouselIdx]);
                      setViewerOpen(true);
                    }
                  }}
                >
                  {imageError.has(carouselIdx) ? (
                    <div className="w-full h-48 sm:h-64 lg:h-80 flex items-center justify-center bg-gray-100 rounded-lg border border-primary-200">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📷</div>
                        <Text size="sm" color="gray">
                          Failed to load image
                        </Text>
                      </div>
                    </div>
                  ) : (
                    <img
                      key={`${images[carouselIdx]}-${carouselIdx}`}
                      src={getImageUrl(images[carouselIdx], carouselIdx)}
                      alt={`Property image ${carouselIdx + 1}`}
                      className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-lg border border-primary-200 shadow-lg group-hover:opacity-90 transition-opacity"
                      loading="eager"
                      onError={() => handleImageError(carouselIdx)}
                    />
                  )}
                  {!imageError.has(carouselIdx) && images[carouselIdx] && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-lg cursor-pointer pointer-events-none">
                      <Text size="sm" weight="semibold" className="text-white">
                        Click to view full screen
                      </Text>
                    </div>
                  )}
                </div>
              </div>

              {showNext && (
                <Button
                  variant="icon"
                  size="md"
                  circular
                  iconOnly
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-95 shadow-lg hover:bg-primary-50"
                  onClick={() =>
                    setCarouselIdx((idx) =>
                      Math.min(idx + 1, images.length - 1)
                    )
                  }
                  aria-label="Next image"
                >
                  <Text size="lg" weight="bold" color="primary">
                    &#8594;
                  </Text>
                </Button>
              )}
            </div>

            <div className="mt-3 text-center">
              <Text size="xs" color="primary" className="text-primary-500">
                Image {carouselIdx + 1} of {images.length}
              </Text>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <Text variant="label" size="sm" className="block mb-3">
              Images:
            </Text>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl">
                <div className="w-full h-48 sm:h-64 lg:h-80 flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg border-2 border-dashed border-primary-300">
                  <div className="text-center">
                    <img
                      src={placeholderImage}
                      alt="No property images available"
                      className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 opacity-60"
                    />
                    <Text
                      size="base"
                      weight="medium"
                      color="gray"
                      className="text-gray-600"
                    >
                      No images available
                    </Text>
                    <Text size="sm" color="gray" className="text-gray-500 mt-1">
                      Images will appear here when added
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        imageUrl={viewerImg}
      />
    </BaseModal>
  );
};

export default PropertyViewModal;
