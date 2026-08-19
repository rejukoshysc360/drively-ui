import { api } from "../../lib/axios";

const base = (orgId: string) => `/organization/${orgId}/invoices`;

export const invoiceApi = {
  // =========================
  // ✅ LIST
  // =========================
  list: async (orgId: string, params?: any) => {
  const cleanParams = {
    ...params,

    // ✅ Only send if exists
    client_id: params?.client_id || undefined,
    project_id: params?.project_id || undefined,
    contract_id: params?.contract_id || undefined,

    search: params?.search || undefined,
    from_date: params?.from_date || undefined,
    to_date: params?.to_date || undefined,

    // ✅ 🔥 ADD THIS LINE
    pay_status: params?.pay_status || undefined,
  };

  const { data } = await api.get(base(orgId), {
    params: cleanParams,
  });

  return data;
},

  // =========================
  // ✅ GET ONE
  // =========================
  get: async (orgId: string, invoiceId: string) => {
    const { data } = await api.get(
      `${base(orgId)}/${invoiceId}`
    );
    return data;
  },

  // =========================
  // ✅ CREATE
  // =========================
  create: async (orgId: string, body: any) => {
    const payload = {
      ...body,

      // ✅ Normalize empty → null
      project_id: body?.project_id || null,
      contract_id: body?.contract_id || null,
    };

    const { data } = await api.post(base(orgId), payload);
    return data;
  },

  // =========================
  // ✅ UPDATE
  // =========================
  update: async (
    orgId: string,
    invoiceId: string,
    body: any
  ) => {
    const payload = {
      ...body,

      // ✅ Normalize empty → null
      project_id: body?.project_id || null,
      contract_id: body?.contract_id || null,
    };

    const { data } = await api.put(
      `${base(orgId)}/${invoiceId}`,
      payload
    );
    return data;
  },

  // =========================
  // ✅ DELETE
  // =========================
  remove: async (orgId: string, invoiceId: string) => {
    const { data } = await api.delete(
      `${base(orgId)}/${invoiceId}`
    );
    return data;
  },

  // =========================
  // ✅ DOWNLOAD PDF
  // =========================
  download: async (orgId: string, invoiceId: string) => {
    const { data } = await api.get(
      `${base(orgId)}/${invoiceId}/download`
    );
    return data; // { url }
  },

  // =========================
  // ✅ GET PRESIGNED URL
  // =========================
  getPresignedUrl: async (orgId: string, key: string) => {
    const { data } = await api.get(
      `${base(orgId)}/files/presigned-url`,
      {
        params: { key },
      }
    );
    return data; // { url }
  },

  // =========================
  // ✅ LAST NOTES
  // =========================
  getLastNotes: async (orgId: string, projectId: string) => {
    const { data } = await api.get(
      `${base(orgId)}/last-notes`,
      {
        params: {
          project_id: projectId || undefined, // ✅ FIX
        },
      }
    );
    return data; // { notes, invoice_date }
  },

  // =========================
  // ✅ UPDATE STATUS
  // =========================
  updateStatus: async (
    orgId: string,
    invoiceId: string,
    pay_status: string
  ) => {
    const { data } = await api.patch(
      `${base(orgId)}/${invoiceId}/status`,
      { pay_status }
    );
    return data;
  },
  getContractUsage: async (orgId: string, contractId: string) => {
    const { data } = await api.get(
      `/organization/${orgId}/contracts/${contractId}/usage`
    );
    return data; // { used }
  },
};