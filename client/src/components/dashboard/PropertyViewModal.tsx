import React, { useState } from "react";
import ImageViewerModal from "./ImageViewerModal";

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
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImg, setViewerImg] = useState("");

  if (!isOpen || !property) return null;

  const images = property.images || [];
  const showPrev = images.length > 1 && carouselIdx > 0;
  const showNext = images.length > 1 && carouselIdx < images.length - 1;

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
                      ? "bg-accent-100 text-accent-800"
                      : "bg-primary-200 text-primary-800"
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
                  {property.location?.coordinates[1]?.toFixed(6)},{" "}
                  {property.location?.coordinates[0]?.toFixed(6)}
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
                        setViewerImg(images[carouselIdx]);
                        setViewerOpen(true);
                      }}
                    >
                      <img
                        src={images[carouselIdx]}
                        alt={`Property image ${carouselIdx + 1}`}
                        className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-lg border border-primary-200 shadow-lg group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-lg">
                        <span className="text-white text-sm sm:text-base font-semibold">
                          Click to view full screen
                        </span>
                      </div>
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
