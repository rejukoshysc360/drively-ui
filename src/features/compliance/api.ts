import { api } from "../../lib/axios";

export type ComplianceAuditResponse = {
  audits: any[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) =>
  `/organization/${orgId}/hr-management/compliance-audit`;

export const complianceAuditsApi = {
  /* -----------------------------
     LIST (supports search, status, employee filter)
  ----------------------------- */
  list: async (
    orgId: string,
    page = 1,
    limit = 20,
    search = "",
    status = "all",
    employeeId?: string // ✅ added
  ) => {
    const params: Record<string, any> = { page, limit };

    if (search.trim()) params.search = search.trim();
    if (status && status !== "all") params.status = status;
    if (employeeId) params.employee_id = employeeId; // ✅ new param for employee filter

    const { data } = await api.get(base(orgId), { params });
    return data as ComplianceAuditResponse;
  },

  /* -----------------------------
     CREATE
  ----------------------------- */
  create: async (orgId: string, employeeId: string, input: any) => {
    const { data } = await api.post(`${base(orgId)}/${employeeId}`, input);
    return data;
  },

  /* -----------------------------
     DELETE
  ----------------------------- */
  remove: async (orgId: string, id: string) => {
    const { data } = await api.delete(`${base(orgId)}/${id}`);
    return data;
  },
};
