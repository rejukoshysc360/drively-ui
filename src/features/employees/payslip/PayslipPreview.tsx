import React from 'react';
import { PayslipData } from './api';
import { useAuth } from '../../auth/AuthProvider';

type Props = {
  preview: PayslipData;
  isEditing?: boolean;
  onEdit?: (data: PayslipData) => void;
};

export default function PayslipPreview({
  preview,
  isEditing = false,
  onEdit,
}: Props) {
  /**
   * 🛑 HARD GUARD
   * Prevents intermittent crashes when payslip data
   * is missing / still loading / partially returned
   */
  if (
    !preview ||
    !preview.employee ||
    !preview.employer ||
    !preview.header ||
    !preview.total
  ) {
    return (
      <div className="p-6 text-sm text-gray-500 text-center">
        Payslip not available for this period.
      </div>
    );
  }

  const {
    employer,
    employee,
    header,
    earnings = [],
    deductions = [],
    total,
  } = preview;

  const { organization_currency,organization_logo_url } = useAuth();
  const currency = organization_currency || 'AED';

  const formatAmount = (value: number = 0) =>
    `${currency} ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })}`;

  const handleChange = (
    group: 'earnings' | 'deductions',
    index: number,
    value: number
  ) => {
    if (!onEdit) return;
    const updated = JSON.parse(JSON.stringify(preview));
    updated[group][index].amount = Number(value);
    onEdit(updated);
  };

  return (
    <div
      className="w-full bg-white"
      style={{
        maxWidth: 794,
        margin: '0 auto',
        padding: 24,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-start mb-6 border-b pb-3 gap-4">
        <div className="text-sm leading-relaxed flex-1 min-w-0">
          <div className="font-semibold text-base mb-1">
            {employer.name || ''}
          </div>

          {employer.address && (
            <div className="text-gray-800 whitespace-pre-line break-words">
              {employer.address}
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-2 text-blue-700 break-words">
            {employer.email && (
              <a href={`mailto:${employer.email}`} className="hover:underline">
                {employer.email}
              </a>
            )}
            {employer.email && employer.phone && (
              <span className="text-gray-400">|</span>
            )}
            {employer.phone && <span>{employer.phone}</span>}
          </div>
        </div>

        <div className="flex-shrink-0">
          <img
            src={organization_logo_url }
            alt="Company Logo"
            className="max-h-[60px] max-w-[220px] w-auto h-auto object-contain"
          />
        </div>
      </div>

      {/* ---------------- Title ---------------- */}
      <h1 className="text-2xl font-semibold mb-6 text-center underline">
        Payslip
      </h1>

      {/* ---------------- Employee Info ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
        <div className="flex flex-col gap-1">
          <div>
            <span className="text-gray-600 font-medium">Employee:</span>{' '}
            {employee.name || '—'}
          </div>

          {employee.employee_number && (
            <div>
              <span className="text-gray-600 font-medium">
                Employee No:
              </span>{' '}
              {employee.employee_number}
            </div>
          )}

          <div>
            <span className="text-gray-600 font-medium">
              Designation:
            </span>{' '}
            {employee.designation || 'Not Set'}
          </div>

          <div>
            <span className="text-gray-600 font-medium">
              Department:
            </span>{' '}
            {employee.department || 'Not Set'}
          </div>

          <div>
            <span className="text-gray-600 font-medium">DOJ:</span>{' '}
            {employee.doj || '-'}
          </div>
        </div>

        <div className="flex sm:justify-end">
          <div className="flex flex-col gap-1">
            <div>
              <span className="text-gray-600 font-medium">
                Period:
              </span>{' '}
              {header.pay_period || ''}
            </div>
            <div>
              <span className="text-gray-600 font-medium">Date:</span>{' '}
              {header.pay_date || ''}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Earnings ---------------- */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Earnings</h2>

        {earnings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <tbody>
                {earnings.map((e, i) => (
                  <tr key={e.id}>
                    <td className="border px-2 py-1">{e.name}</td>
                    <td className="border px-2 py-1 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-24 border rounded px-1 text-right"
                          value={e.amount}
                          onChange={(ev) =>
                            handleChange(
                              'earnings',
                              i,
                              Number(ev.target.value)
                            )
                          }
                        />
                      ) : (
                        formatAmount(e.amount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            No earnings recorded
          </div>
        )}
      </div>

      {/* ---------------- Deductions ---------------- */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Deductions</h2>

        {deductions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <tbody>
                {deductions.map((d, i) => (
                  <tr key={d.id}>
                    <td className="border px-2 py-1">{d.name}</td>
                    <td className="border px-2 py-1 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-24 border rounded px-1 text-right"
                          value={d.amount}
                          onChange={(ev) =>
                            handleChange(
                              'deductions',
                              i,
                              Number(ev.target.value)
                            )
                          }
                        />
                      ) : (
                        formatAmount(d.amount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            No deductions recorded
          </div>
        )}
      </div>

      {/* ---------------- Totals ---------------- */}
      <div className="mt-6 text-sm space-y-1">
        <div>
          <strong>Gross:</strong> {formatAmount(total.gross ?? 0)}
        </div>
        <div>
          <strong>Deductions:</strong>{' '}
          {formatAmount(total.deductions ?? 0)}
        </div>
        <div>
          <strong>Net Pay:</strong>{' '}
          {formatAmount(total.net_pay ?? 0)}
        </div>
        <div className="italic break-words">
          {total.net_pay_in_words || ''}
        </div>
      </div>

      {/* ---------------- Footer ---------------- */}
      <div className="mt-8 text-sm space-y-4">
        <p>
          <strong>Payment Method:</strong>{' '}
          {employee.payment_method || 'Bank Transfer'}
        </p>

        <p>
          <strong>For {employer.name}</strong>
        </p>

        <p>
          <strong>Signature:</strong>
        </p>
      </div>
    </div>
  );
}
