import React, { useState, useEffect } from "react";
import { X, Check, RotateCcw, AlertCircle } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageFile: File;
  onContinue: () => void;
  onCancel: () => void;
  onRetake: () => void;
  isUploading?: boolean;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageFile,
  onContinue,
  onCancel,
  onRetake,
  isUploading = false,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Create preview URL from File object
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  if (!isOpen) return null;

  const handleContinueClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmContinue = () => {
    setShowConfirm(false);
    onContinue();
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-2 xs:p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-3 xs:p-4 border-b border-gray-200">
          <h3 className="text-base xs:text-lg font-semibold text-gray-900">
            Preview Profile Picture
          </h3>
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-4 xs:p-6 flex flex-col items-center space-y-3 xs:space-y-4">
          <div className="relative">
            <div className="w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-lg border-2 xs:border-4 border-gray-200">
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="text-center space-y-1">
            <p
              className="text-xs xs:text-sm font-medium text-gray-900 truncate max-w-xs"
              title={imageFile.name}
            >
              {imageFile.name}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
            <div className="flex items-start space-x-2">
              <div className="text-blue-600 mt-0.5">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-800">
                  Ready to upload?
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  This will replace your current profile picture. The image will
                  be automatically resized and optimized.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-3 xs:p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onRetake}
            disabled={isUploading}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-sm font-medium">Choose Different</span>
          </button>

          <div className="flex items-center space-x-2 xs:space-x-3">
            <button
              onClick={onCancel}
              disabled={isUploading}
              className="px-3 xs:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleContinueClick}
              disabled={isUploading}
              className="flex items-center space-x-2 px-4 xs:px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Upload
                  </h3>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to update your profile picture?
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium text-gray-900 truncate"
                      title={imageFile.name}
                    >
                      {imageFile.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCancelConfirm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmContinue}
                  className="flex items-center space-x-2 px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200"
                >
                  <Check className="h-4 w-4" />
                  <span>Yes, Upload</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewModal;
