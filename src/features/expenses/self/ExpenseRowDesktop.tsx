import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import AttachmentSection from "./AttachmentSection";
import { StatusBadge } from "../../../lib/my-ui-lib/src/components/Tasks/TaskBadges";

interface Props {
  expense: any;
  canCreate: boolean;
  canDelete: boolean;
  uploadProgress: Record<string, number>;
  filePickers: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  dragCounter: React.MutableRefObject<Record<string, number>>;
  uploadAttachmentMutation: any;
  previewAttachmentMutation: any;
  setPreviewSrc: (src: string | null) => void;
  setPreviewName: (name: string) => void;
  setDeleteAttachmentTarget: (target: any) => void;
  updateExpenseMutation: any;
  setDeleteExpenseTarget: (target: any) => void;
}

export default function ExpenseRowDesktop({
  expense,
  canCreate,
  canDelete,
  uploadProgress,
  filePickers,
  dragCounter,
  uploadAttachmentMutation,
  previewAttachmentMutation,
  setPreviewSrc,
  setPreviewName,
  setDeleteAttachmentTarget,
  updateExpenseMutation,
  setDeleteExpenseTarget,
}: Props) {
  const locked = ["submitted", "approved", "rejected"].includes(expense.status);
  const [showReason, setShowReason] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Position popup slightly to the left of the button
  useEffect(() => {
    if (showReason && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 260; // approximate popup width
      const leftOffset = rect.left + window.scrollX - popupWidth + rect.width; // shift left
      setPopupPos({
        top: rect.bottom + window.scrollY + 6,
        left: Math.max(leftOffset, 8), // ensure not offscreen
      });
    }
  }, [showReason]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#reason-popup")) setShowReason(false);
    };
    if (showReason) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReason]);

  return (
    <div
      className={`hidden md:grid grid-cols-[140px_110px_1fr_180px_100px_80px] gap-4 px-6 py-4 items-start ${
        locked ? "opacity-75" : ""
      }`}
    >
      <input
        defaultValue={expense.invoice_no || ""}
        disabled={locked}
        className="input"
        onBlur={(e) =>
          updateExpenseMutation.mutate({
            id: expense.id,
            invoice_no: e.target.value,
          })
        }
      />
    <input
      type="text"
      inputMode="decimal"
      defaultValue={expense.amount ?? ""}
      disabled={locked}
      className="input appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      onInput={(e) => {
        const target = e.target as HTMLInputElement;
        // Allow only numbers and a single decimal point
        target.value = target.value.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1");
      }}
      onBlur={(e) => {
        const value = e.target.value.trim();
        const numericValue = value === "" ? 0 : parseFloat(value);
        updateExpenseMutation.mutate({
          id: expense.id,
          amount: numericValue,
        });
      }}
    />

      <textarea
        defaultValue={expense.description || ""}
        disabled={locked}
        className="input min-h-[60px] resize-none"
        onBlur={(e) =>
          updateExpenseMutation.mutate({
            id: expense.id,
            description: e.target.value,
          })
        }
      />

      <AttachmentSection
        expense={expense}
        locked={locked}
        isDesktop
        canCreate={canCreate}
        canDelete={canDelete}
        uploadProgress={uploadProgress}
        filePickers={filePickers}
        dragCounter={dragCounter}
        uploadAttachmentMutation={uploadAttachmentMutation}
        previewAttachmentMutation={previewAttachmentMutation}
        setPreviewSrc={setPreviewSrc}
        setPreviewName={setPreviewName}
        setDeleteAttachmentTarget={setDeleteAttachmentTarget}
      />

      {/* Status + View Reason */}
<div className="flex flex-col items-center text-center relative">
  <StatusBadge status={expense.status} />
  {expense.status === "rejected" && expense.rejection_reason && (
    <>
<button
  ref={buttonRef}
  onClick={() => setShowReason((p) => !p)}
  className="mt-2 text-xs font-medium text-indigo-600 relative after:absolute after:left-0 after:-bottom-0.5 
             after:w-full after:h-[1px] after:bg-indigo-400 after:scale-x-0 hover:after:scale-x-100 
             after:transition-transform after:origin-left transition-colors duration-200"
>
  View Reason
</button>


      {showReason &&
        createPortal(
          <div
            id="reason-popup"
            className="absolute z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg w-64 p-3"
            style={{
              position: "absolute",
              top: popupPos.top,
              left: popupPos.left,
            }}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-xs font-semibold text-gray-800">
                Rejection Reason
              </h4>
              <button
                onClick={() => setShowReason(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
              {expense.rejection_reason}
            </p>
          </div>,
          document.body
        )}
    </>
  )}
</div>

      {/* Delete */}
      <div className="flex justify-center">
        {canDelete && (expense.status === "draft" || expense.status === "submitted") ? (
          <button
            onClick={() => setDeleteExpenseTarget(expense)}
            className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-5" />
        )}
      </div>
    </div>
  );
}
