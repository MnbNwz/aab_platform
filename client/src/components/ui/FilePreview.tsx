import React from "react";
import { FileText } from "lucide-react";

interface FilePreviewProps {
  file: File;
  className?: string;
  height?: string;
  showFileName?: boolean;
  showFileSize?: boolean;
  showFileType?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  className = "",
  height = "h-20",
  showFileName = true,
  showFileSize = true,
  showFileType = true,
}) => {
  const objectUrl = URL.createObjectURL(file);

  const getFilePreview = () => {
    const type = file.type;
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (
      type.startsWith("image/") ||
      ["jpg", "jpeg", "png"].includes(extension || "")
    ) {
      return (
        <img
          src={objectUrl}
          alt={file.name}
          className={`w-full ${height} object-cover rounded`}
        />
      );
    }
    if (type === "application/pdf" || extension === "pdf") {
      return (
        <div
          className={`w-full ${height} bg-red-50 border-2 border-red-200 rounded overflow-hidden relative`}
        >
          <iframe
            src={`${objectUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full"
            title={file.name}
            style={{
              transform: "scale(0.3)",
              transformOrigin: "top left",
              width: "333%",
              height: "333%",
              userSelect: "none",
              pointerEvents: "none",
              paddingTop: "8px",
            }}
            onError={() => {
              // Fallback for browsers without PDF support
              const iframe = document.querySelector(
                `iframe[title="${file.name}"]`
              ) as HTMLIFrameElement;
              if (iframe) {
                iframe.style.display = "none";
                const fallback = iframe.parentElement?.querySelector(
                  ".pdf-fallback"
                ) as HTMLElement;
                if (fallback) {
                  fallback.style.display = "flex";
                }
              }
            }}
          />
          {showFileType && (
            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded">
              PDF
            </div>
          )}
          {/* Fallback for browsers without PDF support */}
          <div
            className="pdf-fallback absolute inset-0 bg-red-50 flex items-center justify-center"
            style={{ display: "none" }}
          >
            <div className="text-center">
              <FileText className="h-8 w-8 text-red-500 mx-auto mb-1" />
              <span className="text-xs text-red-600 font-medium">PDF</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div
        className={`w-full ${height} bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center`}
      >
        <div className="text-center">
          <FileText className="h-8 w-8 text-gray-500 mx-auto mb-1" />
          <span className="text-xs text-gray-600 font-medium">FILE</span>
        </div>
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`relative ${className}`}>
      {getFilePreview()}

      {(showFileName || showFileSize) && (
        <div className="mt-2 text-center">
          {showFileName && (
            <p
              className="text-xs font-medium text-gray-900 truncate"
              title={file.name}
            >
              {file.name}
            </p>
          )}
          {showFileSize && (
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FilePreview;
