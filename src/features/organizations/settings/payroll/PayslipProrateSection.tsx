import React from "react";
import SectionCard from "./SectionCard";

interface Props {
  settings: any;
  country?: string | null;
  currency?: string | null;
}

const PayslipProrateSection: React.FC<Props> = ({ settings, country, currency }) => {
  const isIndia = country === "IN";
  const isUAE = country === "AE";

  return (
    <SectionCard title="Payslip Pro-Rate Settings">
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

      <p className="text-sm text-gray-600 leading-relaxed">
        Define how prorated salary is calculated when employees join, leave, or receive a salary change mid-month.
      </p>

      {/* Regional Info */}
      {isIndia ? (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          India: In India, pro-rata salary is usually calculated on a base of{" "}
          <strong>26 working days</strong> per month.
        </p>
      ) : isUAE ? (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          UAE: In UAE, pro-rata salary is typically calculated on{" "}
          <strong>30 calendar days</strong> per month and based on gross.
        </p>
      ) : (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          Default base: <strong>30 days</strong> unless otherwise specified.
        </p>
      )}

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Pro-Rate Mode Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pro-Rate Mode for Partial-Month Salary
          </label>
          <select
            name="payslip_prorate_mode_for_partial_month"
            defaultValue={settings.payslip_prorate_mode_for_partial_month || "FULL_GROSS"}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
          >
            <option value="FULL_GROSS">Prorate All Fixed Earnings(Excludes Sum Up)</option>
            <option value="BASIC">Basic Salary Only</option>
          </select>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Select which component of salary should be prorated for mid-month joining or exit.
          </p>
        </div>

        {/* Basic Salary Increase Mid-Month */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Basic Salary Increase (Mid-Month)
          </label>
          <select
            name="basic_increase_mid_month_mode"
            defaultValue={settings.basic_increase_mid_month_mode || "LATEST_ONLY"}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
          >
            <option value="LATEST_ONLY">Use Latest Salary Only</option>
            <option value="PRORATED">Prorate Old & New Rates</option>
          </select>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Choose how the engine should handle basic-salary increases that take effect mid-month.{" "}
            <strong>“Latest Only”</strong> pays the new rate for the full month, while{" "}
            <strong>“Prorated”</strong> splits pay between old and new amounts.
          </p>
        </div>
      </div>
    </SectionCard>
  );
};

export default PayslipProrateSection;