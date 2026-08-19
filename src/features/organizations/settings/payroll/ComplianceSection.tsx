import React from "react";
import SectionCard from "./SectionCard";

interface Props {
  settings: any;
  wpsEnabled: boolean;
  setWpsEnabled: (v: boolean) => void;
  wpsFileExport: boolean;
  setWpsFileExport: (v: boolean) => void;
  onWpsInfo: () => void;
  onSifInfo: () => void;
  country?: string | null;
  currency?: string | null;
}

const ComplianceSection: React.FC<Props> = ({
  settings,
  wpsEnabled,
  setWpsEnabled,
  wpsFileExport,
  setWpsFileExport,
  onWpsInfo,
  onSifInfo,
  country,
  currency,
}) => {
  const isIndia = country === "IN";
  const isUAE = country === "AE";

  const archiveOldPayslips = Boolean(settings.archive_old_payslips);
  const archiveYears = settings.archive_retention_years || 2;

  return (
    <SectionCard title="Compliance & Reporting">
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

      {/* Record Retention & Language - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/*<div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Record Retention Years
          </label>
          <input
            type="number"
            name="record_retention_years"
            defaultValue={settings.record_retention_years || 2}
            min={1}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
          />
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Number of years payroll records must be retained.
          </p>
        </div>*/}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payslip Language
          </label>
          <select
            name="payslip_language"
            defaultValue={settings.payslip_language || "EN"}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
          >
            <option value="EN">English</option>
          </select>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Select preferred payslip display language.
          </p>
        </div>
      </div>

      {/* Archive Payslips Section 
      <div className="mt-8 pt-6 border-t border-gray-200">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="archive_old_payslips"
            defaultChecked={archiveOldPayslips}
            className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
          />
          <span className="text-sm font-medium text-gray-800 leading-relaxed">
            Archive Payslips to AWS (Older than {archiveYears} years)
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-2 ml-8 leading-relaxed">
          When enabled, payslips older than the retention period will be archived to AWS S3.
        </p>
      </div>*/}

      {/* UAE-only WPS Settings */}
      {isUAE && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={wpsEnabled}
              onChange={(e) => setWpsEnabled(e.target.checked)}
              disabled
              className="rounded border-gray-300 text-indigo-600 h-5 w-5"
            />
            <span className="text-sm font-medium text-gray-700">
              Already Enabled WPS (For UAE compliance)
            </span>
            <button
              type="button"
              onClick={onWpsInfo}
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm underline"
            >
              ℹ️ Info
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={wpsFileExport}
              onChange={(e) => setWpsFileExport(e.target.checked)}
              disabled
              className="rounded border-gray-300 text-indigo-600 h-5 w-5"
            />
            <span className="text-sm font-medium text-gray-700">
              Enable WPS SIF File Export (Currently Not Using)
            </span>
            <button
              type="button"
              onClick={onSifInfo}
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm underline"
            >
              ℹ️ Info
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 leading-relaxed ml-8">
            UAE: WPS (Wage Protection System) ensures salary disbursements comply with UAE labour regulations.
          </p>
        </div>
      )}

      {/* India-specific Compliance Info */}
      {isIndia && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-800">
            India: In India, payroll compliance is governed by the{" "}
            <strong>Payment of Wages Act, EPF, and ESI regulations</strong>.
          </p>
          <ul className="text-xs text-gray-600 mt-3 ml-6 space-y-2 list-disc leading-relaxed">
            <li>Ensure timely deposit of EPF and ESI contributions.</li>
            <li>Generate monthly challans via official EPFO/ESIC portals.</li>
            <li>No WPS or SIF file submission required.</li>
          </ul>
        </div>
      )}
    </SectionCard>
  );
};

export default ComplianceSection;