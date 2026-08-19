import { useEffect } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
  danger?: boolean; // ✅ style for destructive actions (delete, unassign)
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  isLoading = false,
  danger = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // ✅ compute dynamic label based on current state
const dynamicLabel = isLoading ? `${confirmLabel}...` : confirmLabel;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={`w-5 h-5 mt-1 ${
              danger ? "text-red-500" : "text-amber-500"
            }`}
          />
          <div className="flex-1">
            <h3 className="text-base font-semibold">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className={`btn-primary inline-flex items-center gap-2 ${
              danger
                ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
                : ""
            } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {dynamicLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
