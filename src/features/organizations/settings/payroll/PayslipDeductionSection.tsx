import React from "react";
import SectionCard from "./SectionCard";

interface Props {
  settings: any;
  country?: string | null;
  currency?: string | null;
}

const PayslipDeductionSection: React.FC<Props> = ({
  settings,
  country,
  currency,
}) => {
  const isIndia = country === "IN";
  const isUAE = country === "AE";

  return (
    <SectionCard title="Payslip Deduction Settings">
      {/* Country + Currency Banner - Responsive */}
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
        {/* Deduction Toggle - Full-width on mobile */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="payslip_deduction_mode"
            defaultChecked={settings.payslip_deduction_mode || false}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
          />
          <label className="text-sm font-medium text-gray-700 leading-relaxed">
            Enable automatic salary deduction for extra (unpaid) leave
          </label>
        </div>

        {/* Country-specific Info */}
        {isIndia ? (
          <p className="text-xs text-gray-500 leading-relaxed ml-8">
            India: In India, salary deductions for unpaid leave are commonly calculated using{" "}
            <strong>26 working days</strong> per month.
          </p>
        ) : isUAE ? (
          <p className="text-xs text-gray-500 leading-relaxed ml-8">
            UAE: In UAE, salary deductions are typically based on{" "}
            <strong>30 calendar days</strong> per month.
          </p>
        ) : (
          <p className="text-xs text-gray-500 leading-relaxed ml-8">
            Default deduction uses 30-day base unless otherwise configured.
          </p>
        )}

        <hr className="border-gray-200" />

        {/* Deduction Mode - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deduction Mode for Extra Leave
            </label>
            <select
              name="payslip_deduction_mode_for_extra_leave"
              defaultValue={
                settings.payslip_deduction_mode_for_extra_leave || "FULL_GROSS"
              }
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
            >
              <option value="FULL_GROSS">Full Gross Salary</option>
              <option value="BASIC">Basic Salary Only</option>
            </select>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Choose whether deductions apply to the full salary or basic pay only.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default PayslipDeductionSection;