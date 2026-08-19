import { api } from "../../../../lib/axios";

/** ---------------------------
 *  Types
 * --------------------------- */
export type OrganizationSettings = {
  timezone: string;
  accrual_mode: string;
  weekend_days: string[];
  leave_accrual_enabled: boolean;
  exclude_weekends_in_leaves: boolean;
  carry_forward_default_expiry_months: number;
  [key: string]: any;
};

export type WorkingTimeSettings = {
  ORG_WORKING_START_TIME: string;
  ORG_WORKING_END_TIME: string;
  ORG_DAILY_HOURS: number;
  ORG_OVERTIME_LIMIT: number;
  ENABLE_OVERTIME: boolean;
  working_days: string[];
  PAYROLL_WORKING_DAYS_IN_MONTH?: number; 
 SHOW_CLOCK_OUT?: boolean;
};

export type Organization = {
  id: string;
  name: string;
  country_code: string;
  currency?: string; 
  email?: string;
  pro_email?: string;
  hr_email?:string;
  accountant_email?:string;
  tax_identifier?:string;
  phone?: string;
  website?: string;
  address?: string;
  bank_account?: string;
  settings: OrganizationSettings;
  working_time_settings: WorkingTimeSettings;
  email_settings?: Record<string, any>;
  compensation_settings?: Record<string, any>;           // ✅ compensation JSON
  compliance_monitor_settings?: Record<string, boolean>; // ✅ new compliance JSON
  created_at?: string;
  updated_at?: string;
};

export type UpdateOrganizationInput = {
  name?: string;
  address?: string;
  email?: string;
  pro_email?: string;
  hr_email?:string;
  accountant_email?:string;
  tax_identifier?:string;
  phone?: string;
  website?: string; 
  country_code?: string;
  currency?: string; 
  bank_account?: string;
  settings?: OrganizationSettings;
  working_time_settings?: WorkingTimeSettings;
  email_settings?: Record<string, any>;        
  compensation_settings?: Record<string, any>; 
  compliance_monitor_settings?: Record<string, boolean>; // ✅ include compliance monitor config
};

/** ---------------------------
 *  API Base + Endpoints
 * --------------------------- */
const base = (orgId: string) => `/organization/${orgId}`;

export const organizationApi = {
  /**
   * Fetch organization details by ID
   */
  get: async (orgId: string): Promise<Organization> => {
    const { data } = await api.get(base(orgId));
    return data as Organization;
  },

  /**
   * Update organization configuration (name, settings, working time, email, compensation, compliance)
   */
  updateSettings: async (orgId: string, input: UpdateOrganizationInput) => {
    const { data } = await api.patch(base(orgId), input);
    return data as Organization;
  },

  /**
   * ✅ Fetch employee table columns ending with `_expiry`
   * Used by Compliance Alert Monitor to display selectable fields.
   */
  getEmployeeExpiryFields: async (): Promise<string[]> => {
    const { data } = await api.get("/hr-management/employee-fields");
    // Backend should return an array of strings like:
    // ["passport_expiry", "visa_expiry", "emirates_id_expiry"]
    return (data || []).filter((f: string) => f.endsWith("_expiry"));
  },
  uploadPhoto: async (
  orgId: string,
  file: File,
  opts?: { onProgress?: (percent: number) => void }
) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(
    `/organization/${orgId}/photo`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (!opts?.onProgress || !evt.total) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        opts.onProgress(pct);
      },
    }
  );

  return data;
},

getPhotoDownloadUrl: async (orgId: string) => {
  const { data } = await api.get(`/organization/${orgId}/photo/download`);
  return data;
},
uploadSeal: async (
  orgId: string,
  file: File,
  opts?: { onProgress?: (percent: number) => void }
) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(
    `/organization/${orgId}/seal`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (!opts?.onProgress || !evt.total) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        opts.onProgress(pct);
      },
    }
  );

  return data;
},

getSealDownloadUrl: async (orgId: string) => {
  const { data } = await api.get(
    `/organization/${orgId}/seal/download`
  );
  return data;
},
};
