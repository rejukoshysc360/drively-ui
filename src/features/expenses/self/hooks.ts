import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "./api";
import { emitApiError } from "../../../lib/error-bus";
import { parseApiError } from "../../../utils/parseApiError";

const keys = {
  list: (orgId: string) => ["expense-reports", orgId] as const,

  // ✅ FIX — Added missing hrList query key
// hooks file — CORRECT (replace with this)
hrList: (
  orgId: string,
  filters: {
    employee_id?: string;
    status?: string;
    from_date: string;
    to_date: string;
    page?: number;
    limit?: number;
  }
) =>
  [
    "hr-expense-reports",
    orgId,
    filters.employee_id ?? "all",
    filters.status ?? "all",
    filters.from_date,
    filters.to_date,
    filters.page ?? 1,
    filters.limit ?? 15,
  ] as const,
};

export function useEmployeeExpenses(orgId: string) {
  return useQuery({
    queryKey: keys.list(orgId),
    queryFn: () => expensesApi.list(orgId),
    enabled: !!orgId,
  });
}

export function useAddExpense(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { expense_date: string }) =>
      expensesApi.add(orgId, args.expense_date),
    onSuccess: () => qc.invalidateQueries(),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateExpense(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      expensesApi.update(orgId, payload.id, payload),
    onSuccess: () => qc.invalidateQueries(),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUploadAttachment(orgId: string, setUploadProgress: any) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      expense_id,
      file,
    }: {
      expense_id: string;
      file: File;
    }) =>
      expensesApi.uploadAttachment(orgId, expense_id, file, {
        onProgress: (percent: number) => {
          // ✅ Track upload progress per expense row
          setUploadProgress((prev: any) => ({
            ...prev,
            [expense_id]: percent,
          }));
        },
      }),

    onSuccess: (_data, variables) => {
      const { expense_id } = variables;

      // ✅ Mark this row as fully uploaded (optional visual completion)
      setUploadProgress((prev: any) => ({
        ...prev,
        [expense_id]: 100,
      }));

      // ✅ Re-fetch fresh attachments only (not the whole list)
      qc.invalidateQueries({
        queryKey: ["expense-reports", orgId],
      });
    },

    onSettled: (_data, _error, variables) => {
      const { expense_id } = variables;

      // ✅ Clean up progress state so only the uploaded row hides the bar
      setUploadProgress((prev: any) => {
        const next = { ...prev };
        delete next[expense_id];
        return next;
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}



export function useDeleteAttachment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      expense_id,
      attachment_id,
    }: {
      expense_id: string;
      attachment_id: string;
    }) => expensesApi.deleteAttachment(orgId, expense_id, attachment_id),
    onSuccess: () => qc.invalidateQueries(),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useAttachmentPreview(orgId: string) {
  return useMutation({
    mutationFn: ({
      expense_id,
      attachment_id,
    }: {
      expense_id: string;
      attachment_id: string;
    }) =>
      expensesApi.previewAttachment(orgId, expense_id, attachment_id),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** Submit all drafts for a date */
export function useSubmitAllExpenses(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      expense_date,
    }: {
      expense_date: string;
    }) => expensesApi.submitAllForDate(orgId, expense_date),
    onSuccess: () => qc.invalidateQueries(),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteExpense(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(orgId, id),
    onSuccess: () => qc.invalidateQueries(),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ HR List with Filters */
// hooks/useHRExpenses.ts

export function useHRExpenses(
  orgId: string,
  filters: {
    employee_id?: string;
    status: string;
    from_date: string;
    to_date: string;
    page?: number;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: keys.hrList(orgId, filters),
    queryFn: () => expensesApi.hrList(orgId, filters),
    enabled: !!orgId && !!filters.from_date && !!filters.to_date,
    keepPreviousData: true, // Important! Smooth page transitions
    refetchOnWindowFocus: false,
  });
}
