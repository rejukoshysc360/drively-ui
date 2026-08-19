import { api } from "../../../lib/axios";

export type EmployeeLeave = {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_type_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_applied: number;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at?: string;
  updated_at?: string;

  cancel_reason?: string | null;        // employee’s cancellation reason
  hr_rejection_reason?: string | null;  // HR’s reason for rejecting cancellation


  // 🆕 Half-day support
  is_half_day?: boolean;
  half_day_type?: "morning" | "afternoon" | null;
};

export type CreateEmployeeLeaveInput = Omit<
  EmployeeLeave,
  "id" | "status" | "created_at" | "updated_at"
>;

// ✅ Body type for POST request (no org/employee in body)
export type CreateEmployeeLeaveBody = {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_applied: number;
  notes?: string | null;
  is_half_day?: boolean;
  half_day_type?: "morning" | "afternoon" | null;
    // NEW
  auto_approve?: boolean;
};

export type UpdateEmployeeLeaveInput = Partial<
  Omit<
    EmployeeLeave,
    "id" | "employee_id" | "organization_id" | "created_at" | "updated_at"
  >
>;

export type EmployeeLeaveAccrual = {
  id: string;
  accrual_date: string;
  accrual_days: number;
  days_availed: number;
  notes?: string;
  source?: string;
};

export type EmployeeLeaveBalance = {
  employee_id: string;
  leave_type_id: string;
  leave_type: string;
  entitled_days: number;

  accrued_balance: number;
  remaining_days: number;
  days_availed: number;

  initial_accrued_days?: number;
  carry_forward_policy?: string;
};

// ────────────────────────────────────────────────
// Base URL helper
// ────────────────────────────────────────────────
const base = (orgId: string, employeeId: string) =>
  `/organization/${orgId}/hr-management/employees/${employeeId}/leaves`;

// ────────────────────────────────────────────────
// Main API
// ────────────────────────────────────────────────
export const employeeLeaveApi = {
list: async (
  orgId: string,
  employeeId: string,
  page: number,
  limit: number,
  crossOrg?: boolean // ✅ optional flag
) => {
  const params: Record<string, any> = { page, limit };
  if (crossOrg) params.cross_org = 1; // ✅ send only if true

  // ✅ Reuse base() to construct endpoint
  const { data } = await api.get(base(orgId, employeeId), { params });

  return data as { leaves: EmployeeLeave[]; paginationMetaInfo: any };
},


  get: async (orgId: string, employeeId: string, leaveId: string) => {
    const { data } = await api.get(`${base(orgId, employeeId)}/${leaveId}`);
    return data as EmployeeLeave;
  },

  create: async (orgId: string, employeeId: string, input: CreateEmployeeLeaveBody) => {
    const { data } = await api.post(base(orgId, employeeId), input);
    return data as EmployeeLeave;
  },

  update: async (
    orgId: string,
    employeeId: string,
    leaveId: string,
    input: UpdateEmployeeLeaveInput
  ) => {
    const { data } = await api.patch(`${base(orgId, employeeId)}/${leaveId}`, input);
    return data as EmployeeLeave;
  },

  remove: async (orgId: string, employeeId: string, leaveId: string) => {
    const { data } = await api.delete(`${base(orgId, employeeId)}/${leaveId}`);
    return data as { message: string };
  },

  available: async (
    orgId: string,
    employeeId: string,
    leaveTypeId: string,
    crossOrg?: boolean // ✅ optional param
  ) => {
    const params: Record<string, any> = {};
    if (crossOrg) params.cross_org = 1; // ✅ send only when true

    const { data } = await api.get(
      `/organization/${orgId}/hr-management/employees/${employeeId}/leaves/available/${leaveTypeId}`,
      { params } // ✅ attach query param if needed
    );

    return data as EmployeeLeaveBalance;
  },

  // ✅ Upload attachment to S3 (organization_id/employee_id/Leaves/leave_id/)
  uploadAttachment: async (orgId: string, employeeId: string, leaveId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/organization/${orgId}/hr-management/employees/${employeeId}/leaves/${leaveId}/attachments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return data;
  },

  listAttachments: async (orgId: string, employeeId: string, leaveId: string) => {
    const { data } = await api.get(
      `/organization/${orgId}/hr-management/employees/${employeeId}/leaves/${leaveId}/attachments`
    );
    return data as Array<{
      id: string;
      name: string;
      s3_url: string;
      file_name: string;
      uploaded_at: string;
    }>;
  },

    getAttachmentDownloadUrl: async (
    orgId: string,
    employeeId: string,
    leaveId: string,
    attachmentId: string
  ) => {
    const { data } = await api.get(
      `/organization/${orgId}/hr-management/employees/${employeeId}/leaves/${leaveId}/attachments/${attachmentId}/download`
    );
    return data as { url: string };
  },


  onLeaveToday: async (orgId: string) => {
    const { data } = await api.get(`/organization/${orgId}/hr-management/leaves/on-leave-today`);
    return data as { count: number; employees?: Array<{ employee_id: string }> };
  },

  // ✅ NEW: Fetch all leave balances (for dashboard)
  balances: async (orgId: string, employeeId: string) => {
    const { data } = await api.get(
      `/organization/${orgId}/hr-management/employees/${employeeId}/leaves/balances`
    );
    return data as {
      balances: Array<{
        leave_type_id: string;
        leave_type: string;
        entitled_days: number;
        remaining_days: number;
        accrued_balance?: number;
      }>;
    };
  },
  // ────────────────────────────────────────────────
// HR Dashboard: Pending Leave Approvals Today
// ────────────────────────────────────────────────
pendingLeavesToday: async (
  orgId: string,
  crossOrg?: boolean,
  page: number = 1,
  limit: number = 10,
  all?: boolean
) => {
  const params: Record<string, any> = {
    page,
    limit,
  };

  if (crossOrg) {
    params.cross_org = 1;
  }

  // ✅ fetch all pending requests
  if (all) {
    params.all = 1;
  }

  const { data } = await api.get(
    `/organization/${orgId}/hr-management/leaves/pending-today`,
    { params }
  );

  return data as {
    count: number;
    page: number;
    limit: number;
    hasMore: boolean;

    leaves: Array<{
      id: string;
      employee_id: string;
      start_date: string;
      end_date: string;
      days_applied: number;
      is_half_day?: boolean;
      half_day_type?: "morning" | "afternoon" | null;
      notes?: string | null;
      created_at: string;

      employees: {
        id: string;
        full_name: string;
        email?: string;
        position?: string;
      };

      leave_policies: {
        id: string;
        leave_type: string;
      };
    }>;
  };
},

getMonthlyMatrix: async (
  orgId: string,
  month: string,
  search?: string,
  page?: number,
  limit?: number,
  crossOrg?: boolean
) => {
  const { data } = await api.get(
    `/organization/${orgId}/hr-management/leaves/matrix`,
    {
      params: {
        month,
        search,
        page,
        limit,
        ...(crossOrg ? { cross_org: 1 } : {}),
      },
    }
  );

  return data;
},
exportLeaveMatrix: async (
  orgId: string,
  month: string,
  search?: string,
  crossOrg?: boolean
) => {
  const { data } = await api.get(
    `/organization/${orgId}/leaves/matrix/export`,
    {
      params: {
        month,
        search,
        ...(crossOrg ? { cross_org: 1 } : {}),
      },
      responseType: "blob", // 🔥 IMPORTANT for file download
    }
  );

  return data as Blob;
},

};

// ────────────────────────────────────────────────
// Leave accrual audit API
// ────────────────────────────────────────────────
export const employeeLeaveAccrualApi = {
  list: async (orgId: string, employeeId: string, leaveTypeId: string, year?: number, crossOrg?: boolean) => {
    const { data } = await api.get(
      `/organization/${orgId}/hr-management/employees/${employeeId}/leave-accruals/${leaveTypeId}`,
      { params: { year: year || new Date().getFullYear(),...(crossOrg ? { cross_org: 1 } : {}), } }
    );
    return data as EmployeeLeaveAccrual[];
  },
  // ────────────────────────────────────────────────
// Leave Matrix Export (Excel)
// ────────────────────────────────────────────────

};


