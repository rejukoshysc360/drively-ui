// src/pages/employee/expenses/EmployeeSelfExpenses.tsx
import { useMemo, useRef, useState } from "react";

import HeaderSection from "./HeaderSection";
import ExpenseList from "./ExpenseList";
import SummarySection from "./SummarySection";
import ConfirmDialogs from "./ConfirmDialogs";
import AttachmentPreviewDialog from "./AttachmentPreviewDialog";

import { useAuth } from "../../auth/AuthProvider";
import { useCan } from "../../../utils/permissions";
import {
  useEmployeeExpenses,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
  useUploadAttachment,
  useDeleteAttachment,
  useAttachmentPreview,
  useSubmitAllExpenses,
} from "./hooks";
import { formatMoney } from "../../../utils/moneyutils";
 
export default function EmployeeSelfExpenses() {
  const { organization_id ,organization_currency} = useAuth();
  const can = useCan();

  const canView = can("expenses:view") || can("expenses:view_own_record_only");
  const canCreate = can("expenses:create") || can("expenses:create_own_record_only");
  const canDelete = can("expenses:delete") || can("expenses:delete_own_record_only");

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white text-center p-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M4.293 6.707a1 1 0 011.414 0L12 13l6.293-6.293a1 1 0 111.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Access Restricted</h2>
        <p className="text-gray-500 text-sm">You don’t have permission to view expense records.</p>
      </div>
    );
  }

  const [activeDate, setActiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<any>(null);
  const [deleteAttachmentTarget, setDeleteAttachmentTarget] = useState<any>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [submitting, setSubmitting] = useState(false);

  

  const { data: allExpenses = [], isLoading } = useEmployeeExpenses(organization_id!);
  const addExpenseMutation = useAddExpense(organization_id!);
  const updateExpenseMutation = useUpdateExpense(organization_id!);
  const deleteExpenseMutation = useDeleteExpense(organization_id!);
  const uploadAttachmentMutation = useUploadAttachment(organization_id!, setUploadProgress);

  const deleteAttachmentMutation = useDeleteAttachment(organization_id!);
  const previewAttachmentMutation = useAttachmentPreview(organization_id!);
  const submitAllMutation = useSubmitAllExpenses(organization_id!);

  const filePickers = useRef<Record<string, HTMLInputElement | null>>({});
  const dragCounter = useRef<Record<string, number>>({});

  const todaysExpenses = useMemo(() => {
    return allExpenses
      .filter((e: any) => e.expense_date === activeDate)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allExpenses, activeDate]);

  const draftCount = todaysExpenses.filter((e: any) => e.status === "draft").length;
  const runningTotal = todaysExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
  const isUpdating = updateExpenseMutation.isPending;
  const sharedProps = {
    todaysExpenses,
    isLoading,
    activeDate,
    setActiveDate,
    canCreate,
    canDelete,
    uploadProgress,
    setUploadProgress,
    filePickers,
    dragCounter,
    updateExpenseMutation,
    previewAttachmentMutation,
    setPreviewSrc,
    setPreviewName,
    setDeleteExpenseTarget,
    setDeleteAttachmentTarget,
    uploadAttachmentMutation,
    addExpenseLoading: addExpenseMutation.isPending,
    handleAddExpense: () => addExpenseMutation.mutate({ expense_date: activeDate }),
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-full">
        <HeaderSection {...sharedProps} />

        <ExpenseList {...sharedProps} />

<SummarySection
  runningTotal={formatMoney(runningTotal, organization_currency)}
  draftCount={draftCount}
  onSubmit={() => {
    setSubmitting(true);
    submitAllMutation.mutate(
      { expense_date: activeDate },
      {
        onSuccess: () => {},
        onSettled: () => setSubmitting(false),
      }
    );
  }}
  isSubmitting={submitting || submitAllMutation.isLoading}
  canCreate={canCreate}
  hasExpenses={todaysExpenses.length > 0}
  isUpdating={isUpdating}
  isReadyToSubmit={todaysExpenses
    .filter((e: any) => e.status === "draft")
    .every(
      (e: any) =>
        e.invoice_no?.trim() &&         
        Number(e.amount) > 0 &&         
        e.description?.trim()          
    )}
/>

      </div>

      <ConfirmDialogs
        deleteExpenseTarget={deleteExpenseTarget}
        setDeleteExpenseTarget={setDeleteExpenseTarget}
        deleteAttachmentTarget={deleteAttachmentTarget}
        setDeleteAttachmentTarget={setDeleteAttachmentTarget}
        deleteExpenseMutation={deleteExpenseMutation}
        deleteAttachmentMutation={deleteAttachmentMutation}
        canDelete={canDelete}
      />

      <AttachmentPreviewDialog
        previewSrc={previewSrc}
        previewName={previewName}
        onClose={() => {
          setPreviewSrc(null);
          setPreviewName("");
        }}
      />
    </div>
  );
}