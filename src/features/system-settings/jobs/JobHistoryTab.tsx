import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Mail,
} from "lucide-react";

import {
  useEmailAudit,
  useJobHistory,
} from "../hooks";

import { useAuth } from "../../../features/auth/AuthProvider";

import EmailAuditOverlay from "./EmailAuditOverlay";

export default function JobHistoryTab() {
  const [page, setPage] = useState(1);

  const [selectedExecutionId, setSelectedExecutionId] =
    useState<string | null>(null);

  const [filters, setFilters] = useState({
    job_name: "",
    executed_at: "",
  });

  const { data, isLoading } = useJobHistory(
    page,
    filters
  );

  const history = data?.data || [];

  const totalPages =
    data?.pagination?.totalPages || 1;

  const {
    data: auditData,
    isLoading: auditLoading,
  } = useEmailAudit(selectedExecutionId);

  const emailLogs = auditData || [];

  const { profile } = useAuth();

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : [profile?.roles];

  const slugs = roles.map((r) => r?.slug);

  const isAdmin = slugs.includes("admin");

  // 🔒 Restrict access to admin only
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />

        <h2 className="text-xl font-semibold text-gray-800">
          Restricted Access
        </h2>

        <p className="text-gray-500 text-sm max-w-md">
          You don’t have permission to view
          job execution history. Only system
          administrators can access this
          section.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="card p-4 bg-white shadow rounded space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">
            Job Execution History
          </h3>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              placeholder="Search by job name..."
              value={filters.job_name}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  job_name:
                    e.target.value,
                }))
              }
              className="input w-full"
            />
          </div>

          <div>
            <input
              type="date"
              value={filters.executed_at}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  executed_at:
                    e.target.value,
                }))
              }
              className="input w-44"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">
                  Job Name
                </th>

                <th className="p-2 text-left">
                  Status
                </th>

                <th className="p-2 text-left">
                  Executed At
                </th>

                <th className="p-2 text-left">
                  Trigger
                </th>

                <th className="p-2 text-left">
                  Error Message
                </th>

                <th className="p-2 text-left">
                  Email Audit
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center p-4 text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              ) : history.length ? (
                history.map((row: any) => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-2 capitalize">
                      {row.job_name}
                    </td>

                    <td
                      className={`p-2 font-medium ${
                        row.status ===
                        "success"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {row.status}
                    </td>

                    <td className="p-2">
                      {new Date(
                        row.created_at
                      ).toLocaleString()}
                    </td>

                    <td className="p-2">
                      {row.details
                        ?.trigger || "-"}
                    </td>

                    <td className="p-2 text-gray-700">
                      {row.error_message ||
                        "-"}
                    </td>

                    <td className="p-2">
                      <button
                        onClick={() =>
                          setSelectedExecutionId(
                            row.id
                          )
                        }
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Mail className="w-4 h-4" />

                        View Audit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center p-4 text-gray-500"
                  >
                    No job executions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-3">
          <button
            disabled={page === 1}
            onClick={() =>
              setPage((p) => p - 1)
            }
            className="btn flex items-center gap-1 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />

            Prev
          </button>

          <span className="text-sm text-gray-600">
            Page {page} of{" "}
            {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() =>
              setPage((p) => p + 1)
            }
            className="btn flex items-center gap-1 disabled:opacity-50"
          >
            Next{" "}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <EmailAuditOverlay
        open={!!selectedExecutionId}
        executionId={
          selectedExecutionId
        }
        logs={emailLogs}
        isLoading={auditLoading}
        onClose={() =>
          setSelectedExecutionId(
            null
          )
        }
      />
    </>
  );
}