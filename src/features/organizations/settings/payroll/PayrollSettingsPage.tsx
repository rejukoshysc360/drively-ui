import React, { useState, useEffect } from "react";
import { usePayrollSettings, useUpsertPayrollSettings } from "./hooks";
import { useAuth } from "../../../auth/AuthProvider";
import { useCan } from "../../../../utils/permissions";

// Core UI
import GeneralPayrollSection from "./GeneralPayrollSection";
import ContributionsSection from "./ContributionsSection";
import EndOfServiceGratuitySection from "./EndOfServiceGratuitySection";
import PayslipDeductionSection from "./PayslipDeductionSection";
import PayslipProrateSection from "./PayslipProrateSection";
import ComplianceSection from "./ComplianceSection";
import TerminationSection from "./TerminationSection";

// Modular dialogs
import WpsComplianceDialog from "./WpsComplianceDialog";
import WpsSifDialog from "./WpsSifDialog";
import EosInfoDialog from "./EosInfoDialog";
import IndiaGratuityInfoDialog from "./EosInfoDialog-IN";
import ContributionsDialog from "./ContributionsDialog";
import TerminationDialog from "./TerminationDialog";

const dayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayKey = typeof dayKeys[number];
type OtMultipliers = Partial<Record<DayKey | "public_holiday", number>>;

const PayrollSettingsPage: React.FC = () => {
  const { data, isLoading } = usePayrollSettings();
  const upsertMutation = useUpsertPayrollSettings();

  const { organization_country_code: country, organization_currency: currency } = useAuth();

  const can = useCan();
  const canView = can("org-payroll-settings:view");
  const canUpdate = can("org-payroll-settings:update");

  if (!canView)
    return (
      <p className="text-gray-500 text-sm">
        You don’t have permission to view payroll settings.
      </p>
    );

  // Dialog states
  const [showWpsDialog, setShowWpsDialog] = useState(false);
  const [showSifDialog, setShowSifDialog] = useState(false);
  const [showEosDialog, setShowEosDialog] = useState(false);
  const [showContribDialog, setShowContribDialog] = useState(false);
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);

  // Payroll form state
  const [payFrequency, setPayFrequency] = useState("monthly");
  const [wpsEnabled, setWpsEnabled] = useState(false);
  const [wpsFileExport, setWpsFileExport] = useState(false);
  const [payslipMode, setPayslipMode] = useState<
    "FIXED" | "FIXED_PLUS_OT" | "FULLY_TIMESHEET"
  >("FIXED");
  const [otBaseTypeId, setOtBaseTypeId] = useState<string>("");
  const [otMultipliers, setOtMultipliers] = useState<OtMultipliers>({});

  useEffect(() => {
    if (!data) return;
    setWpsEnabled(Boolean(data.wps_enabled));
    setWpsFileExport(Boolean(data.wps_file_export));
    setPayFrequency(data.pay_frequency || "monthly");
    setPayslipMode((data.payslip_mode as any) || "FIXED");
    if (data?.ot_base_type_id) setOtBaseTypeId(data.ot_base_type_id);

    const fromDb: OtMultipliers = (data.ot_multipliers as OtMultipliers) || {};
    setOtMultipliers(fromDb);
  }, [data]);

  if (isLoading) return <p className="text-gray-600">Loading payroll settings…</p>;
  const settings = data || {};

  const handleMultiplierChange = (key: DayKey | "public_holiday", raw: string) => {
    if (raw === "" || raw === undefined || raw === null) {
      setOtMultipliers((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    const num = Number(raw);
    setOtMultipliers((prev) => ({ ...prev, [key]: isFinite(num) ? num : undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;

    const fd = new FormData(e.currentTarget as HTMLFormElement);

    const payDay = payFrequency === "weekly"
    ? fd.get("default_pay_day")
    : Number(fd.get("default_pay_day"));

    const input: any = {
      pay_frequency: payFrequency,
     default_pay_day:
      payFrequency === "weekly"
        ? String(fd.get("default_pay_day") ?? "Monday")
        : (() => {
            const value = Number(fd.get("default_pay_day"));
            return value >= 1 && value <= 31 ? value : 28;
          })(),
      grace_period_days: Number(fd.get("grace_period_days") || 0),
      payroll_working_days_in_month: Number(fd.get("payroll_working_days_in_month") || 30),
      wps_enabled: wpsEnabled,
      wps_file_export: wpsFileExport,
      payslip_mode: fd.get("payslip_mode") as "FIXED" | "FIXED_PLUS_OT" | "FULLY_TIMESHEET",
      ot_base_type_id: otBaseTypeId || null,

      pension_employer_percent: Number(fd.get("pension_employer_percent") || 0),
      pension_employee_percent: Number(fd.get("pension_employee_percent") || 0),
      health_insurance_enabled: fd.get("health_insurance_enabled") === "on",

      split_period_calculation_enabled: fd.get("split_period_calculation_enabled") === "on",

      gratuity_tier1_start_years: Number(fd.get("gratuity_tier1_start_years") || 1),
      gratuity_tier1_days_per_year: Number(fd.get("gratuity_tier1_days_per_year") || 21),
      gratuity_tier2_start_years: Number(fd.get("gratuity_tier2_start_years") || 5),
      gratuity_tier2_days_per_year: Number(fd.get("gratuity_tier2_days_per_year") || 30),

      gratuity_cap_years: Number(fd.get("gratuity_cap_years") || 2),
      gratuity_cap_amount: Number(fd.get("gratuity_cap_amount") || 2000000),
      apply_resignation_scale: fd.get("apply_resignation_scale") === "on",

      payslip_deduction_mode: fd.get("payslip_deduction_mode") === "on",
      payslip_deduction_mode_for_extra_leave:
        (fd.get("payslip_deduction_mode_for_extra_leave") as "BASIC" | "FULL_GROSS") || "FULL_GROSS",
      payslip_prorate_mode_for_partial_month:
        (fd.get("payslip_prorate_mode_for_partial_month") as "BASIC" | "FULL_GROSS") || "FULL_GROSS",
      basic_increase_mid_month_mode:
        (fd.get("basic_increase_mid_month_mode") as "LATEST_ONLY" | "PRORATED") || "LATEST_ONLY",

      record_retention_years: Number(fd.get("record_retention_years") || 2),
      archive_old_payslips: fd.get("archive_old_payslips") === "on",
      payslip_language: (fd.get("payslip_language") as string) || "EN",
      include_accrued_leave_payout: fd.get("include_accrued_leave_payout") === "on",
      include_gratuity_final_salary: fd.get("include_gratuity_final_salary") === "on",
      allow_encashment_in_probation: fd.get("allow_encashment_in_probation") === "on",
      notice_period_days: Number(fd.get("notice_period_days") || 30),
      probation_notice_days: Number(fd.get("probation_notice_days") || 14),
    };

    if (input.payslip_mode === "FIXED_PLUS_OT") {
      const filtered: OtMultipliers = {};
      (["public_holiday", ...dayKeys] as const).forEach((k) => {
        const v = otMultipliers[k];
        if (typeof v === "number" && isFinite(v)) filtered[k] = v;
      });
      if (Object.keys(filtered).length > 0) input.ot_multipliers = filtered;
    }

    await upsertMutation.mutateAsync(input);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-8">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Payroll Settings
        </h1>
        {!canUpdate && (
          <span className="text-sm text-gray-500 flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-8h.01M5.22 5.22l13.56 13.56" />
            </svg>
            View-only Access
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <GeneralPayrollSection
          settings={settings}
          payFrequency={payFrequency}
          setPayFrequency={setPayFrequency}
          payslipMode={payslipMode}
          setPayslipMode={setPayslipMode}
          otBaseTypeId={otBaseTypeId}
          setOtBaseTypeId={setOtBaseTypeId}
          otMultipliers={otMultipliers}
          handleMultiplierChange={handleMultiplierChange}
          country={country}
          currency={currency}
        />

        <PayslipProrateSection settings={settings} country={country} currency={currency} />

        <EndOfServiceGratuitySection
          settings={settings}
          onInfoClick={() => setShowEosDialog(true)}
          country={country}
          currency={currency}
        />

        <PayslipDeductionSection settings={settings} country={country} currency={currency} />

        <ComplianceSection
          settings={settings}
          wpsEnabled={wpsEnabled}
          setWpsEnabled={setWpsEnabled}
          wpsFileExport={wpsFileExport}
          setWpsFileExport={setWpsFileExport}
          onWpsInfo={() => setShowWpsDialog(true)}
          onSifInfo={() => setShowSifDialog(true)}
          country={country}
          currency={currency}
        />

        <TerminationSection
          settings={settings}
          onInfoClick={() => setShowTerminationDialog(true)}
          country={country}
          currency={currency}
        />

        {/* Save Button - Always visible & touch-friendly */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-end">
            {canUpdate && (
              <button
                type="submit"
                disabled={upsertMutation.isPending}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white text-base font-medium rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {upsertMutation.isPending ? "Saving Changes…" : "Save Settings"}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Dialogs */}
      <WpsComplianceDialog open={showWpsDialog} onClose={() => setShowWpsDialog(false)} country={country} />
      <WpsSifDialog open={showSifDialog} onClose={() => setShowSifDialog(false)} country={country} />
      {country === "IN" ? (
        <IndiaGratuityInfoDialog open={showEosDialog} onClose={() => setShowEosDialog(false)} />
      ) : (
        <EosInfoDialog open={showEosDialog} onClose={() => setShowEosDialog(false)} />
      )}
      <TerminationDialog open={showTerminationDialog} onClose={() => setShowTerminationDialog(false)} country={country} />
    </div>
  );
};

export default PayrollSettingsPage;