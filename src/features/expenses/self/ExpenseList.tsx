// src/pages/employee/expenses/components/ExpenseList.tsx
import ExpenseCardMobile from "./ExpenseCardMobile";
import ExpenseRowDesktop from "./ExpenseRowDesktop";

interface Props {
  todaysExpenses: any[];
  isLoading: boolean;
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
  setDeleteExpenseTarget: (target: any) => void; // ← Make sure this is in Props
}

export default function ExpenseList({
  todaysExpenses,
  isLoading,
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
  setDeleteExpenseTarget, // ← Destructure it
}: Props) {
  return (
    <>
      <div className="hidden md:grid grid-cols-[140px_110px_1fr_180px_100px_80px] px-6 py-3 text-sm font-semibold text-gray-600 border-b bg-white">
        <div>Invoice No</div>
        <div>Amount</div>
        <div>Description</div>
        <div>Attachments</div>
        <div>Status</div>
        <div className="text-center">Delete</div>
      </div>

      <div className="space-y-4 mt-4">
        {isLoading ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-lg">Loading expenses...</div>
        ) : todaysExpenses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <p className="text-gray-500">No expenses yet — click <strong>Add Expense</strong> to begin.</p>
          </div>
        ) : (
          todaysExpenses.map((exp: any) => (
            <div key={exp.id} className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* MOBILE - NOW PASSING setDeleteExpenseTarget */}
              <ExpenseCardMobile
                expense={exp}
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
                updateExpenseMutation={updateExpenseMutation}
                setDeleteExpenseTarget={setDeleteExpenseTarget} // ← THIS WAS MISSING!
              />
              {/* DESKTOP - Already correct */}
              <ExpenseRowDesktop
                expense={exp}
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
                updateExpenseMutation={updateExpenseMutation}
                setDeleteExpenseTarget={setDeleteExpenseTarget}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
}