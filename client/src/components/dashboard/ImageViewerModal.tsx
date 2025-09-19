import React from "react";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText = "Full image",
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-white text-4xl font-bold z-10 hover:text-accent-500"
          onClick={onClose}
        >
          &#10005;
        </button>
        <img
          src={imageUrl}
          alt={altText}
          className="max-h-[80vh] max-w-full rounded-lg shadow-2xl border-4 border-white object-contain"
        />
      </div>
    </div>
  );
};

export default ImageViewerModal;
