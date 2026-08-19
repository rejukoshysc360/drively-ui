// src/modules/payroll/payslip/api.ts
import { api } from '../../../lib/axios';

// ----------------- TYPES -----------------

export type PayslipData = {
  header: {
    payslip_no: string;
    pay_date: string;
    pay_period: string;
  };
  employee: {
    name: string;
    designation: string;
    doj: string;
    pan?: string;
    std_days?: number;
    wrkdays?: number;
  };
  employer: {
    id: string;
    name: string;
    address: string;
  };
  earnings: { id: string; name: string; amount: number }[];
  deductions: { id: string; name: string; amount: number }[];
  total: {
    gross: number;
    deductions: number;
    net_pay: number;
    net_pay_in_words: string;
  };
};

// 🔹 Error type
export type PayslipError = {
  message: string;
};

// 🔹 Union type (either payslip data or error)
export type PayslipResponse = PayslipData | PayslipError;

// 🔹 Audit record type (used for audit trail modal)
export type PayslipAuditRecord = {
  id: string;
  version: number;
  month: string;
  generated_at: string;
  comments?: string;
  created_by_name?: string;
  final_payslip?: any;
};

export type PayslipAuditResponse = {
  versions: PayslipAuditRecord[];
  paginationMetaInfo?: {
    totalCount: number;
    totalPages?: number;
    currentPage?: number;
    limit?: number;
  };
};

// ----------------- BASE ENDPOINT -----------------

const base = (orgId: string, empId: string) =>
  `/organization/${orgId}/hr-management/employees/${empId}/payslip`;

// ----------------- API IMPLEMENTATIONS -----------------

export const payslipApi = {
  // 🔹 Get payslip preview / details
  get: async (
    orgId: string,
    empId: string,
    month: string,
    skipProRate: boolean = false,
    skipLeaveFlag: boolean = false
  ): Promise<PayslipResponse> => {
    const { data } = await api.get(base(orgId, empId), {
      params: {
        month,
        skip_pro_rate: skipProRate ? '1' : '0',
        skip_leave_flag: skipLeaveFlag ? '1' : '0',
      },
    });
    return data;
  },

  // 🔹 Generate new payslip
  generate: async (
    orgId: string,
    empId: string,
    month: string,
    skipProRate: boolean,
    skipLeaveFlag: boolean,
    comment?: string
  ): Promise<PayslipResponse> => {
    const { data } = await api.post(
      `${base(orgId, empId)}/generate`,
      null,
      {
        params: {
          month,
          skip_pro_rate: skipProRate ? '1' : '0',
          skip_leave_flag: skipLeaveFlag ? '1' : '0',
          comment: comment || '',
        },
      }
    );
    return data;
  },

  // 🔹 Get payslip audit trail (server-side pagination)
  getAudit: async (
    orgId: string,
    empId: string,
    month: string,
    page: number = 1,
    limit: number = 5
  ): Promise<PayslipAuditResponse> => {
    const { data } = await api.get(`${base(orgId, empId)}/audit`, {
      params: { month, page, limit },
    });
    return data;
  },

  // 🔹 Apply manual adjustments
  adjust: async (
    orgId: string,
    empId: string,
    month: string,
    adjustments: any[],
    comments?: string | null
  ) => {
    const { data } = await api.patch(
      `${base(orgId, empId)}/adjust`,
      { month, adjustments, comments }
    );
    return data;
  },

  // 🔹 Get Payroll Progress for dashboard
  getPayrollProgress: async (orgId: string, month: string) => {
    const { data } = await api.get(
      `/organization/${orgId}/hr-management/payslip/progress`,
      { params: { month } }
    );
    return data as {
      organization_id: string;
      month: string;
      total_active: number;
      payslips_generated: number;
      payroll_progress: number;
      payslipped_employees: {
      id: string;
      full_name: string;
      is_active: boolean;
      // add more fields later if backend expands (e.g., net_pay, payslip_id)
    }[];
    };
  },
download: async (
  orgId: string,
  empId: string,
  params: { month?: string; audit_id?: string }
): Promise<{ url: string | null }> => {
  const { data } = await api.get(
    `/organization/${orgId}/hr-management/employees/${empId}/payslip/download`,
    { params } // 👈 month OR audit_id
  );
  return data;
},

};
