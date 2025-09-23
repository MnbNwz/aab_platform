import React, { useEffect, useRef } from "react";
import Loader from "./Loader";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
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
  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-colors ${
        darkOverlay ? "bg-black bg-opacity-60" : "bg-black bg-opacity-30"
      }`}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 relative flex flex-col items-center border border-gray-200"
        style={{ boxShadow: "0 6px 32px 0 rgba(0,0,0,0.10)" }}
        role="dialog"
        aria-modal="true"
        aria-busy={loading}
      >
        <h2 className="text-xl font-semibold text-accent-600 mb-3 text-center tracking-tight">
          {title}
        </h2>
        <p className="text-gray-600 mb-7 text-center text-base leading-relaxed">
          {message}
        </p>
        <div className="flex w-full gap-3">
          {!isDefault && (
            <button
              className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
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
            } py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-white font-semibold shadow-sm transition-colors flex items-center justify-center`}
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
