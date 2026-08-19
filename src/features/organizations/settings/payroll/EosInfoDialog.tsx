import React from "react";
import FormDialog from "../../../../components/ui/FormDialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EosInfoDialog: React.FC<Props> = ({ open, onClose }) => (
  <FormDialog
    open={open}
    title="End of Service Gratuity (EOS) — UAE Labour Law No. 33 (2021)"
    onClose={onClose}
  >
    <p className="text-sm text-gray-700 mb-3">
      As per UAE Labour Law No. 33 of 2021, gratuity is calculated only on the
      employee’s <strong>Basic Salary</strong> (excluding allowances / bonuses).
    </p>

    <table className="w-full border border-gray-200 text-sm text-gray-700 mb-3">
      <thead>
        <tr className="bg-gray-50">
          <th className="border border-gray-200 p-2 text-left">Service Length</th>
          <th className="border border-gray-200 p-2 text-left">
            Days of Basic Salary per Year of Service
          </th>
          <th className="border border-gray-200 p-2 text-left">Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-200 p-2">1 to 5 years</td>
          <td className="border border-gray-200 p-2">21 days per year</td>
          <td className="border border-gray-200 p-2">Often referred to as “Tier 1”.</td>
        </tr>
        <tr>
          <td className="border border-gray-200 p-2">More than 5 years</td>
          <td className="border border-gray-200 p-2">30 days per year</td>
          <td className="border border-gray-200 p-2">“Tier 2”.</td>
        </tr>
        <tr>
          <td className="border border-gray-200 p-2">Maximum Cap</td>
          <td className="border border-gray-200 p-2">
            2 years’ basic salary
          </td>
          <td className="border border-gray-200 p-2">
            Legal cap to avoid excessive payout.
          </td>
        </tr>
      </tbody>
    </table>

    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-3">
      <li>Employee must complete at least 1 year of continuous service to qualify.</li>
      <li>Resignation before 1 year → no gratuity entitlement.</li>
      <li>Fraud or gross misconduct terminations → gratuity forfeited (Article 44).</li>
      <li>Gratuity not paid if employee is under probation or terminated for cause.</li>
      <li>Gratuity calculated only on Basic Salary and capped at 2 years of pay.</li>
    </ul>

    <p className="text-xs text-gray-500">
      <strong>Reference:</strong> UAE Labour Law No. 33 of 2021 — Articles 51 &amp; 52 on End-of-Service Gratuity.
    </p>
  </FormDialog>
);

export default EosInfoDialog;
