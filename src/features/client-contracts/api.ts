import { api } from "../../lib/axios";

const base = (orgId: string) =>
  `/organization/${orgId}/contracts`;

export const contractApi = {
  //
  // ✅ LIST CONTRACTS (with pagination + filters)
  //
  list: async (
    orgId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      client_id?: string;
      project_id?: string;
      from_date?: string;
      to_date?: string;
    }
  ) => {
    // 🔥 REMOVE EMPTY VALUES (VERY IMPORTANT)
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(
        ([_, v]) => v !== undefined && v !== ""
      )
    );

    const { data } = await api.get(base(orgId), {
      params: cleanParams,
    });

    return data;
  },

  //
  // ✅ GET SINGLE CONTRACT
  //
  get: async (orgId: string, contractId: string) => {
    const { data } = await api.get(
      `${base(orgId)}/${contractId}`
    );
    return data;
  },

  //
  // ✅ CREATE CONTRACT
  //
  create: async (orgId: string, body: any) => {
    const { data } = await api.post(base(orgId), body);
    return data;
  },

  //
  // ✅ UPDATE CONTRACT
  //
  update: async (
    orgId: string,
    contractId: string,
    body: any
  ) => {
    const { data } = await api.put(
      `${base(orgId)}/${contractId}`,
      body
    );
    return data;
  },

  //
  // ❌ DELETE CONTRACT
  //
  remove: async (orgId: string, contractId: string) => {
    const { data } = await api.delete(
      `${base(orgId)}/${contractId}`
    );
    return data;
  },
};