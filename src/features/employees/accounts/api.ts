import { api } from '../../../lib/axios';

export type EmployeeAccount = {
  id: string;
  employee_id: string;
  bank_name: string;
  account_no: string;
  ifsc_code: string;
  purpose: string;
  payment_method: 'Bank Transfer' | 'Processed via WPS'; // ✅ NEW FIELD
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CreateEmployeeAccountInput = Omit<
  EmployeeAccount,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdateEmployeeAccountInput = Partial<
  Omit<EmployeeAccount, 'employee_id' | 'created_at' | 'updated_at'>
>;

const base = (orgId: string, employeeId: string) =>
  `/organization/${orgId}/hr-management/employees/${employeeId}/accounts`;

export const employeeAccountsApi = {
  // 🔹 Fetch all accounts for employee
  list: async (orgId: string, employeeId: string): Promise<EmployeeAccount[]> => {
    const { data } = await api.get(base(orgId, employeeId));
    return data.accounts ?? data;
  },

  // 🔹 Create new account
  create: async (
    orgId: string,
    employeeId: string,
    input: CreateEmployeeAccountInput
  ) => {
    const { data } = await api.post(base(orgId, employeeId), input);
    return data as EmployeeAccount;
  },

  // 🔹 Update existing account
  update: async (
    orgId: string,
    employeeId: string,
    accountId: string,
    input: UpdateEmployeeAccountInput
  ) => {
    const { data } = await api.patch(`${base(orgId, employeeId)}/${accountId}`, input);
    return data as EmployeeAccount;
  },

  // 🔹 Delete account
  remove: async (orgId: string, employeeId: string, accountId: string) => {
    const { data } = await api.delete(`${base(orgId, employeeId)}/${accountId}`);
    return data as { message: string };
  },
};
