import React, { useState, useEffect } from "react";
import ImageViewerModal from "./ImageViewerModal";
import { useGeocoding } from "../../hooks/useGeocoding";

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
  const [imageLoading, setImageLoading] = useState<boolean[]>([]);
  const [imageError, setImageError] = useState<boolean[]>([]);

  // Get readable address from coordinates
  const { address: locationAddress, loading: addressLoading } = useGeocoding(
    property?.location?.coordinates
  );

  // Initialize loading states when images change
  useEffect(() => {
    if (property?.images) {
      setImageLoading(new Array(property.images.length).fill(true));
      setImageError(new Array(property.images.length).fill(false));
    }
  }, [property?.images]);

  // Reset carousel index when property changes
  useEffect(() => {
    setCarouselIdx(0);
  }, [property?.title]);

  // Add timeout for slow loading images
  useEffect(() => {
    const images = property?.images || [];
    if (images.length > 0 && imageLoading[carouselIdx]) {
      const timeout = setTimeout(() => {
        if (imageLoading[carouselIdx]) {
          handleImageErrorForTimeout(carouselIdx);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [carouselIdx, property?.images, imageLoading]);

  // Conditional return AFTER all hooks are called
  if (!isOpen || !property) return null;

  const images = property.images || [];
  const showPrev = images.length > 1 && carouselIdx > 0;
  const showNext = images.length > 1 && carouselIdx < images.length - 1;

  const handleImageLoad = (index: number) => {
    setImageLoading((prev) => {
      const newLoading = [...prev];
      newLoading[index] = false;
      return newLoading;
    });
  };

  const handleImageError = (index: number) => {
    setImageLoading((prev) => {
      const newLoading = [...prev];
      newLoading[index] = false;
      return newLoading;
    });
    setImageError((prev) => {
      const newError = [...prev];
      newError[index] = true;
      return newError;
    });
  };

  const handleImageErrorForTimeout = (index: number) => {
    setImageLoading((prev) => {
      const newLoading = [...prev];
      newLoading[index] = false;
      return newLoading;
    });
    setImageError((prev) => {
      const newError = [...prev];
      newError[index] = true;
      return newError;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl mx-auto relative flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-primary-200">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-900 truncate">
            {property.title}
          </h2>
          <button
            className="text-primary-400 hover:text-primary-600 text-2xl sm:text-3xl font-bold p-2"
            onClick={onClose}
          >
            &#10005;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Description */}
            <div>
              <span className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                Description:
              </span>
              <span className="block text-primary-600 whitespace-pre-line text-sm sm:text-base">
                {property.description}
              </span>
            </div>

            {/* Status and Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-primary-700 font-medium text-sm sm:text-base">
                  Status:
                </span>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    property.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {property.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <span className="block text-primary-700 font-medium text-sm sm:text-base">
                  Location:
                </span>
                <span className="block text-primary-600 text-sm sm:text-base">
                  {addressLoading ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading address...</span>
                    </span>
                  ) : (
                    locationAddress ||
                    `${property.location?.coordinates[1]?.toFixed(
                      4
                    )}, ${property.location?.coordinates[0]?.toFixed(4)}`
                  )}
                </span>
              </div>
            </div>

            {/* Area */}
            {property.area !== undefined && property.areaUnit && (
              <div>
                <span className="block text-primary-700 font-medium text-sm sm:text-base">
                  Area:
                </span>
                <span className="block text-primary-600 text-sm sm:text-base">
                  {property.area} {property.areaUnit}
                </span>
              </div>
            )}

            {/* Property Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="block text-primary-700 font-medium text-sm">
                  Type:
                </span>
                <span className="block text-primary-600 text-sm capitalize">
                  {property.propertyType}
                </span>
              </div>
              <div>
                <span className="block text-primary-700 font-medium text-sm">
                  Bedrooms:
                </span>
                <span className="block text-primary-600 text-sm">
                  {property.bedrooms}
                </span>
              </div>
              <div>
                <span className="block text-primary-700 font-medium text-sm">
                  Bathrooms:
                </span>
                <span className="block text-primary-600 text-sm">
                  {property.bathrooms}
                </span>
              </div>
              <div>
                <span className="block text-primary-700 font-medium text-sm">
                  Kitchens:
                </span>
                <span className="block text-primary-600 text-sm">
                  {property.kitchens}
                </span>
              </div>
            </div>
            {/* Images */}
            {images.length > 0 && (
              <div className="mt-6">
                <span className="block text-primary-700 font-medium mb-3 text-sm sm:text-base">
                  Images:
                </span>
                <div className="relative px-12">
                  {showPrev && (
                    <button
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-95 rounded-full p-3 shadow-lg hover:bg-primary-50 transition-colors border border-primary-200"
                      onClick={() =>
                        setCarouselIdx((idx) => Math.max(idx - 1, 0))
                      }
                    >
                      <span className="text-primary-600 text-lg font-bold">
                        &#8592;
                      </span>
                    </button>
                  )}

                  <div className="flex justify-center">
                    <div
                      className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl group cursor-pointer"
                      onClick={() => {
                        if (!imageError[carouselIdx]) {
                          setViewerImg(images[carouselIdx]);
                          setViewerOpen(true);
                        }
                      }}
                    >
                      {imageLoading[carouselIdx] && (
                        <div className="w-full h-48 sm:h-64 lg:h-80 flex items-center justify-center bg-gray-100 rounded-lg border border-primary-200">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                        </div>
                      )}
                      {imageError[carouselIdx] ? (
                        <div className="w-full h-48 sm:h-64 lg:h-80 flex items-center justify-center bg-gray-100 rounded-lg border border-primary-200">
                          <div className="text-center text-gray-500">
                            <div className="text-4xl mb-2">📷</div>
                            <div className="text-sm">Failed to load image</div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={images[carouselIdx]}
                          alt={`Property image ${carouselIdx + 1}`}
                          className={`w-full h-48 sm:h-64 lg:h-80 object-cover rounded-lg border border-primary-200 shadow-lg group-hover:opacity-90 transition-opacity ${
                            imageLoading[carouselIdx] ? "hidden" : ""
                          }`}
                          loading="lazy"
                          onLoad={() => handleImageLoad(carouselIdx)}
                          onError={() => handleImageError(carouselIdx)}
                        />
                      )}
                      {!imageLoading[carouselIdx] &&
                        !imageError[carouselIdx] && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-lg">
                            <span className="text-white text-sm sm:text-base font-semibold">
                              Click to view full screen
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  {showNext && (
                    <button
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-95 rounded-full p-3 shadow-lg hover:bg-primary-50 transition-colors border border-primary-200"
                      onClick={() =>
                        setCarouselIdx((idx) =>
                          Math.min(idx + 1, images.length - 1)
                        )
                      }
                    >
                      <span className="text-primary-600 text-lg font-bold">
                        &#8594;
                      </span>
                    </button>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <span className="text-primary-500 text-xs sm:text-sm">
                    Image {carouselIdx + 1} of {images.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <ImageViewerModal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          imageUrl={viewerImg}
        />
      </div>
    </div>
  );
};

export default PropertyViewModal;
