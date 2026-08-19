import { Trash2 } from "lucide-react";
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

export default function ExpenseCardMobile({
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

  return (
    <div className="md:hidden p-5 space-y-5 bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Invoice No & Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600">Invoice No</label>
          <input
            defaultValue={expense.invoice_no || ""}
            disabled={locked}
            className="input mt-1"
            onBlur={(e) =>
              updateExpenseMutation.mutate({
                id: expense.id,
                invoice_no: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Amount</label>
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

        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-gray-600">Description</label>
        <textarea
          defaultValue={expense.description || ""}
          disabled={locked}
          className="input mt-1 min-h-[100px]"
          onBlur={(e) =>
            updateExpenseMutation.mutate({
              id: expense.id,
              description: e.target.value,
            })
          }
        />
      </div>

      {/* Attachments */}
      <AttachmentSection
        expense={expense}
        locked={locked}
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

      {/* Status + Delete */}
      <div className="flex justify-between items-start pt-4 border-t">
        <div className="flex flex-col items-start w-full">
          <label className="text-xs font-medium text-gray-600 mb-1">Status</label>
          <StatusBadge status={expense.status} />

          {/* Show rejection reason inline under the badge */}
          {expense.status === "rejected" && expense.rejection_reason && (
            <p className="text-xs text-red-600 mt-2 whitespace-pre-wrap break-words w-full">
              <span className="font-semibold">Reason:</span> {expense.rejection_reason}
            </p>
          )}
        </div>

        {canDelete && (expense.status === "draft" || expense.status === "submitted") && (
          <button
            onClick={() => setDeleteExpenseTarget(expense)}
            className="p-3 text-red-600 hover:bg-red-50 rounded-lg self-start"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
