import React from "react";
import SectionCard from "./SectionCard";

const weekdayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface Props {
  settings: any;
  payFrequency: string;
  setPayFrequency: (val: string) => void;
  payslipMode: string;
  setPayslipMode: (val: string) => void;
  otBaseTypeId: string;
  setOtBaseTypeId: (val: string) => void;
  otMultipliers: Record<string, number | undefined>;
  handleMultiplierChange: (key: string, val: string) => void;
  country?: string | null;
  currency?: string | null;
}

const dayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const GeneralPayrollSection: React.FC<Props> = ({
  settings,
  payFrequency,
  setPayFrequency,
  payslipMode,
  setPayslipMode,
  otBaseTypeId,
  setOtBaseTypeId,
  otMultipliers,
  handleMultiplierChange,
  country,
  currency,
}) => (
  <SectionCard title="General Payroll Cycle">
    {/* Country & Currency Banner - Responsive */}
    {country && (
      <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <strong>Country:</strong>{" "}
            <span className="uppercase font-medium">{country}</span>
          </div>
          {currency && (
            <div>
              <strong>Currency:</strong>{" "}
              <span className="font-medium">{currency}</span>
            </div>
          )}
        </div>
      </div>
    )}

    <div className="space-y-6">
      {/* Pay Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pay Frequency
        </label>
        <select
          name="pay_frequency"
          value={payFrequency}
          onChange={(e) => setPayFrequency(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
        >
          <option value="monthly">Monthly</option>
          <option value="bi-weekly">Bi-Weekly</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      {/* Grid: Default Pay Day, Grace Period, Working Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Default Pay Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Pay Day
          </label>
          {payFrequency === "weekly" ? (
            <select
              name="default_pay_day"
              defaultValue={settings.default_pay_day || "Monday"}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
            >
              {weekdayLabels.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          ) : (
           <input
            type="number"
            name="default_pay_day"
            defaultValue={settings.default_pay_day ?? 28}
            min={1}
            max={31}
            placeholder="e.g., 28"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
          />
          )}
        </div>

        {/* Grace Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grace Period Days
          </label>
          <input
            type="number"
            name="grace_period_days"
            defaultValue={settings.grace_period_days || ""}
            min={0}
            placeholder="0"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
          />
        </div>

        {/* Payroll Working Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payroll Working Days in Month
          </label>
          <input
            type="number"
            name="payroll_working_days_in_month"
            defaultValue={settings.payroll_working_days_in_month || 30}
            min={1}
            max={31}
            step="1"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
          />
          <p className="text-xs text-gray-500 mt-2">
            Used for gratuity and payslip wage calculations (default 30).
          </p>
        </div>
      </div>

      {/* Payslip Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payslip Generation Mode
        </label>
        <select
          name="payslip_mode"
          value={payslipMode}
          onChange={(e) => setPayslipMode(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
        >
          <option value="FIXED">
            Fixed Compensation (Ignore Attendance)
          </option>
          <option value="FIXED_PLUS_OT">
            Fixed + Overtime (Timesheet Linked)
          </option>
        </select>

        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          <strong>Fixed:</strong> Salary structure only. <br />
          <strong>Fixed + OT:</strong> Adds overtime from timesheets (if enabled). OT is based on Basic Salary.
        </p>
      </div>

      {/* Overtime Settings - Only when Fixed + OT */}
      {payslipMode === "FIXED_PLUS_OT" && (
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Overtime Multipliers (Per Day / Holiday)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {dayKeys.map((k) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 capitalize mb-1">
                  {k}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1.0"
                  value={otMultipliers[k] ?? ""}
                  onChange={(e) => handleMultiplierChange(k, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Public Holiday
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="2.0"
                value={otMultipliers["public_holiday"] ?? ""}
                onChange={(e) =>
                  handleMultiplierChange("public_holiday", e.target.value)
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Leave blank to skip. Default is usually 1.5x on weekdays, 2.0x on holidays.
          </p>
        </div>
      )}
    </div>
  </SectionCard>
);

export default GeneralPayrollSection;