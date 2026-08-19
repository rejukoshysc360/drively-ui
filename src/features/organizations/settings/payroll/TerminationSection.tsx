import React from "react";
import SectionCard from "./SectionCard";

interface Props {
  settings: any;
  onInfoClick: () => void;
  country?: string | null;
  currency?: string | null;
}

const TerminationSection: React.FC<Props> = ({
  settings,
  onInfoClick,
  country,
  currency,
}) => {
  const isIndia = country === "IN";
  const isUAE = country === "AE";

  return (
    <SectionCard title="Termination / Final Settlement">
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

      {/* Section Header with Info Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h3 className="text-base font-semibold text-gray-800">
          Termination / Final Settlement
        </h3>
        <button
          type="button"
          onClick={onInfoClick}
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm underline self-start sm:self-center"
        >
          ℹ️ Info
        </button>
      </div>

      {/* Checkboxes - Full-width on mobile */}
      <div className="space-y-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="include_accrued_leave_payout"
            defaultChecked={settings.include_accrued_leave_payout || false}
            className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
          />
          <span className="text-sm font-medium text-gray-700 leading-relaxed">
            Include accrued leave payout
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="include_gratuity_final_salary"
            defaultChecked={settings.include_gratuity_final_salary || false}
            className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
          />
          <span className="text-sm font-medium text-gray-700 leading-relaxed">
            Include gratuity in final salary
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="allow_encashment_in_probation"
            defaultChecked={settings.allow_encashment_in_probation || false}
            className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
          />
          <span className="text-sm font-medium text-gray-700 leading-relaxed">
            Allow Encashment in Probation
          </span>
        </label>
      </div>

      {/* Notice Period */}
      <div className="mt-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notice Period (days)
        </label>
        <input
          type="number"
          name="notice_period_days"
          defaultValue={
            settings.notice_period_days ||
            (isIndia ? 30 : isUAE ? 30 : 30)
          }
          min={0}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
        />
        {isIndia ? (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            India: Under Indian labour norms, 30 days is common for permanent employees; shorter periods may apply as per company policy.
          </p>
        ) : isUAE ? (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            UAE: UAE Labour Law mandates a minimum of 30 days’ notice for termination or resignation (Law No. 33 of 2021, Article 43).
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Default notice period is 30 days unless specified otherwise.
          </p>
        )}
      </div>

      {/* Probation Notice */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Probation Notice (days)
        </label>
        <input
          type="number"
          name="probation_notice_days"
          defaultValue={
            settings.probation_notice_days ||
            (isIndia ? 7 : isUAE ? 14 : 14)
          }
          min={0}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
        />
        {isIndia ? (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            India: For probationary employees, 7-15 days’ notice is typical but may vary by contract.
          </p>
        ) : isUAE ? (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            UAE: Employers must give 14 days’ notice during probation; employees must give 30 days if joining another UAE employer.
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Default probationary notice set to 14 days.
          </p>
        )}
      </div>
    </SectionCard>
  );
};

export default TerminationSection;