import { api } from "../../lib/axios";

export type ProjectEmployee = {
  id: string;
  project_id: string;
  employee_id: string;
  billing_rate?: number; // ✅ NEW
  employee?: {
    id: string;
    full_name: string;
    email: string;
  };
};

// ✅ UPDATED INPUT TYPE
export type AssignEmployeesInput = {
  employees: {
    employee_id: string;
    billing_rate: number;
  }[];
};

const base = (orgId: string, projectId: string) =>
  `/organization/${orgId}/projects/${projectId}/employees`;

export const projectEmployeeApi = {
  // =========================
  // 📥 Get assigned employees
  // =========================
  list: async (orgId: string, projectId: string) => {
    const { data } = await api.get(base(orgId, projectId));

    return data as {
      employees: {
        employee_id: string;
        full_name: string;
        email: string;
        billing_rate?: number; // ✅ ensure backend sends this
      }[];
    };
  },

  // =========================
  // 🔗 Assign employees (WITH RATE)
  // =========================
  assign: async (
    orgId: string,
    projectId: string,
    input: AssignEmployeesInput
  ) => {
    const { data } = await api.post(
      base(orgId, projectId),
      input
    );

    return data as { message: string };
  },

  // =========================
  // ❌ Remove employee
  // =========================
  remove: async (
    orgId: string,
    projectId: string,
    employeeId: string
  ) => {
    const { data } = await api.delete(
      `${base(orgId, projectId)}/${employeeId}`
    );

    return data as { message: string };
  },
};