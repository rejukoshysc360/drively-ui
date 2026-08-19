/* ------------------- API Layer ------------------- */
import { api } from "../../../../lib/axios";

export type PayrollSettings = {
  id: string;
  organization_id: string;

  // General
  pay_frequency: "monthly" | "bi-weekly" | "weekly";
  default_pay_day: number | string | null;
  grace_period_days: number;
  wps_enabled: boolean;
  wps_file_export: boolean;

  // Payslip & OT
  payslip_mode: "FIXED" | "FIXED_PLUS_OT" | "FULLY_TIMESHEET";
  ot_base_type_id: string | null;
  ot_multipliers?: {
    monday?: number;
    tuesday?: number;
    wednesday?: number;
    thursday?: number;
    friday?: number;
    saturday?: number;
    sunday?: number;
    public_holiday?: number;
  };

  // Contributions & Benefits
  pension_employer_percent: number;
  pension_employee_percent: number;
  health_insurance_enabled: boolean;

  // End of Service Gratuity
  split_period_calculation_enabled: boolean;
  gratuity_tier1_start_years: number;
  gratuity_tier1_days_per_year: number;
  gratuity_tier2_start_years: number;
  gratuity_tier2_days_per_year: number;
  gratuity_cap_years: number;

  /** 🇮🇳 Added for India — max amount cap (₹20L default) */
  gratuity_cap_amount?: number;

  /** 🇦🇪 Added for UAE — Article 137 resignation scale */
  apply_resignation_scale?: boolean;
  payroll_working_days_in_month?:string

  // Deductions
  payslip_deduction_mode: boolean;
  payslip_deduction_mode_for_extra_leave: "BASIC" | "FULL_GROSS";
  payslip_prorate_mode_for_partial_month: "BASIC" | "FULL_GROSS";
  basic_increase_mid_month_mode: "LATEST_ONLY" | "PRORATED";

  // Compliance
  payslip_template: string;
  record_retention_years: number;
  archive_old_payslips?: boolean;
  payslip_language: "EN" | "AR" | "BI";

  // Termination
  include_accrued_leave_payout: boolean;
  include_gratuity_final_salary: boolean;
  allow_encashment_in_probation:boolean;
  notice_period_days: number;
  probation_notice_days: number;

  created_at?: string;
  updated_at?: string;
};

/* ------------------- API Client ------------------- */
const base = (orgId: string) => `/organization/${orgId}/payroll-settings`;

export const payrollSettingsApi = {
  get: async (orgId: string): Promise<PayrollSettings | null> => {
    const { data } = await api.get(base(orgId));
    return data || null;
  },
  upsert: async (
    orgId: string,
    input: Partial<PayrollSettings>
  ): Promise<PayrollSettings> => {
    const { data } = await api.post(base(orgId), input);
    return data as PayrollSettings;
  },
};