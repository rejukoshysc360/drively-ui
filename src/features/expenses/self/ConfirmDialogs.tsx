import { useState } from "react";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { emitApiError } from "../../../lib/error-bus";
import { emitSuccess } from "../../../lib/success-bus";

interface Props {
  deleteExpenseTarget: any;
  setDeleteExpenseTarget: (target: any) => void;
  deleteAttachmentTarget: any;
  setDeleteAttachmentTarget: (target: any) => void;
  deleteExpenseMutation: any;
  deleteAttachmentMutation: any;
  canDelete: boolean;
}

export default function ConfirmDialogs({
  deleteExpenseTarget,
  setDeleteExpenseTarget,
  deleteAttachmentTarget,
  setDeleteAttachmentTarget,
  deleteExpenseMutation,
  deleteAttachmentMutation,
  canDelete,
}: Props) {
  const [localDeleting, setLocalDeleting] = useState(false);
  const [localRemoving, setLocalRemoving] = useState(false);

  return (
    <>
      {/* Delete Expense */}
      <ConfirmDialog
        open={!!deleteExpenseTarget}
        title="Delete Expense?"
        confirmLabel={localDeleting ? "Deleting..." : "Delete"}
        danger
        isLoading={localDeleting}
        onConfirm={async () => {
          if (!canDelete) return emitApiError({ message: "Permission denied." });
          try {
            setLocalDeleting(true);
            await deleteExpenseMutation.mutateAsync(deleteExpenseTarget.id);
             emitSuccess({ message: "Expense deleted successfully!", type: "success" });            
          } catch (err) {
            emitApiError(err);
          } finally {
            setLocalDeleting(false);
            setDeleteExpenseTarget(null);
          }
        }}
        onClose={() => {
          if (!localDeleting) setDeleteExpenseTarget(null);
        }}
      />

      {/* Remove Attachment */}
      <ConfirmDialog
        open={!!deleteAttachmentTarget}
        title="Remove Attachment?"
        confirmLabel={localRemoving ? "Removing..." : "Remove"}
        danger
        isLoading={localRemoving}
        onConfirm={async () => {
          if (!canDelete) return emitApiError({ message: "Permission denied." });
          try {
            setLocalRemoving(true);
            await deleteAttachmentMutation.mutateAsync({
              expense_id: deleteAttachmentTarget.expenseId,
              attachment_id: deleteAttachmentTarget.attachmentId,
            });
             emitSuccess({ message: "Attachment removed successfully!", type: "success" });  
          } catch (err) {
            emitApiError(err);
          } finally {
            setLocalRemoving(false);
            setDeleteAttachmentTarget(null);
          }
        }}
        onClose={() => {
          if (!localRemoving) setDeleteAttachmentTarget(null);
        }}
      />
    </>
  );
}
