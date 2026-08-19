import { api } from "../../../lib/axios";

export type SalaryRecord = {
  id: string;
  organization_id: string;
  employee_id: string;
  type_id?: string;
  amount: number;
  effective_from: string;
  effective_to?: string | null;
  remarks?: string | null;
  created_at?: string;
};

const base = (orgId: string, empId: string) =>
  `/organization/${orgId}/hr-management/employees/${empId}/salary`;

export const salaryApi = {
  /**
   * Fetch salary/compensation records (optionally filtered by type_id)
   */
  list: async (orgId: string, empId: string, typeId?: string) => {
    const { data } = await api.get(base(orgId, empId), {
      params: typeId ? { type_id: typeId } : {},
    });
    return data;
  },

  /**
   * Fetch current active compensation record
   */
  current: async (orgId: string, empId: string, typeId: string) => {
    const { data } = await api.get(`${base(orgId, empId)}/current`, {
      params: { type_id: typeId },
    });
    return data;
  },

  /**
   * Add new record
   */
  add: async (
    orgId: string,
    empId: string,
    input: Omit<
      SalaryRecord,
      "id" | "organization_id" | "employee_id" | "created_at"
    >
  ) => {
    const { data } = await api.post(base(orgId, empId), input);
    return data;
  },

  /**
   * Update record
   */
  update: async (
    orgId: string,
    empId: string,
    salaryId: string,
    input: Partial<SalaryRecord>
  ) => {
    const { data } = await api.patch(`${base(orgId, empId)}/${salaryId}`, input);
    return data;
  },

  /**
   * Delete record
   */
  remove: async (orgId: string, empId: string, salaryId: string) => {
    const { data } = await api.delete(`${base(orgId, empId)}/${salaryId}`);
    return data;
  },
};
