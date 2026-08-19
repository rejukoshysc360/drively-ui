import { api } from "../../lib/axios";

export const auditApi = {
  list: async (orgId: string, filters: any) => {
    const { page, limit, table, user, search, from_date, to_date } = filters;

    const params: any = { page, limit };
    if (table) params.table = table;
    if (user) params.user = user;
    if (search) params.search = search;
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;

    const { data } = await api.get(`/organization/${orgId}/audit-logs`, {
      params,
    });

    return data;
  },

  getOne: async (orgId: string, id: string) => {
    const { data } = await api.get(`/organization/${orgId}/audit-logs/${id}`);
    return data;
  },

  /** ✅ NEW — Fetch distinct table names */
getTables: async (orgId: string) => {
  const { data } = await api.get(`/organization/${orgId}/audit-logs/tables`);

  // Backend returns array directly
  if (Array.isArray(data)) return data;

  // Backend returns { data: [] }
  if (Array.isArray(data.data)) return data.data;

  return [];
},
};
