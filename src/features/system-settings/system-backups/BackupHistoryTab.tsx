import { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { useBackupHistory } from "./hooks";
import { useAuth } from "../../auth/AuthProvider";

export default function BackupHistoryTab() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ job_name: "", executed_at: "" });

  const { data, isLoading } = useBackupHistory(page, filters);
  const history = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

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
        <h2 className="text-xl font-semibold text-gray-800">Restricted Access</h2>
        <p className="text-gray-500 text-sm max-w-md">
          You don’t have permission to view backup execution history.
          Only system administrators can access this section.
        </p>
      </div>
    );
  } 
  
  return (
    <div className="card p-4 bg-white shadow rounded space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">
          Backup Execution History
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        <input
          type="text"
          placeholder="Search by backup name..."
          value={filters.job_name}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, job_name: e.target.value }))
          }
          className="input w-full sm:w-64"
        />
        <input
          type="date"
          value={filters.executed_at}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, executed_at: e.target.value }))
          }
          className="input w-44"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Backup Name</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Executed At</th>
              <th className="p-2 text-left">Trigger</th>
              <th className="p-2 text-left">Error Message</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : history.length ? (
              history.map((row: any) => (
                <tr key={row.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 capitalize">{row.job_name}</td>
                  <td
                    className={`p-2 font-medium ${
                      row.status === "success" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {row.status}
                  </td>
                  <td className="p-2">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{row.details?.trigger || "-"}</td>
                  <td className="p-2 text-gray-700">
                    {row.error_message || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  No backups found.
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
          onClick={() => setPage((p) => p - 1)}
          className="btn flex items-center gap-1 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="btn flex items-center gap-1 disabled:opacity-50"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
