import { api } from '../../../lib/axios';

export type EmployeeEmployment = {
  id: string;
  employee_id: string;
  job_title?: string;
  department?: string;
  managed_by?: string;
  employment_type?: string; // full-time, part-time, contract
  start_date?: string;
  end_date?: string | null;
  notice_given_date?: string | null;
  probation_status?: string; // active, completed, waived
  probation_end_date?: string | null;
  holiday_entitlement_override?: number | null;
  created_at?: string;
  updated_at?: string;
  termination_reason?: string | null;
};

export type CreateEmployeeEmploymentInput = Omit<EmployeeEmployment, 'id' | 'created_at' | 'updated_at'>;
export type UpdateEmployeeEmploymentInput = Partial<Omit<EmployeeEmployment, 'employee_id' | 'created_at' | 'updated_at'>>;

const base = (orgId: string, employeeId: string) =>
  `/organization/${orgId}/hr-management/employees/${employeeId}/employment`;

export const employeeEmploymentApi = {
  get: async (orgId: string, employeeId: string) => {
    const { data } = await api.get(base(orgId, employeeId));
    return data as EmployeeEmployment;
  },
  create: async (orgId: string, employeeId: string, input: CreateEmployeeEmploymentInput) => {
    const { data } = await api.post(base(orgId, employeeId), input);
    return data as EmployeeEmployment;
  },
  update: async (orgId: string, employeeId: string, input: UpdateEmployeeEmploymentInput) => {
    const { data } = await api.patch(base(orgId, employeeId), input);
    //return data as EmployeeEmployment;
     return data;
  },
  remove: async (orgId: string, employeeId: string) => {
    const { data } = await api.delete(base(orgId, employeeId));
    return data as { message: string };
  },
};
