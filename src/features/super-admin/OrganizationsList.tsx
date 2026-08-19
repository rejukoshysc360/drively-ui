import { useEffect, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  useAllOrganizations,
  useDeleteOrganization,
  useUpdateFreeOrganizationStatus,
} from "./hooks";
import { APP_CONFIG } from "../../config/appConfig";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

export default function OrganizationsList() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearch = useDebounce(searchInput.trim(), 350);
  const [statusTarget, setStatusTarget] = useState<any>(null);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const limit = APP_CONFIG.PAGE_SIZE;

  const { data, isLoading, isFetching } = useAllOrganizations(
    page,
    limit,
    debouncedSearch,
  );

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const updateStatus = useUpdateFreeOrganizationStatus();

  const deleteOrganization = useDeleteOrganization();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  if (isLoading) {
    return <div className="p-6">Loading organizations...</div>;
  }

  {
    isFetching && !isLoading && <Loader2 className="w-4 h-4 animate-spin" />;
  }

  const groups = data?.companyGroups || [];

  const totalPages = data?.paginationMetaInfo?.totalPages || 1;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const timer = setTimeout(() => setDebouncedValue(value), delay);

      return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
  }

  const getStatusBadge = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";

      case "authenticated":
        return "bg-blue-100 text-blue-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Organizations</h1>

        <input
          placeholder="Search company group..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full sm:w-80"
        />
      </div>

      {/* Company Groups */}
      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
            No organizations found.
          </div>
        ) : (
          groups.map((group: any) => {
            const expanded = expandedGroups[group.id] ?? true;

            return (
              <div
                key={group.id}
                className="bg-white rounded-xl border overflow-hidden"
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    {expanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}

                    <Building2 className="w-5 h-5 text-indigo-600" />

                    <div className="text-left">
                      <div className="font-semibold">{group.name}</div>

                      <div className="text-xs text-gray-500">
                        {group.organizations?.length} organization(s)
                      </div>
                    </div>
                  </div>
                </button>

                {/* Organizations */}
                {expanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Organization</th>

                          <th className="text-left p-3">Plan</th>

                          <th className="text-left p-3">Status</th>

                          <th className="text-left p-3">Access Until</th>

                          <th className="text-left p-3">Country</th>

                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {group.organizations?.map((org: any) => (
                          <tr key={org.id} className="border-b">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-600" />
                                {org.name}
                              </div>
                            </td>

                            <td className="p-3 capitalize">
                              {org.plan || "free"}
                            </td>

                            <td className="p-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusBadge(
                                  org.subscription_status,
                                )}`}
                              >
                                {org.subscription_status || "inactive"}
                              </span>
                            </td>

                            <td className="p-3">
                              {org.plan?.toLowerCase() === "free"
                                ? "Unlimited"
                                : org.subscription_end_date
                                  ? new Date(
                                      org.subscription_end_date,
                                    ).toLocaleDateString()
                                  : "-"}
                            </td>

                            <td className="p-3">{org.country_code || "-"}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {org.plan?.toLowerCase() === "free" && (
                                  <button
                                    onClick={() => setStatusTarget(org)}
                                    disabled={updateStatus.isPending}
                                    className={`px-3 py-1 rounded text-xs font-medium ${
                                      org.subscription_status === "active"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-green-100 text-green-700"
                                    }`}
                                  >
                                    {org.subscription_status === "active"
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>
                                )}

                                <button
                                  onClick={() => setDeleteTarget(org)}
                                  disabled={deleteOrganization.isPending}
                                  className="px-3 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  <Trash2 className="w-3 h-3 inline mr-1" />
                                  Delete
                                </button>
                                
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="border rounded-lg px-4 py-2 disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="border rounded-lg px-4 py-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <ConfirmDialog
        open={!!statusTarget}
        title={
          statusTarget?.subscription_status === "active"
            ? "Pause Organization"
            : "Activate Organization"
        }
        description={
          statusTarget?.subscription_status === "active"
            ? `Users of "${statusTarget?.name}" will no longer be able to login.`
            : `Users of "${statusTarget?.name}" will be able to login again.`
        }
        confirmLabel={
          statusTarget?.subscription_status === "active" ? "Pause" : "Activate"
        }
        danger={statusTarget?.subscription_status === "active"}
        isLoading={updateStatus.isPending}
        onConfirm={async () => {
          await updateStatus.mutateAsync({
            organizationId: statusTarget.id,
            status:
              statusTarget.subscription_status === "active"
                ? "paused"
                : "active",
          });

          setStatusTarget(null);
        }}
        onClose={() => setStatusTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Organization"
        description={`This will permanently delete "${deleteTarget?.name}" and ALL associated data including employees, profiles, payroll, attendance, projects, subscriptions and Supabase users. This action cannot be undone.`}
        confirmLabel="Delete Organization"
        danger
        isLoading={deleteOrganization.isPending}
        onConfirm={async () => {
          await deleteOrganization.mutateAsync(deleteTarget.id);

          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
