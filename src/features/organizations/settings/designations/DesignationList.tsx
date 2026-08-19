import { useEffect, useMemo, useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "../../../../components/ui/DataTable";
import {
  useDesignations,
  useDeleteDesignation,
  useCreateDesignation,
  useUpdateDesignation,
} from "./hooks";
import { useDepartments } from "../departments/hooks";
import { Trash2, Pencil, Plus, Loader2, Lock } from "lucide-react";
import { APP_CONFIG } from "../../../../config/appConfig";
import FormDialog from "../../../../components/ui/FormDialog";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import { useCan } from "../../../../utils/permissions";

type Row = {
  id: string;
  department_id: string;
  title: string;
  description?: string | null;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function DesignationList() {
  const inputRef = useRef<HTMLInputElement>(null);

  const can = useCan();
  const canView = can("designations:view");
  const canCreate = can("designations:create");
  const canUpdate = can("designations:update");
  const canDelete = can("designations:delete");

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 350);

  const { data: deptData } = useDepartments(1, 1000);
  const departments = deptData?.departments ?? [];
  const firstDeptId = departments.length > 0 ? departments[0].id : "";

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const [selectedDeptId, setSelectedDeptId] = useState<string>(firstDeptId);

  useEffect(() => {
    if (!selectedDeptId && departments.length > 0) {
      setSelectedDeptId(departments[0].id);
    }
  }, [departments, selectedDeptId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedDeptId]);

  const { data, isFetching, isLoading, refetch } = useDesignations(
    selectedDeptId,
    page,
    limit,
    debouncedSearch
  );

  const createDesignation = useCreateDesignation(selectedDeptId);
  const updateDesignation = useUpdateDesignation(selectedDeptId, editing?.id || "");
  const del = useDeleteDesignation(selectedDeptId);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreate && !canUpdate) return;

    const fd = new FormData(e.currentTarget);
    const deptId = fd.get("department_id") as string | null;
    if (!deptId) {
      alert("Please select a department");
      return;
    }

    const input = {
      department_id: deptId,
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
    };

    if (editing) {
      if (!canUpdate) return;
      await updateDesignation.mutateAsync(input);
    } else {
      if (!canCreate) return;
      await createDesignation.mutateAsync(input);
    }

    setOpenForm(false);
    setEditing(null);
    e.currentTarget.reset();
    refetch();
  };

  const columns: ColumnDef<Row>[] = useMemo(() => {
    const cols: ColumnDef<Row>[] = [
      {
        header: "Department",
        accessorKey: "department_id",
        cell: ({ getValue }) => {
          const dept = departments.find((d) => d.id === getValue());
          return dept ? dept.name || dept.title : "-";
        },
      },
      { header: "Name", accessorKey: "title" },
      { header: "Description", accessorKey: "description" },
    ];

    cols.push({
      header: "Actions",
      cell: ({ row }) => {
        const disableAll = !canUpdate && !canDelete;
        if (disableAll)
          return (
            <span className="text-xs text-gray-400 italic">
              Restricted Access
            </span>
          );

        return (
          <div className="flex justify-center gap-4">
            {canUpdate && (
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Edit"
                onClick={() => {
                  setEditing(row.original);
                  setSelectedDeptId(row.original.department_id);
                  setOpenForm(true);
                }}
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Delete"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        );
      },
    });

    return cols;
  }, [departments, canUpdate, canDelete]);

  if (!canView)
    return (
      <p className="text-gray-500 text-sm">
        You don’t have permission to view designations.
      </p>
    );

  if (isLoading)
    return <div className="p-8 text-center text-gray-500">Loading designations…</div>;

  const rows = (data?.designations ?? []) as Row[];
  const total = data?.paginationMetaInfo?.totalCount ?? rows.length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold flex flex-col sm:flex-row sm:items-center gap-2">
          <span>Designations</span>
          {!canUpdate && !canDelete && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Lock size={12} /> View-only access
            </span>
          )}
        </h1>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              setPage(1);
            }}
            className="h-10 px-4 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || d.title}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                className="w-full h-10 pl-4 pr-10 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                placeholder="Search designations..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                type="search"
              />
              {isFetching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
              )}
            </div>

            {canCreate && (
              <button
                onClick={() => {
                  setEditing(null);
                  setOpenForm(true);
                }}
                className="btn-primary flex items-center justify-center gap-2 px-5 h-10"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content: Empty, Desktop Table, or Mobile Cards + Pagination */}
      {rows.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-lg">No designations found</p>
          <p className="text-sm mt-2">Try changing the department filter or search term.</p>
        </div>
      ) : (
        <>
          {/* Desktop: Full DataTable */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <DataTable
                data={rows}
                columns={columns}
                total={total}
                page={page}
                limit={limit}
                onPageChange={setPage}
                isFetching={isFetching}
              />
            </div>
          </div>

          {/* Mobile: Card List + Pagination */}
          <div className="block lg:hidden space-y-4">
            {rows.map((row) => {
              const dept = departments.find((d) => d.id === row.department_id);
              const deptName = dept ? dept.name || dept.title : "Unknown Department";

              return (
                <div
                  key={row.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {row.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Department: <span className="font-medium">{deptName}</span>
                      </p>
                      {row.description && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          {row.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4 ml-4">
                      {canUpdate && (
                        <button
                          onClick={() => {
                            setEditing(row);
                            setSelectedDeptId(row.department_id);
                            setOpenForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          aria-label="Edit designation"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(row)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          aria-label="Delete designation"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      {!canUpdate && !canDelete && (
                        <span className="text-xs text-gray-400">No actions</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* MOBILE PAGINATION - Identical to EmployeesList */}
            {total > limit && (
              <div className="mt-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isFetching}
                      className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      ← Previous
                    </button>

                    <span className="text-sm font-medium text-gray-700">
                      Page {page} of {totalPages}
                    </span>

                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages || isFetching}
                      className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      {/* Add/Edit Dialog - Buttons always side-by-side (horizontal) */}
      {(canCreate || canUpdate) && (
        <FormDialog
          open={openForm}
          title={editing ? "Edit Designation" : "Add Designation"}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleFormSubmit} className="space-y-6 max-w-lg mx-auto">
            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                name="department_id"
                defaultValue={editing?.department_id || selectedDeptId || ""}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
                onChange={(e) => setSelectedDeptId(e.target.value)}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                name="title"
                defaultValue={editing?.title}
                required
                placeholder="e.g., Senior Developer"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                defaultValue={editing?.description || ""}
                rows={5}
                placeholder="Brief role description..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base resize-none"
              />
            </div>

            {/* Buttons - Always horizontal, side-by-side */}
            <div className="flex flex-row justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setOpenForm(false);
                  setEditing(null);
                }}
                className="flex-1 sm:flex-initial min-w-0 px-6 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition-colors text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial min-w-0 px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-lg font-medium transition-colors text-base"
                disabled={createDesignation.isPending || updateDesignation.isPending}
              >
                {editing
                  ? updateDesignation.isPending
                    ? "Updating…"
                    : "Update"
                  : createDesignation.isPending
                  ? "Creating…"
                  : "Create"}
              </button>
            </div>
          </form>
        </FormDialog>
      )}
      {/* Delete Confirmation */}
      {canDelete && deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Designation"
          description={`Are you sure you want to delete "${deleteTarget.title}"?`}
          confirmLabel="Delete"
          danger
          isLoading={del.isPending}
          onConfirm={async () => {
            await del.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            refetch();
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}