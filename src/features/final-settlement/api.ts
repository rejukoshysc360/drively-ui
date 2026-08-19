import { api } from "../../lib/axios";

/** ---------------------------
 *  Types
 * --------------------------- */

export type FinalSettlement = {
  id: string;
  organization_id: string;
  employee_id: string;
  reason?: string; 
  notes?: string;
  last_working_date: string;
  gratuity_amount: number;
  leave_encashment: number;
  notice_pay: number;
  other_allowances: number;
  deductions: number;
  total_payable: number;
  status: "draft" | "approved" | "paid" | "rejected";
  created_by?: string;
  approved_by?: string;
  paid_by?: string;
  created_at?: string;
  updated_at?: string;
  employee?: {
    full_name: string;
    email: string;
  };
  [key: string]: any;
};

export type CreateFinalSettlementInput = {
  employee_id: string;
  reason: string;
  notes?: string;
};

export type UpdateSettlementStatusInput = {
  id: string;
  status: "approved" | "paid" | "rejected";
};

/** ---------------------------
 *  API Base + Endpoints
 * --------------------------- */

const base = (orgId: string) =>
  `/organization/${orgId}/hr-management/final-settlement`;

export const finalSettlementApi = {
  /**
   * 🧾 Fetch paginated & searchable final settlements
   */
  list: async (
    orgId: string,
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<{ settlements: FinalSettlement[]; paginationMetaInfo: any }> => {
    const queryParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      search: params?.search ?? "",
    };

    const { data } = await api.get(base(orgId), { params: queryParams });
    return data;
  },

  /**
   * ➕ Create new final settlement
   */
  create: async (orgId: string, input: CreateFinalSettlementInput) => {
    const { data } = await api.post(base(orgId), input);
    return data as FinalSettlement;
  },

  /**
   * 🚫 Cancel Final Settlement
   */
  cancel: async (orgId: string, id: string) => {
    const { data } = await api.patch(`${base(orgId)}/${id}/cancel`);
    return data as FinalSettlement;
  },

  /**
   * 🔄 Update settlement status
   */
  updateStatus: async (orgId: string, input: UpdateSettlementStatusInput) => {
    const { data } = await api.patch(`${base(orgId)}/${input.id}/status`, {
      status: input.status,
    });
    return data as FinalSettlement;
  },

  /**
   * ✏️ Update settlement numeric fields
   */
  updateValues: async (
    orgId: string,
    input: { id: string; updates: Record<string, any> }
  ) => {
    const { data } = await api.put(
      `${base(orgId)}/${input.id}/update-values`,
      input.updates
    );
    return data as FinalSettlement;
  },
    /**
     * 📥 Download Final Settlement PDF (S3)
     */
    download: async (
      orgId: string,
      params: { settlement_id?: string; audit_id?: string }
    ): Promise<{ url: string | null }> => {
      const { data } = await api.get(
        `${base(orgId)}/download`,
        {
          params, // 👈 settlement_id OR audit_id
        }
      );

      return data;
    },
};
