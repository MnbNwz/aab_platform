import React, { useEffect, useRef } from "react";
import Loader from "./Loader";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  darkOverlay?: boolean;
  default?: boolean; // When true, shows only OK button. When false, shows two buttons.
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  darkOverlay = false,
  default: isDefault = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter") {
        onConfirm();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel();
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center transition-colors p-2 xs:p-4 ${
        darkOverlay ? "bg-primary-900/60" : "bg-primary-900/40"
      }`}
      style={{ zIndex: 20000 }}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-2 xs:mx-4 p-4 xs:p-6 relative flex flex-col items-center border border-primary-200"
        style={{ boxShadow: "0 6px 32px 0 rgba(0,0,0,0.10)" }}
        role="dialog"
        aria-modal="true"
        aria-busy={loading}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg xs:text-xl font-semibold text-accent-600 mb-2 xs:mb-3 text-center tracking-tight">
          {title}
        </h2>
        <div className="text-primary-600 mb-5 xs:mb-7 text-center text-sm xs:text-base leading-relaxed w-full">
          {message}
        </div>
        <div className="flex flex-col xs:flex-row w-full gap-2 xs:gap-3">
          {!isDefault && (
            <button
              className="flex-1 py-2 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium transition-colors text-sm xs:text-base"
              onClick={onCancel}
              disabled={loading}
              tabIndex={0}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`${
              isDefault ? "w-full" : "flex-1"
            } py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-white font-semibold shadow-sm transition-colors flex items-center justify-center text-sm xs:text-base`}
            onClick={onConfirm}
            disabled={loading}
            tabIndex={0}
          >
            {loading ? (
              <>
                <Loader size="small" color="white" />
                <span className="ml-2">Processing…</span>
              </>
            ) : isDefault ? (
              "OK"
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
