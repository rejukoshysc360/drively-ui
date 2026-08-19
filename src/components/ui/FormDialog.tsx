import { useEffect } from "react";
import { X } from "lucide-react";

type Action = {
  label: string;
  onClick: () => void;
  loading?: boolean;
};

type FormDialogProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  fullScreenOnMobile?: boolean;
};

export default function FormDialog({
  open,
  title,
  children,
  onClose,
  maxWidth = "max-w-2xl",
  primaryAction,
  secondaryAction,
  fullScreenOnMobile = false,
}: FormDialogProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 ${
        fullScreenOnMobile
          ? "flex items-stretch sm:items-center sm:justify-center"
          : "flex items-center justify-center overflow-y-auto"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={
          fullScreenOnMobile
            ? `
              relative
              z-10
              bg-white
              flex
              flex-col
              overflow-hidden

              w-full
              h-full

              rounded-none
              shadow-none

              sm:w-full
              sm:h-auto
              sm:max-h-[90vh]
              sm:rounded-xl
              sm:shadow-2xl
              sm:my-10
              ${maxWidth}
            `
            : `
              relative
              z-10
              bg-white
              rounded-xl
              shadow-2xl
              w-full
              ${maxWidth}
              my-10
              flex
              flex-col
              max-h-[90vh]
              overflow-hidden
            `
        }
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-6 pt-6 pb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>

          <button
            className="text-gray-500 transition hover:text-gray-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto px-6 py-4">
          <div className="relative overflow-visible z-10">
            {children}
          </div>
        </div>

        {/* Footer */}
        {(primaryAction || secondaryAction) && (
          <div className="sticky bottom-0 z-20 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                {secondaryAction.label}
              </button>
            )}

            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.loading}
                className={`rounded-md px-4 py-2 text-sm text-white transition ${
                  primaryAction.loading
                    ? "cursor-wait bg-blue-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {primaryAction.loading
                  ? "Processing..."
                  : primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}