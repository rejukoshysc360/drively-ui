import { api } from "../../lib/axios";

/* -----------------------------
   TYPES
----------------------------- */
export type CertificateRequest = {
  id: string;
  organization_id: string;
  employee_id: string;
  status: "requested" | "released";
  requested_at: string;
  certificate_json?: {
    purpose?: string;
    note?: string;
  };
  employee?: {
    full_name: string;
  };
  type: "salary" | "joining"; // client-side label
};

/* -----------------------------
   BASE PATHS
----------------------------- */
const baseDashboard = (orgId: string) =>
  `/organization/${orgId}/hr-management/dashboard`; // dashboard-related
const baseSalary = (orgId: string) =>
  `/organization/${orgId}/hr-management/salary-certificates`;
const baseJoining = (orgId: string) =>
  `/organization/${orgId}/hr-management/joining-certificates`;

/* -----------------------------
   API FUNCTIONS
----------------------------- */
export const certificateRequestsApi = {
  /**
   * 🔹 Fetch salary & joining certificates requested in the last 7 days
   */
  listRecentRequests: async (orgId: string) => {
    const [salaryRes, joiningRes] = await Promise.all([
      api.get(`${baseDashboard(orgId)}/salary-certificates/recent-requests`),
      api.get(`${baseDashboard(orgId)}/joining-certificates/recent-requests`),
    ]);

    const salaryData = (salaryRes.data ?? []).map((r: any) => ({
      ...r,
      type: "salary" as const,
    }));

    const joiningData = (joiningRes.data ?? []).map((r: any) => ({
      ...r,
      type: "joining" as const,
    }));

    // 🧩 Merge and sort newest first
    const merged = [...salaryData, ...joiningData].sort(
      (a, b) =>
        new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    );

    return merged;
  },

  /**
   * 🔹 Paginated list of salary certificate requests
   */
  listSalaryCertificates: async (
    orgId: string,
    page = 1,
    limit = 5,
    status: string = "requested"
  ) => {
    const { data } = await api.get(baseSalary(orgId), {
      params: { page, limit, status },
    });
    return data;
  },

  /**
   * 🔹 Paginated list of joining certificate requests
   */
  listJoiningCertificates: async (
    orgId: string,
    page = 1,
    limit = 5,
    status: string = "requested"
  ) => {
    const { data } = await api.get(baseJoining(orgId), {
      params: { page, limit, status },
    });
    return data;
  },
};
