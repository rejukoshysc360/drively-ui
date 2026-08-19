import { api } from "../../lib/axios";

/** ---------------------------
 *  Types
 * --------------------------- */

export type JoiningCertificate = {
  id: string;
  organization_id: string;
  employee_id: string;
  requested_by?: string | null;
  status?: "requested" | "released";
  requested_at?: string;
  released_at?: string;
  certificate_json: {
    employee_name?: string;
    company_name?: string;
    designation?: string;
    join_date?: string;
    date?: string;
  };
  pdf_url?: string;
  created_at?: string;
  employee?: {
    full_name: string;
    email: string;
  };
};

export type JoiningCertificateInput = {
  employee_id: string;
};

/** ---------------------------
 *  API Base + Endpoints
 * --------------------------- */

const base = (orgId: string) => `/organization/${orgId}/hr-management`;

export const joiningCertificateApi = {
  /** 🔹 List all joining certificates (HR/Admin) */
  listAll: async (
    orgId: string,
    params?: { page?: number; limit?: number; search?: string; status?: string }
  ) => {
    const queryParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      search: params?.search ?? "",
      status: params?.status ?? "",
    };

    const { data } = await api.get(`${base(orgId)}/joining-certificates`, {
      params: queryParams,
    });
    return data;
  },

  /** 🔹 List joining certificates for a specific employee */
  listByEmployee: async (
    orgId: string,
    employeeId: string,
    params?: { page?: number; limit?: number; search?: string; status?: string }
  ) => {
    const queryParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      search: params?.search ?? "",
      status: params?.status ?? "",
    };

    const { data } = await api.get(
      `${base(orgId)}/employees/${employeeId}/joining-certificates`,
      { params: queryParams }
    );
    return data;
  },

  /** 🧾 Employee requests a joining certificate (no PDF yet) */
request: async (orgId: string, employeeId: string, body?: { note?: string }) => {
  const { data } = await api.post(
    `${base(orgId)}/employees/${employeeId}/joining-certificate/request`,
    body
  );
  return data;
},


  /** 🧾 HR generates & releases a joining certificate */
  generate: async (orgId: string, employeeId: string) => {
    const { data } = await api.post(
      `${base(orgId)}/employees/${employeeId}/joining-certificate`
    );
    return data;
  },

  /** 📄 Get a pre-signed download URL for the certificate PDF */
  download: async (orgId: string, employeeId: string, certificateId?: string) => {
    const { data } = await api.get(
      `${base(orgId)}/employees/${employeeId}/joining-certificate/download`,
      { params: certificateId ? { certificate_id: certificateId } : {} }
    );
    return data;
  },

  /** ❌ Delete a joining certificate */
  remove: async (orgId: string, certificateId: string) => {
    const { data } = await api.delete(
      `${base(orgId)}/employees/joining-certificates/${certificateId}`
    );
    return data;
  },

  /** ✅ HR manually releases an existing certificate */
  release: async (orgId: string, certificateId: string) => {
    const { data } = await api.post(
      `${base(orgId)}/joining-certificates/${certificateId}/release`
    );
    return data;
  },
};
