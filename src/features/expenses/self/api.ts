// features/employees/expenses/api.ts
import { api } from "../../../lib/axios";

export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected";

export type Attachment = {
  id: string;
  expense_id: string;
  file_s3_key: string;
  file_url: string;
  file_type: string;
  filename?: string; // optional UI label
  created_at?: string;
};

export type Expense = {
  id: string;
  organization_id: string;
  employee_id: string;
  expense_date: string; // YYYY-MM-DD
  invoice_no?: string;
  description?: string;
  amount: number;
  status: ExpenseStatus;
  attachments?: Attachment[];
  created_at?: string;
  updated_at?: string;
};

// Employee self endpoints
const baseSelf = (orgId: string) =>
  `/organization/${orgId}/hr-management/employee/expenses`;

// HR endpoints (new)
const baseHR = (orgId: string) =>
  `/organization/${orgId}/hr-management/expenses`;

export const expensesApi = {
  /** Employee: List own expenses */
  list: async (orgId: string): Promise<Expense[]> => {
    const { data } = await api.get(baseSelf(orgId));
    return Array.isArray(data) ? data : [];
  },

  /** ✅ HR: Filterable list */
hrList: async (
    orgId: string,
    params: {
      employee_id?: string;
      status: string;
      from_date: string;
      to_date: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const { data } = await api.get(baseHR(orgId), { params });
    return data; // Now returns { expenses: [], paginationMetaInfo: { ... } }
  },
  /** Add blank expense row */
  add: async (orgId: string, expense_date: string): Promise<Expense> => {
    const { data } = await api.post(baseSelf(orgId), { expense_date });
    return data as Expense;
  },

  /** Update invoice_no / description / amount / status */
  update: async (
    orgId: string,
    expenseId: string,
    updateFields: Partial<
      Pick<Expense, "amount" | "invoice_no" | "description" | "status">
    >
  ) => {
    const { data } = await api.patch(
      `${baseSelf(orgId)}/${expenseId}`,
      updateFields
    );
    return data as Expense;
  },

  /** Upload an attachment */
  uploadAttachment: async (
    orgId: string,
    expenseId: string,
    file: File,
    options?: { onProgress?: (percent: number) => void }
  ) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `${baseSelf(orgId)}/${expenseId}/attachments`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
        if (options?.onProgress) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
          );
          console.log("Upload progress:", percent); // 👀 DEBUG
          options.onProgress(percent);
        }
      },
      }
    );
    return data as Attachment;
  },

  /** Delete a single attachment */
  deleteAttachment: async (
    orgId: string,
    expenseId: string,
    attachmentId: string
  ) => {
    const { data } = await api.delete(
      `${baseSelf(orgId)}/${expenseId}/attachments/${attachmentId}`
    );
    return data as { message: string };
  },

  /** Delete entire expense */
  remove: async (orgId: string, expenseId: string) => {
    const { data } = await api.delete(`${baseSelf(orgId)}/${expenseId}`);
    return data as { message: string };
  },

  /** Get presigned preview URL */
  previewAttachment: async (
    orgId: string,
    expenseId: string,
    attachmentId: string
  ) => {
    const { data } = await api.get(
      `${baseSelf(orgId)}/${expenseId}/attachments/${attachmentId}/preview`
    );
    return data as { url: string };
  },

  /** Employee: Submit all draft expenses */
  submitAllForDate: async (orgId: string, expense_date: string) => {
    const { data } = await api.post(`${baseSelf(orgId)}/submit`, {
      expense_date,
    });
    return data as { updated: number };
  },
};
