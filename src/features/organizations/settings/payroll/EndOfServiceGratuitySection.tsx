import React from "react";
import SectionCard from "./SectionCard";

interface Props {
  settings: any;
  onInfoClick: () => void;
  country?: string | null;
  currency?: string | null;
}

const EndOfServiceGratuitySection: React.FC<Props> = ({
  settings,
  onInfoClick,
  country,
  currency,
}) => {
  const tier1Years = settings.gratuity_tier1_start_years || 1;
  const tier2Years = settings.gratuity_tier2_start_years || 5;

  const isIndia = country === "IN";
  const isUAE = country === "AE";

  return (
    <SectionCard title="End of Service Gratuity">
      {/* Info Hint + Info Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-xs text-gray-500 italic">
          Enable gratuity under <strong>Termination Settings</strong> to activate the rules below.
        </p>
        <button
          type="button"
          onClick={onInfoClick}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline self-start sm:self-center"
        >
          ℹ️ Info
        </button>
      </div>

      {/* Country + Currency Banner */}
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

      {/* Country-specific Legal Info */}
      {isUAE ? (
        <p className="text-xs text-gray-600 leading-relaxed mt-3">
          As per <strong>UAE Labour Law No. 33 (2021)</strong>: calculated on{" "}
          <strong>Basic Salary</strong> only — 21 days/year (1–5 years) and 30 days/year (after 5 years),
          capped at 2 years of basic pay.
        </p>
      ) : isIndia ? (
        <p className="text-xs text-gray-600 leading-relaxed mt-3">
          Under the <strong>Payment of Gratuity Act, 1972</strong>: 15 days’ wages for each completed year after 5 years,
          based on last drawn Basic only. <br />
          Formula: <strong>(Basic × 15 × Years of Service ÷ 26)</strong>.
        </p>
      ) : (
        <p className="text-xs text-gray-600 leading-relaxed mt-3">
          Calculated on Basic Salary only.
        </p>
      )}

      {/* UAE: Split-Period Toggle */}
      {isUAE && (
        <div className="mt-6 space-y-2">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="split_period_calculation_enabled"
              defaultChecked={settings.split_period_calculation_enabled || false}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="font-medium">Enable Split-Period Calculation</span>
          </label>
          <p className="text-xs text-gray-500 ml-7 leading-relaxed">
            When enabled, gratuity will be calculated separately for each period where Basic Salary changed.
          </p>
        </div>
      )}

      {/* Gratuity Cap */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gratuity Cap ({isIndia ? "Amount" : "Years of Salary"})
        </label>
        <input
          type="number"
          name={isIndia ? "gratuity_cap_amount" : "gratuity_cap_years"}
          defaultValue={
            isIndia
              ? settings.gratuity_cap_amount || 2000000
              : settings.gratuity_cap_years || 2
          }
          min={0}
          step={isIndia ? "1000" : "1"}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
        />
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {isIndia
            ? "Maximum gratuity cap in India is ₹20,00,000 (as per 2018 amendment)."
            : "Legal cap of 2 years’ basic salary under UAE law."}
        </p>
      </div>

      {/* UAE: Apply Resignation Scale */}
      {isUAE && (
        <div className="mt-6 space-y-2">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="apply_resignation_scale"
              defaultChecked={settings.apply_resignation_scale ?? true}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="font-medium">Apply Resignation Scale (Article 137)</span>
          </label>
          <p className="text-xs text-gray-500 ml-7 leading-relaxed">
            Applicable for tenure less than 5 years:<br />
            • 1–3 years = ⅓<br />
            • 3–5 years = ⅔<br />
            • 5+ years = full gratuity
          </p>
        </div>
      )}

      {/* Gratuity Tiers */}
      <div className="mt-8 space-y-6">
        <h4 className="text-sm font-semibold text-gray-800">Gratuity Computation Rules</h4>

        {isUAE ? (
          <>
            {/* UAE: Two Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Years &lt; {tier2Years}
                </label>
                <input
                  type="number"
                  name="gratuity_tier1_start_years"
                  defaultValue={tier1Years}
                  min={1}
                  max={tier2Years - 1}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days per Year (for &lt; {tier2Years} years)
                </label>
                <input
                  type="number"
                  name="gratuity_tier1_days_per_year"
                  defaultValue={settings.gratuity_tier1_days_per_year || 21}
                  min={0}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Years ≥ {tier2Years}
                </label>
                <input
                  type="number"
                  name="gratuity_tier2_start_years"
                  defaultValue={tier2Years}
                  min={tier1Years + 1}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days per Year (for ≥ {tier2Years} years)
                </label>
                <input
                  type="number"
                  name="gratuity_tier2_days_per_year"
                  defaultValue={settings.gratuity_tier2_days_per_year || 30}
                  min={0}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
                />
              </div>
            </div>
          </>
        ) : (
          /* India / Default: Single Tier */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Years for Eligibility
              </label>
              <input
                type="number"
                name="gratuity_tier2_start_years"
                defaultValue={5}
                min={1}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days per Year (Basic Consideration)
              </label>
              <input
                type="number"
                name="gratuity_tier2_days_per_year"
                defaultValue={15}
                min={0}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
              />
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default EndOfServiceGratuitySection;