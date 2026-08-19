// components/ui/FormDialog.tsx
import { useEffect } from "react";
import { X } from "lucide-react";

type FormDialogProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string; // ✅ new prop (Tailwind class or custom width)
};

export default function FormDialog({
  open,
  title,
  children,
  onClose,
  maxWidth = "max-w-md", // default to md if not provided
}: FormDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div
        className={`relative bg-white rounded-lg shadow-lg w-full ${maxWidth} p-6`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (form content passed as children) */}
        <div>{children}</div>
      </div>
    </div>
  );
}
