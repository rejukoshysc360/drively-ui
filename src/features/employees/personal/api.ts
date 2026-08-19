import { api } from "../../../lib/axios";

export type EmployeePersonal = {
  id: string;
  employee_id: string;
  dob?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  phone?: string;
  personal_email?: string;
  current_address?: string;
  permanent_address?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateEmployeePersonalInput = Omit<
  EmployeePersonal,
  "id" | "created_at" | "updated_at"
>;
export type UpdateEmployeePersonalInput = Partial<
  Omit<EmployeePersonal, "id" | "employee_id" | "created_at" | "updated_at">
>;

const base = (orgId: string, employeeId: string) =>
  `/organization/${orgId}/hr-management/employees/${employeeId}/personal`;

export const employeePersonalApi = {
  get: async (orgId: string, employeeId: string) => {
    const { data } = await api.get(base(orgId, employeeId));
    return data as EmployeePersonal;
  },
  create: async (
    orgId: string,
    employeeId: string,
    input: CreateEmployeePersonalInput
  ) => {
    const { data } = await api.post(base(orgId, employeeId), input);
    return data as EmployeePersonal;
  },
  update: async (
    orgId: string,
    employeeId: string,
    input: UpdateEmployeePersonalInput
  ) => {
    const { data } = await api.patch(base(orgId, employeeId), input);
    return data as EmployeePersonal;
  },
  remove: async (orgId: string, employeeId: string) => {
    const { data } = await api.delete(base(orgId, employeeId));
    return data as { message: string };
  },
};
