import { useEffect, useRef, useState } from "react";
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
  useImportHolidays,
  useExportHolidays,
  usePullGoogleHolidays,
} from "./hooks";
import { Holiday } from "./api";
import {
  Plus,
  Trash2,
  Pencil,
  Upload,
  Download,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import FormDialog from "../../../components/ui/FormDialog";
import { useCan } from "../../../utils/permissions";

export default function HolidayPage() {
  const { organization_id } = useAuth();

  const can = useCan();
  const canView = can("holidays:view");
  const canCreate = can("holidays:create");
  const canUpdate = can("holidays:update");
  const canDelete = can("holidays:delete");
  const canImport = can("holidays:import");
  const canExport = can("holidays:export");
  const canSync = can("holidays:sync");

  const [page, setPage] = useState(1);
  const limit = 10;

  const createHoliday = useCreateHoliday();
  const [editing, setEditing] = useState<Holiday | null>(null);
  const updateHoliday = useUpdateHoliday(editing?.id || "");
  const deleteHoliday = useDeleteHoliday();

  const importHolidays = useImportHolidays();
  const exportHolidays = useExportHolidays();
  const pullGoogle = usePullGoogleHolidays();

  const [openForm, setOpenForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);

  const { data, isLoading, refetch } = useHolidays(page, limit, year);
  const holidays = data?.holidays ?? [];

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreate && !canUpdate) return;

    const fd = new FormData(e.currentTarget);
    const input = {
      name: fd.get("name") as string,
      date: fd.get("date") as string,
    };

    if (editing) {
      if (!canUpdate) return;
      await updateHoliday.mutateAsync(input);
    } else {
      if (!canCreate) return;
      await createHoliday.mutateAsync(input);
    }

    setOpenForm(false);
    setEditing(null);
    e.currentTarget.reset();
    refetch();
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    try {
      await importHolidays.mutateAsync(file);
      refetch();
    } finally {
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    if (!organization_id) {
      alert("Organization not found");
      return;
    }

    try {
      const result = await exportHolidays.mutateAsync(year);
      const blob = result.blob;
      if (!(blob instanceof Blob)) {
        throw new Error("Invalid response: not a valid file");
      }

      const fileName = `holidays_${organization_id}_${year}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export failed:", err);
      alert(err.message || "Failed to export holidays. Please try again.");
    }
  };

  const handleGooglePull = async () => {
    await pullGoogle.mutateAsync({ year });
    refetch();
  };

  if (!canView)
    return (
      <p className="text-gray-500 text-sm">
        You don’t have permission to view holidays.
      </p>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold flex flex-col sm:flex-row sm:items-center gap-2">
          <span>Holiday Management</span>
          {!canCreate &&
            !canUpdate &&
            !canDelete &&
            !canImport &&
            !canExport &&
            !canSync && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Lock size={12} /> View-only access
              </span>
            )}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 px-3 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Action Buttons - Stack vertically on very small screens */}
          <div className="flex flex-wrap gap-2">
            {canSync && (
              <button
                onClick={handleGooglePull}
                className="btn flex items-center justify-center gap-2 min-w-[110px]"
                disabled={pullGoogle.isPending}
              >
                <RefreshCw className={`w-4 h-4 ${pullGoogle.isPending ? "animate-spin" : ""}`} />
                <span className="hidden xs:inline">
                  {pullGoogle.isPending ? "Syncing…" : "Sync Calendar"}
                </span>
                <span className="xs:hidden">Sync</span>
              </button>
            )}

            {canImport && (
              <>
                <button
                  onClick={handleImportClick}
                  className="btn flex items-center justify-center gap-1 min-w-[100px]"
                  disabled={importHolidays.isPending}
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden xs:inline">
                    {importHolidays.isPending ? "Importing…" : "Import"}
                  </span>
                  <span className="xs:hidden">Import</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImportChange}
                />
              </>
            )}

            {canExport && (
              <button
                onClick={handleExport}
                className="btn flex items-center justify-center gap-1 min-w-[100px]"
                disabled={exportHolidays.isPending}
              >
                <Download className="w-4 h-4" />
                <span className="hidden xs:inline">
                  {exportHolidays.isPending ? "Exporting…" : "Export"}
                </span>
                <span className="xs:hidden">Export</span>
              </button>
            )}

            {canCreate && (
              <button
                onClick={() => {
                  setEditing(null);
                  setOpenForm(true);
                }}
                className="btn-primary flex items-center justify-center gap-1 min-w-[120px]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Add Holiday</span>
                <span className="xs:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-white shadow rounded overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm font-medium text-gray-700">
            Holidays for {year}
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading holidays…</div>
        ) : holidays.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No holidays found for {year}.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 pb-4">
            {/* Touch-friendly horizontal scroll hint */}
            <div className="min-w-full text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-gray-600 uppercase text-xs tracking-wider">
                    <th className="py-3 px-4 font-medium">Name</th>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {holidays.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {h.name}
                      </td>
                      <td className="py-4 px-4 text-gray-700">{h.date}</td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center items-center gap-4">
                          {canUpdate && (
                            <button
                              onClick={() => {
                                setEditing(h);
                                setOpenForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              aria-label="Edit holiday"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(h)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              aria-label="Delete holiday"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                          {!canUpdate && !canDelete && (
                            <span className="text-xs text-gray-400">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination - New Design (Matching EmployeesList style) */}
      {data?.paginationMetaInfo && data.paginationMetaInfo.totalPages > 1 && (
        <div className="mt-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col items-center gap-4">
              {/* Buttons Row - Always horizontal */}
              <div className="flex items-center justify-center gap-6 w-full max-w-md">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  ← Previous
                </button>

                <button
                  onClick={() => setPage(p => Math.min(data.paginationMetaInfo.totalPages, p + 1))}
                  disabled={page === data.paginationMetaInfo.totalPages}
                  className="px-6 py-2.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  Next →
                </button>
              </div>

              {/* Page Info - Centered below buttons */}
              <span className="text-sm font-medium text-gray-600">
                Page {data.paginationMetaInfo.currentPage} of {data.paginationMetaInfo.totalPages}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit Dialog */}
      {(canCreate || canUpdate) && (
        <FormDialog
          open={openForm}
          title={editing ? "Edit Holiday" : "Add Holiday"}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={editing?.name}
                required
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                defaultValue={editing?.date}
                required
                className="input w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setOpenForm(false)}
                className="btn order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary order-1 sm:order-2"
                disabled={createHoliday.isPending || updateHoliday.isPending}
              >
                {editing
                  ? updateHoliday.isPending
                    ? "Updating…"
                    : "Update"
                  : createHoliday.isPending
                  ? "Creating…"
                  : "Create"}
              </button>
            </div>
          </form>
        </FormDialog>
      )}

      {/* Delete Confirm */}
      {canDelete && deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Holiday"
          description={`Delete "${deleteTarget.name}" on ${deleteTarget.date}?`}
          confirmLabel="Delete"
          danger
          isLoading={deleteHoliday.isPending}
          onConfirm={async () => {
            await deleteHoliday.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            refetch();
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}