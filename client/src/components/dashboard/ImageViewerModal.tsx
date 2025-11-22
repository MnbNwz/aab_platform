import React, { memo, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = memo(
  ({ isOpen, onClose, imageUrl, altText = "Full image" }) => {
    const [isLoading, setIsLoading] = useState(true);
    const previousImageUrlRef = useRef<string>("");

    // Reset loading state when imageUrl changes or modal opens
    if (isOpen && previousImageUrlRef.current !== imageUrl) {
      setIsLoading(true);
      previousImageUrlRef.current = imageUrl;
    }

    const handleOverlayClick = useCallback(() => {
      onClose();
    }, [onClose]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") {
          onClose();
        }
      },
      [onClose]
    );

    const handleImageContainerClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
      },
      []
    );

    const handleCloseClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClose();
      },
      [onClose]
    );

    const handleImageLoadStart = useCallback(() => {
      setIsLoading(true);
    }, []);

    const handleImageLoad = useCallback(() => {
      setIsLoading(false);
    }, []);

    const handleImageError = useCallback(() => {
      setIsLoading(false);
    }, []);

    if (!isOpen) return null;

    const modalContent = (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 999999, // Very high z-index to ensure it's always on top
        }}
        onClick={handleOverlayClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
      >
        {/* Close button - matches BaseModal design */}
        <button
          className="fixed top-4 right-4 sm:top-6 sm:right-6 text-white hover:text-accent-400 text-2xl sm:text-3xl font-bold p-2 transition-colors flex-shrink-0"
          style={{ zIndex: 1000000 }} // Even higher for the close button
          onClick={handleCloseClick}
          aria-label="Close image viewer"
          type="button"
        >
          &#10005;
        </button>
        <div
          className="relative max-w-4xl w-full flex items-center justify-center p-4 sm:p-6"
          onClick={handleImageContainerClick}
        >
          {/* Loading Spinner - same style as sign-in */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
            </div>
          )}
          <img
            key={imageUrl}
            src={imageUrl}
            alt={altText}
            className={`rounded-lg shadow-2xl border-4 border-white object-contain transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            style={{
              maxHeight: "calc(100vh - 8rem)",
              maxWidth: "calc(100vw - 8rem)",
            }}
            onLoadStart={handleImageLoadStart}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  }
);

ImageViewerModal.displayName = "ImageViewerModal";

export default ImageViewerModal;
