// ---------------------------
// RoleList.tsx (Full Updated File - Mobile Responsive + Enhanced Desktop)
// ---------------------------
import { useEffect, useMemo, useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "../../../../components/ui/DataTable";
import {
  useRoles,
  useDeleteRole,
  useCreateRole,
  useUpdateRole,
} from "./hooks";
import { Trash2, Pencil, Plus, Loader2, Lock, Globe } from "lucide-react";
import { APP_CONFIG } from "../../../../config/appConfig";
import FormDialog from "../../../../components/ui/FormDialog";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import { useCan } from "../../../../utils/permissions";
import { useAuth } from "../../../auth/AuthProvider";

type Row = {
  id: string;
  name: string;
  slug: string;
  permissions?: string[];
};

/* ---------------- Debounce ---------------- */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function RoleList() {
  const can = useCan();
  const { profile } = useAuth();

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
    ? [profile.roles]
    : [];

  const loggedInSlugs = roles.map((r: any) => r.slug);
  const isLoggedInAdmin = loggedInSlugs.includes("admin");

  // 🔒 HARD BLOCK: Only admin slug can see this page
  if (!isLoggedInAdmin) {
    return (
      <div className="p-10 text-center text-red-600 font-medium text-lg">
        Access denied. Only Admin can manage roles.
      </div>
    );
  }

  const canView = can("roles:view");
  const canCreate = can("roles:create");
  const canUpdate = can("roles:update");
  const canDelete = can("roles:delete");

  if (!canView)
    return (
      <p className="text-gray-500 text-sm">
        You don’t have permission to view roles.
      </p>
    );

  const inputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 350);
  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isFetching, isLoading, refetch } = useRoles(
    page,
    limit,
    debouncedSearch
  );

  const del = useDeleteRole();
  const createRole = useCreateRole();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const updateRole = useUpdateRole(editing?.id || "");

  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [ownModeGroups, setOwnModeGroups] = useState<Record<string, boolean>>(
    {}
  );

  /* ---------------- When editing changes ---------------- */
  useEffect(() => {
    const perms = editing?.permissions || [];
    setSelectedPermissions(perms);

    const mode: Record<string, boolean> = {};
    APP_CONFIG.PERMISSION_GROUPS.forEach((g) => {
      const groupPerms = perms.filter((p) => p.startsWith(`${g.name}:`));
      if (groupPerms.length === 0) mode[g.name] = false;
      else mode[g.name] = groupPerms.every((p) =>
        p.endsWith("_own_record_only")
      );
    });

    setOwnModeGroups(mode);
  }, [editing]);

  /* ---------------- Permission Logic Helpers ---------------- */
  const disablePermissionUI = editing?.slug === "admin";

  const toggleGroup = (groupName: string, allChildren: string[]) => {
    if (disablePermissionUI) return;

    const groupChecked = isGroupChecked(groupName, allChildren);
    const ownMode = ownModeGroups[groupName];

    const mappedChildren = allChildren.map((c) =>
      ownMode ? `${groupName}:${c}_own_record_only` : `${groupName}:${c}`
    );

    if (groupChecked) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !mappedChildren.includes(p))
      );
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...mappedChildren])]);
    }
  };

  const togglePermission = (groupName: string, perm: string) => {
    if (disablePermissionUI) return;

    const ownMode = ownModeGroups[groupName];
    const actual = ownMode
      ? `${groupName}:${perm}_own_record_only`
      : `${groupName}:${perm}`;

    const opposite = ownMode
      ? `${groupName}:${perm}`
      : `${groupName}:${perm}_own_record_only`;

    setSelectedPermissions((prev) =>
      prev.includes(actual)
        ? prev.filter((p) => p !== actual)
        : [...prev.filter((p) => p !== opposite), actual]
    );
  };

  const isGroupChecked = (groupName: string, allChildren: string[]) => {
    const ownMode = ownModeGroups[groupName];
    const mappedChildren = allChildren.map((c) =>
      ownMode ? `${groupName}:${c}_own_record_only` : `${groupName}:${c}`
    );
    return mappedChildren.every((p) => selectedPermissions.includes(p));
  };

  const isChildChecked = (groupName: string, perm: string) => {
    const ownMode = ownModeGroups[groupName];
    const actual = ownMode
      ? `${groupName}:${perm}_own_record_only`
      : `${groupName}:${perm}`;
    return selectedPermissions.includes(actual);
  };

  const handleOwnToggle = (groupName: string) => {
    if (disablePermissionUI) return;

    const newOwn = !ownModeGroups[groupName];
    setOwnModeGroups((prev) => ({ ...prev, [groupName]: newOwn }));

    setSelectedPermissions((prev) => {
      const group = APP_CONFIG.PERMISSION_GROUPS.find(
        (g) => g.name === groupName
      );
      if (!group) return prev;

      const updated = prev.filter((p) => !p.startsWith(groupName + ":"));
      const baseSelected = group.children
        .filter(
          (c) =>
            prev.some(
              (p) =>
                p === `${groupName}:${c}` ||
                p === `${groupName}:${c}_own_record_only`
            )
        )
        .map((c) =>
          newOwn ? `${groupName}:${c}_own_record_only` : `${groupName}:${c}`
        );

      return [...updated, ...baseSelected];
    });
  };

  /* ---------------- Submit Form ---------------- */
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canCreate && !canUpdate) return;

    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const slug = (fd.get("slug") as string).toLowerCase().replace(/\s+/g, "-");

    let permissions = selectedPermissions;

    // 🔒 HARD PROTECTION: Admin role always gets ALL permissions.
    if (editing?.slug === "admin") {
      permissions = APP_CONFIG.PERMISSION_GROUPS.flatMap((g) =>
        g.children.map((c) => `${g.name}:${c}`)
      );
    }

    const input = { name, slug, permissions };

    if (editing) {
      if (!canUpdate) return;
      await updateRole.mutateAsync(input);
    } else {
      if (!canCreate) return;
      await createRole.mutateAsync(input);
    }

    setOpenForm(false);
    setEditing(null);
    setSelectedPermissions([]);
    setOwnModeGroups({});
    refetch();
  };

  /* ---------------- Enhanced Desktop Columns ---------------- */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ getValue }) => (
          <span className="font-semibold text-gray-900">{getValue() as string}</span>
        ),
      },
      {
        header: "Slug",
        accessorKey: "slug",
        cell: ({ getValue }) => (
          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
            {getValue() as string}
          </code>
        ),
      },
      {
        header: "Permissions",
        accessorKey: "permissions",
        cell: ({ getValue }) => {
          const perms = getValue() as string[] | undefined;
          if (!perms || perms.length === 0)
            return <span className="text-gray-400 text-sm italic">No permissions</span>;
          return (
            <span className="text-sm text-gray-700">
              {perms.length} permission{perms.length !== 1 ? "s" : ""}
            </span>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-6">
            {canUpdate && (
              <button
                type="button"
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                title="Edit Role"
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
                title="Delete Role"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            {!canUpdate && !canDelete && (
              <span className="text-xs text-gray-400">No actions</span>
            )}
          </div>
        ),
      },
    ],
    [canUpdate, canDelete]
  );

  if (isLoading)
    return <div className="p-8 text-center text-gray-500">Loading roles…</div>;

  const rows = (data?.roles ?? []) as Row[];
  const total = data?.paginationMetaInfo?.totalCount ?? rows.length;
  const totalPages = Math.ceil(total / limit);

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold flex flex-col sm:flex-row sm:items-center gap-2">
          <span>Roles</span>
          {!canUpdate && !canDelete && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Lock size={12} /> View-only access
            </span>
          )}
        </h1>

        {/* Search + New Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              className="w-full h-10 pl-4 pr-10 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="Search roles..."
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
                setSelectedPermissions([]);
                setOwnModeGroups({});
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
          <p className="text-lg">No roles found</p>
          <p className="text-sm mt-2">Try adjusting your search.</p>
        </div>
      ) : (
        <>
          {/* Desktop: Enhanced Table */}
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
                    <p className="text-sm text-gray-600 mt-1">
                      Slug: <span className="font-medium">{row.slug}</span>
                    </p>
                    {row.permissions && row.permissions.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {row.permissions.length} permission{row.permissions.length !== 1 ? "s" : ""}
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
                        aria-label="Edit role"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(row)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        aria-label="Delete role"
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

            {/* MOBILE PAGINATION */}
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

      {/* Add/Edit Dialog - Horizontal buttons */}
      {(canCreate || canUpdate) && (
        <FormDialog
          open={openForm}
          title={editing ? "Edit Role" : "Add Role"}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
            setSelectedPermissions([]);
            setOwnModeGroups({});
          }}
        >
          <form onSubmit={handleFormSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={editing?.name}
                required
                placeholder="e.g., Manager"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                defaultValue={editing?.slug}
                required
                placeholder="e.g., manager"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base"
              />
            </div>

            {/* Permissions UI */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-800">
                Permissions
              </label>

              {disablePermissionUI && (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                  The "admin" role has full access and cannot be modified.
                </p>
              )}

              <div className="max-h-96 overflow-y-auto border rounded-lg bg-gray-50 p-4 space-y-4">
                {APP_CONFIG.PERMISSION_GROUPS.map((group) => {
                  const groupChecked = isGroupChecked(group.name, group.children);
                  const indeterminate =
                    !groupChecked &&
                    group.children.some((c) =>
                      isChildChecked(group.name, c)
                    );
                  const ownMode = ownModeGroups[group.name] || false;

                  return (
                    <div
                      key={group.name}
                      className={`border rounded-lg p-4 transition-all ${
                        ownMode
                          ? "bg-blue-50 border-blue-300"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <label className="flex items-center gap-3 font-medium text-base">
                          <input
                            type="checkbox"
                            checked={groupChecked}
                            disabled={disablePermissionUI}
                            ref={(el) => {
                              if (el) el.indeterminate = indeterminate;
                            }}
                            onChange={() =>
                              !disablePermissionUI &&
                              toggleGroup(group.name, group.children)
                            }
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
                          />
                          <span>{group.name}</span>
                        </label>

                        <button
                          type="button"
                          disabled={disablePermissionUI}
                          onClick={() => handleOwnToggle(group.name)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition ${
                            ownMode
                              ? "bg-blue-100 border-blue-400 text-blue-700"
                              : "bg-gray-100 border-gray-300 text-gray-600"
                          } ${disablePermissionUI ? "opacity-50" : "hover:bg-opacity-80"}`}
                        >
                          {ownMode ? (
                            <>
                              <Lock className="w-4 h-4" /> Own Records
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4" /> All Records
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                        {group.children.map((child) => (
                          <label
                            key={child}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={isChildChecked(group.name, child)}
                              disabled={disablePermissionUI}
                              onChange={() =>
                                !disablePermissionUI &&
                                togglePermission(group.name, child)
                              }
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{child.replace(/_/g, " ")}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buttons - Horizontal side-by-side */}
            <div className="flex flex-row justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setOpenForm(false);
                  setEditing(null);
                  setSelectedPermissions([]);
                  setOwnModeGroups({});
                }}
                className="flex-1 sm:flex-initial min-w-0 px-6 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition-colors text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial min-w-0 px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-lg font-medium transition-colors text-base"
                disabled={createRole.isPending || updateRole.isPending}
              >
                {editing
                  ? updateRole.isPending
                    ? "Updating…"
                    : "Update"
                  : createRole.isPending
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
          title="Delete Role"
          description={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
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