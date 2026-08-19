import React from "react";
import FormDialog from "../../../../components/ui/FormDialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

const IndiaGratuityInfoDialog: React.FC<Props> = ({ open, onClose }) => (
  <FormDialog
    open={open}
    title="Gratuity — Payment of Gratuity Act, 1972 (India)"
    onClose={onClose}
  >
    <p className="text-sm text-gray-700 mb-3">
      Under the <strong>Payment of Gratuity Act, 1972</strong>, gratuity is a
      statutory benefit payable to employees upon resignation, retirement, or
      termination (other than for misconduct), provided they have completed a
      minimum of <strong>5 years of continuous service</strong>.
    </p>

    <table className="w-full border border-gray-200 text-sm text-gray-700 mb-3">
      <thead>
        <tr className="bg-gray-50">
          <th className="border border-gray-200 p-2 text-left">Eligibility</th>
          <th className="border border-gray-200 p-2 text-left">
            Computation Basis
          </th>
          <th className="border border-gray-200 p-2 text-left">Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-200 p-2">
            Minimum 5 years of continuous service
          </td>
          <td className="border border-gray-200 p-2">
            15 days’ wages for each completed year of service
          </td>
          <td className="border border-gray-200 p-2">
            <strong>Exception:</strong> Death or disablement — payable even if
            service is less than 5 years.
          </td>
        </tr>
        <tr>
          <td className="border border-gray-200 p-2">Wage base</td>
          <td className="border border-gray-200 p-2">
            Last drawn <strong>Basic Salary</strong>
          </td>
          <td className="border border-gray-200 p-2">
            Other allowances (HRA, bonus, etc.) excluded.
          </td>
        </tr>
        <tr>
          <td className="border border-gray-200 p-2">Computation formula</td>
          <td className="border border-gray-200 p-2">
            (Basic Salary × 15 × Years of Service) ÷ 26
          </td>
          <td className="border border-gray-200 p-2">
            26 working days/month considered as per law.
          </td>
        </tr>
        <tr>
          <td className="border border-gray-200 p-2">Rounding rule</td>
          <td className="border border-gray-200 p-2">
            &gt; 6 months = count as full year
          </td>
          <td className="border border-gray-200 p-2">
            ≤ 6 months ignored in service computation.
          </td>
        </tr>
        <tr>
          <td className="border border-gray-200 p-2">Maximum Cap</td>
          <td className="border border-gray-200 p-2">₹20,00,000</td>
          <td className="border border-gray-200 p-2">
            As per 2018 amendment to the Gratuity Act.
          </td>
        </tr>
      </tbody>
    </table>

    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-3">
      <li>Applies to establishments with 10 or more employees.</li>
      <li>Payable upon resignation, retirement, death, or disablement.</li>
      <li>Tax-exempt up to ₹20 lakh under Income Tax Section 10(10).</li>
      <li>
        Forfeiture only if employee is terminated for misconduct involving moral
        turpitude or violence.
      </li>
      <li>
        Computed solely on last drawn <strong>Basic Salary</strong> (not gross salary).
      </li>
    </ul>

    <p className="text-xs text-gray-500">
      <strong>Reference:</strong> Payment of Gratuity Act, 1972 — Sections 4(1),
      4(2), and 4(3); Government Notification (2018 Amendment — ₹20 lakh cap).
    </p>
  </FormDialog>
);

export default IndiaGratuityInfoDialog;
