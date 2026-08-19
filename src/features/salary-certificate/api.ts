import { api } from "../../lib/axios";

/** ---------------------------
 *  Types
 * --------------------------- */

export type SalaryCertificate = {
  id: string;
  organization_id: string;
  employee_id: string;
  requested_by?: string | null;
  status?: "requested" | "released";
  requested_at?: string;
  released_at?: string;
  certificate_json: {
    purpose: string;
    employee_name?: string;
    company_name?: string;
    gross_salary?: number;
    currency?: string;
    date?: string;
  };
  pdf_url?: string;
  created_at?: string;
  employee?: {
    full_name: string;
    email: string;
  };
};

export type SalaryCertificateInput = {
  employee_id: string;
  purpose?: string;
};

/** ---------------------------
 *  API Base + Endpoints
 * --------------------------- */

const base = (orgId: string) => `/organization/${orgId}/hr-management`;

export const salaryCertificateApi = {
  /** 🔹 List all certificates (HR/Admin) */
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

  const { data } = await api.get(`${base(orgId)}/salary-certificates`, {
    params: queryParams,
  });
  return data;
},

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
    `${base(orgId)}/employees/${employeeId}/salary-certificates`,
    { params: queryParams }
  );
  return data;
},


  /** 🧾 Employee requests a salary certificate (no PDF generated yet) */
  request: async (orgId: string, employeeId: string, body: { purpose?: string }) => {
    const { data } = await api.post(
      `${base(orgId)}/employees/${employeeId}/salary-certificate/request`,
      body
    );
    return data;
  },

  /** 🧾 HR generates & releases a certificate */
  generate: async (
    orgId: string,
    employeeId: string,
    body: { purpose?: string }
  ) => {
    const { data } = await api.post(
      `${base(orgId)}/employees/${employeeId}/salary-certificate`,
      body
    );
    return data;
  },

  /** 📄 Get a pre-signed download URL */
  download: async (orgId: string, employeeId: string, certificateId?: string) => {
    const { data } = await api.get(
      `${base(orgId)}/employees/${employeeId}/salary-certificate/download`,
      { params: certificateId ? { certificate_id: certificateId } : {} }
    );
    return data;
  },

  /** ❌ Delete a certificate */
  remove: async (orgId: string, certificateId: string) => {
    const { data } = await api.delete(`${base(orgId)}/employees/salary-certificates/${certificateId}`);
    return data;
  },
  release: async (orgId: string, certificateId: string) => {
  const { data } = await api.post(
    `${base(orgId)}/salary-certificates/${certificateId}/release`
  );
  return data;
 },
};
