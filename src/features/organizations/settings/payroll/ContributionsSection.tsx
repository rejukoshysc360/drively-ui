import React from "react";
import SectionCard from "./SectionCard";

interface Props {
  settings: any;
  onInfoClick: () => void;
  country?: string | null;
  currency?: string | null;
}

const ContributionsSection: React.FC<Props> = ({
  settings,
  onInfoClick,
  country,
  currency,
}) => (
  <SectionCard title="Contributions & Benefits">
    {/* Country and Currency Info */}
    {country && (
      <div className="mb-3 p-3 rounded-md bg-gray-50 border border-gray-100 text-sm text-gray-700 flex items-center justify-between">
        <div>
          <strong>Country:</strong> <span className="uppercase">{country}</span>
        </div>
        {currency && (
          <div>
            <strong>Currency:</strong> {currency}
          </div>
        )}
      </div>
    )}

    <div className="flex items-center space-x-2 mt-2">
      <span className="font-medium text-gray-700">Contributions & Benefits</span>
      <button
        type="button"
        className="text-sm text-indigo-600 underline"
        onClick={onInfoClick}
      >
        ℹ️
      </button>
    </div>

    {/* Conditional Hint based on Country */}
    {country === "IN" ? (
      <p className="text-xs text-gray-500 mt-1 mb-3">
        🇮🇳 In India, statutory contributions usually include **Provident Fund (PF)**,
        **Employee State Insurance (ESI)**, and **Professional Tax (PT)** where applicable.
      </p>
    ) : country === "AE" ? (
      <p className="text-xs text-gray-500 mt-1 mb-3">
        🇦🇪 In UAE, mandatory contributions mainly apply to **Emiratis** under the
        **GPSSA Pension Scheme**, while expatriates are typically covered through
        gratuity benefits instead.
      </p>
    ) : null}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pension Employer %
        </label>
        <input
          type="number"
          step="0.01"
          name="pension_employer_percent"
          defaultValue={settings.pension_employer_percent || 0}
          min={0}
          className="w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pension Employee %
        </label>
        <input
          type="number"
          step="0.01"
          name="pension_employee_percent"
          defaultValue={settings.pension_employee_percent || 0}
          min={0}
          className="w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
    </div>

    <label className="flex items-center space-x-2 mt-4">
      <input
        type="checkbox"
        name="health_insurance_enabled"
        defaultChecked={settings.health_insurance_enabled || false}
        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span>Health Insurance Enabled</span>
    </label>
  </SectionCard>
);

export default ContributionsSection;
