import React from "react";
import { getReasonLabel } from "../../utils/getReasonLabel";
import { useAuth } from "../auth/AuthProvider";

export default function FinalSettlementPreview({
  data,
  isEditing = false,
  onChange,
}: {
  data: {
    gratuity_amount: number;
    leave_encashment: number;
    notice_pay: number;
    other_allowances: number;
    deductions: number;
    total_payable: number;
    status: string;
    reason?: string | null;
    notes?: string | null;
    last_working_date?: string;
    hire_date?: string;
    employee?: { full_name: string; email?: string };
  };
  isEditing?: boolean;
  onChange?: (key: string, val: any) => void;
}) {
  const {
    organization_currency,
    organization_logo_url,
    organization_name,
    organization_address,
  } = useAuth();

  const ccy = organization_currency || "AED";

  // ---------------- Editable Row ----------------
  const Row = ({
    label,
    field,
    value,
  }: {
    label: string;
    field: string;
    value: number;
  }) => {
    const [temp, setTemp] = React.useState(String(value));
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (document.activeElement !== inputRef.current) {
        setTemp(String(value));
      }
    }, [value]);

    const handleChange = (val: string) => {
      if (/^-?\d*\.?\d*$/.test(val)) setTemp(val);
    };

    const handleBlur = () => {
      if (["", "-", ".", "-."].includes(temp)) {
        setTemp(String(value));
        return;
      }
      const num = parseFloat(temp);
      if (!isNaN(num)) onChange && onChange(field, num);
      else setTemp(String(value));
    };

    return (
      <tr>
        <td className="border px-3 py-2">{label}</td>
        <td className="border px-3 py-2 text-right">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={temp}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              className="w-28 border rounded px-1 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
              style={{ MozAppearance: "textfield" }}
              onWheel={(e) => e.currentTarget.blur()}
            />
          ) : (
            `${ccy} ${value.toFixed(2)}`
          )}
        </td>
      </tr>
    );
  };

  return (
    <div
      className="mx-auto w-full md:w-[794px] max-w-full md:max-w-[794px] px-4 sm:px-6 overflow-x-hidden"
      style={{
        background: "#fff",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-start mb-6  pb-3 gap-4 pt-6">
        <div className="text-sm leading-relaxed flex-1 min-w-0">
          <div className="font-semibold text-base mb-1">
            {organization_name || "Organization"}
          </div>

          {organization_address && (
            <div className="text-gray-700 text-sm whitespace-pre-line break-words">
              {organization_address}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <img
            src={organization_logo_url}
            alt="Company Logo"
            className="max-h-[60px] max-w-[220px] w-auto h-auto object-contain"
          />
        </div>
      </div>

      {/* ---------------- Title ---------------- */}
      <h1 className="text-2xl font-semibold text-center mb-6 underline">
        Final Settlement
      </h1>

      {/* ---------------- Employee Info ---------------- */}
      <div className="text-sm mb-6 space-y-1 text-gray-700">
        <p>
          <strong>Employee:</strong> {data.employee?.full_name ?? "-"}
        </p>
        <p>
          <strong>Email:</strong> {data.employee?.email ?? "-"}
        </p>
        <p>
          <strong>Last Working Date:</strong>{" "}
          {data.last_working_date
            ? new Date(data.last_working_date).toLocaleDateString()
            : "-"}
        </p>
        <p>
          <strong>Hire Date:</strong>{" "}
          {data.hire_date ? new Date(data.hire_date).toLocaleDateString() : "-"}
        </p>
        <p>
          <strong>Reason:</strong> {getReasonLabel(data.reason)}
        </p>
        {isEditing ? (
          <div>
            <strong>Notes:</strong>
            <textarea
              value={data.notes || ""}
              onChange={(e) => onChange && onChange("notes", e.target.value)}
              className="w-full mt-1 border rounded px-2 py-1 text-sm"
              rows={3}
            />
          </div>
        ) : (
          data.notes && (
            <p className="whitespace-pre-line break-words">
              <strong>Notes:</strong> {data.notes}
            </p>
          )
        )}
      </div>

      {/* ---------------- Breakdown Table ---------------- */}
      <table className="min-w-full border text-sm mb-8">
        <tbody>
          <Row
            label="Gratuity"
            field="gratuity_amount"
            value={data.gratuity_amount}
          />
          <Row
            label="Leave Encashment"
            field="leave_encashment"
            value={data.leave_encashment}
          />
          <Row label="Notice Pay" field="notice_pay" value={data.notice_pay} />
          <Row
            label="Other Allowances"
            field="other_allowances"
            value={data.other_allowances}
          />
          <Row label="Deductions" field="deductions" value={data.deductions} />

          <tr>
            <td className="border px-3 py-2 font-semibold">Total Payable</td>
            <td className="border px-3 py-2 text-right font-semibold text-green-700">
              {`${ccy} ${data.total_payable.toFixed(2)}`}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ---------------- Status ---------------- */}
      <div className="text-gray-500 text-sm italic text-center mb-6">
        Status: {data.status.toUpperCase()}
      </div>
    </div>
  );
}
