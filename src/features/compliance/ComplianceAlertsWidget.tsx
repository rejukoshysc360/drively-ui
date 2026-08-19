// src/payroll/compliance/ComplianceAlertsWidget.tsx
import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  UserX,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { useComplianceAudits } from "./hooks";
import { useNavigate } from "react-router-dom";
import { toReadableLabel } from "../../utils/StringUtils";

interface Props {
  employeeId?: string;
  showHeader?: boolean;
  limit?: number;
}

export default function ComplianceAlertsWidget({
  employeeId,
  showHeader = true,
  limit,
}: Props) {
  const [page, setPage] = useState(1);

  const perPage = limit ?? (employeeId ? 10 : 5);

  const { data, isLoading } = useComplianceAudits(
    page,
    perPage,
    "",
    "all",
    employeeId
  );

  const navigate = useNavigate();

  const alerts = data?.audits ?? [];
  const pagination = data?.paginationMetaInfo;

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">

      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />

            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
              Compliance Alerts
            </h2>
          </div>

          {!employeeId && (
            <button
              onClick={() => navigate("/compliance-field-alert")}
              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              View More <ExternalLink className="w-3 h-3" />
            </button>
          )}

        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-sm text-gray-500 py-4 text-center">
          Loading alerts…
        </div>
      ) : alerts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">

            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-200">
                {!employeeId && (
                  <th className="py-2 px-2">Employee</th>
                )}

                <th className="py-2 px-2">Field</th>

                <th className="py-2 px-2 text-center">
                  Days Left
                </th>

                <th className="py-2 px-2 text-center">
                  Created At
                </th>
                <th className="py-2 px-2 text-center">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {alerts.map((a) => {
                const days = Number(a.days_left ?? 0);

                const isNegative = days < 0;

                const daysLabel = `${Math.abs(days)} ${
                  Math.abs(days) === 1 ? "day" : "days"
                }${isNegative ? " overdue" : ""}`;

                const fieldLabel = toReadableLabel(
                  a.computed_value || a.field_name || "—"
                );

                return (
                  <tr
                    key={a.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >

                    {!employeeId && (
                      <td className="py-2 px-2 text-gray-800 font-medium">
                        {a.employee?.full_name || "—"}
                      </td>
                    )}

                    {/* Field */}
                    <td className="py-2 px-2 text-indigo-700 font-medium">
                      {fieldLabel}
                    </td>

                    {/* Days Left */}
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isNegative
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : days <= 7
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {isNegative ? (
                          <UserX className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}

                        {daysLabel}
                      </span>
                    </td>

{/* Created At */}
<td className="py-2 px-2 text-center">
  {a.created_at ? (
    <div className="inline-flex flex-col items-center text-xs text-gray-600">
      <div className="flex items-center gap-1">
        <Calendar className="w-3 h-3" />

        <span>
          {new Date(a.created_at).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </span>
      </div>
    </div>
  ) : (
    "—"
  )}
</td>
<td className="py-2 px-2 text-center">
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      a.status === "expired"
        ? "bg-red-50 text-red-700 border border-red-200"
        : a.status === "expiring_soon"
        ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
        : "bg-orange-50 text-orange-700 border border-orange-200"
    }`}
  >
    {toReadableLabel(a.status || "warning")}
  </span>
</td>

                  </tr>
                );
              })}
            </tbody>

          </table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="w-full flex justify-center mt-4">

              <div className="inline-flex items-center gap-3 text-xs text-gray-600 border rounded px-3 py-1 shadow-sm">

                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2 py-1 rounded disabled:opacity-50"
                >
                  Prev
                </button>

                <span>
                  Page {pagination.currentPage} of{" "}
                  {pagination.totalPages}
                </span>

                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2 py-1 rounded disabled:opacity-50"
                >
                  Next
                </button>

              </div>

            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500 py-4 text-center">
          No compliance alerts found.
        </div>
      )}
    </div>
  );
}