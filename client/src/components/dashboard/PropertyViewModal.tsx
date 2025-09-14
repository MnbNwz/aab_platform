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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
      onClick={onClose}
    >
      <div
        className="bg-primary-50 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 p-12 relative flex flex-col"
        style={{ maxHeight: "95vh", minHeight: "70vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-8 right-8 text-accent-500 hover:text-accent-700 text-4xl font-bold"
          onClick={onClose}
        >
          &#10005;
        </button>
        <h2 className="text-3xl md:text-4xl font-extrabold text-accent-500 mb-4 text-center tracking-tight truncate max-w-full" title={property.title}>
          {property.title.length > 20 ? property.title.slice(0, 20) + "..." : property.title}
        </h2>
        <div className="space-y-4 md:space-y-6 overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
          {/* First line: title (above), then description */}
          <div>
            <span className="block text-primary-900 font-medium mb-1">Description:</span>
            <span className="block text-primary-700 whitespace-pre-line">{property.description}</span>
          </div>
          {/* Second line: status and location */}
          <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-2">
            <div>
              <span className="block text-primary-900 font-medium">Status:</span>
              <span className={`block font-bold ${property.isActive ? "text-green-600" : "text-red-600"}`}>{property.isActive ? "Active" : "Inactive"}</span>
            </div>
            <div>
              <span className="block text-primary-900 font-medium">Location:</span>
              <span className="block text-primary-700">{property.location?.coordinates[1]?.toFixed(6)}, {property.location?.coordinates[0]?.toFixed(6)}</span>
            </div>
          </div>
          {/* Third line: area */}
          {property.area !== undefined && property.areaUnit && (
            <div>
              <span className="block text-primary-900 font-medium">Area:</span>
              <span className="block text-primary-700">{property.area} {property.areaUnit}</span>
            </div>
          )}
          {/* Rest of the fields in a responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <span className="block text-primary-900 font-medium">Type:</span>
              <span className="block text-primary-700">{property.propertyType}</span>
            </div>
            <div>
              <span className="block text-primary-900 font-medium">Bedrooms:</span>
              <span className="block text-primary-700">{property.bedrooms}</span>
            </div>
            <div>
              <span className="block text-primary-900 font-medium">Bathrooms:</span>
              <span className="block text-primary-700">{property.bathrooms}</span>
            </div>
            <div>
              <span className="block text-primary-900 font-medium">Kitchens:</span>
              <span className="block text-primary-700">{property.kitchens}</span>
            </div>
          </div>
          {images.length > 0 && (
            <div className="mt-6">
              <span className="block text-primary-900 font-medium mb-2">
                Images:
              </span>
              <div className="relative flex items-center justify-center gap-4">
                {showPrev && (
                  <button
                    className="absolute left-0 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-accent-100"
                    onClick={() =>
                      setCarouselIdx((idx) => Math.max(idx - 1, 0))
                    }
                  >
                    &#8592;
                  </button>
                )}
                <div className="flex gap-4 w-full justify-center">
                  {images
                    .slice(carouselIdx, carouselIdx + 1)
                    .map((img, idx) => (
                      <div
                        key={carouselIdx + idx}
                        className="relative w-80 h-56 flex-shrink-0 group cursor-pointer"
                        onClick={() => {
                          setViewerImg(img);
                          setViewerOpen(true);
                        }}
                      >
                        <img
                          src={img}
                          alt={`Property image ${carouselIdx + idx + 1}`}
                          className="object-cover w-full h-full rounded border-2 border-primary-200 shadow-lg group-hover:opacity-80 transition"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-40 rounded">
                          <span className="text-white text-lg font-semibold">
                            Click to view in full screen
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                {showNext && (
                  <button
                    className="absolute right-0 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-accent-100"
                    onClick={() =>
                      setCarouselIdx((idx) =>
                        Math.min(idx + 1, images.length - 1)
                      )
                    }
                  >
                    &#8594;
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-primary-700 text-center">
                Image {carouselIdx + 1} of {images.length}
              </div>
            </div>
          )}
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
