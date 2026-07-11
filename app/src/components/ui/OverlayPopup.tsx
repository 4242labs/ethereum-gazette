import { X } from "lucide-react";

interface OverlayPopupProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function OverlayPopup({ title, children, isOpen, onClose }: OverlayPopupProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />

      {/* Card */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-soft-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Title */}
        <h3 className="text-title text-lg text-gray-900 dark:text-gray-100 mb-3 pr-8">
          {title}
        </h3>

        {/* Body */}
        <div className="text-body text-sm text-gray-600 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
}
