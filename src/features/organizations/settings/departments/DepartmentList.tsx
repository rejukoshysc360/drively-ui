import { useEffect, useMemo, useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "../../../../components/ui/DataTable";
import {
  useDepartments,
  useDeleteDepartment,
  useCreateDepartment,
  useUpdateDepartment,
} from "./hooks";
import { Trash2, Pencil, Plus, Loader2, Lock } from "lucide-react";
import { APP_CONFIG } from "../../../../config/appConfig";
import FormDialog from "../../../../components/ui/FormDialog";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import { useCan } from "../../../../utils/permissions";

type Row = {
  id: string;
  name: string;
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

export default function DepartmentList() {
  const inputRef = useRef<HTMLInputElement>(null);

  const can = useCan();
  const canView = can("departments:view");
  const canCreate = can("departments:create");
  const canUpdate = can("departments:update");
  const canDelete = can("departments:delete");

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 350);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isFetching, isLoading, refetch } = useDepartments(
    page,
    limit,
    debouncedSearch
  );

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment(editing?.id || "");
  const del = useDeleteDepartment();

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreate && !canUpdate) return;

    const fd = new FormData(e.currentTarget);
    const input = {
      name: fd.get("name") as string,
      description: (fd.get("description") as string) || undefined,
    };

    if (editing) {
      if (!canUpdate) return;
      await updateDepartment.mutateAsync(input);
    } else {
      if (!canCreate) return;
      await createDepartment.mutateAsync(input);
    }

    setOpenForm(false);
    setEditing(null);
    e.currentTarget.reset();
    refetch();
  };

  const columns: ColumnDef<Row>[] = useMemo(() => {
    const baseCols: ColumnDef<Row>[] = [
      { header: "Name", accessorKey: "name" },
      { header: "Description", accessorKey: "description" },
    ];

    baseCols.push({
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

    return baseCols;
  }, [canUpdate, canDelete]);

  if (!canView)
    return (
      <p className="text-gray-500 text-sm">
        You don’t have permission to view departments.
      </p>
    );

  if (isLoading)
    return <div className="p-8 text-center text-gray-500">Loading departments…</div>;

  const rows = (data?.departments ?? []) as Row[];
  const total = data?.paginationMetaInfo?.totalCount ?? rows.length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold flex flex-col sm:flex-row sm:items-center gap-2">
          <span>Departments</span>
          {!canUpdate && !canDelete && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Lock size={12} /> View-only access
            </span>
          )}
        </h1>

        {/* Search + Add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              className="w-full h-10 pl-4 pr-10 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="Search departments..."
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

      {/* Empty State or List/Table */}
      {rows.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-lg">No departments found</p>
          <p className="text-sm mt-2">Try adjusting your search.</p>
        </div>
      ) : (
        <>
          {/* Desktop: DataTable */}
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
            {rows.map((row) => (
              <div
                key={row.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {row.name}
                    </h3>
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
                          setOpenForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        aria-label="Edit department"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(row)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        aria-label="Delete department"
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
            ))}

            {/* MOBILE PAGINATION - Same as EmployeesList */}
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

      {/* Add/Edit Dialog - Buttons side-by-side horizontally */}
      {(canCreate || canUpdate) && (
        <FormDialog
          open={openForm}
          title={editing ? "Edit Department" : "Add Department"}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleFormSubmit} className="space-y-6 max-w-lg mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={editing?.name}
                required
                placeholder="e.g., Engineering"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                defaultValue={editing?.description || ""}
                rows={5}
                placeholder="Brief department overview..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base resize-none"
              />
            </div>

            {/* Buttons - Always side-by-side horizontally */}
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
                disabled={createDepartment.isPending || updateDepartment.isPending}
              >
                {editing
                  ? updateDepartment.isPending
                    ? "Updating…"
                    : "Update"
                  : createDepartment.isPending
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
          title="Delete Department"
          description={`Are you sure you want to delete "${deleteTarget.name}"?`}
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