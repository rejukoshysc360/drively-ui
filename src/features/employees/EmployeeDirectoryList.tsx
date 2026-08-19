import { useState, useMemo, useRef, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, Search, Eye } from "lucide-react";
import { useCan } from "../../../src/utils/permissions";
import { useOrganizations } from "../../features/organizations/hooks";
import {
  useDepartmentsByOrgId,
} from "../../features/organizations/settings/departments/hooks";
import {
  useDesignationsByOrgId,
} from "../../features/organizations/settings/designations/hooks";
import { useEmployeesActiveDirectory } from "./hooks";
import DataTable from "../../components/ui/DataTable";
import DirectoryDialog from "./EmployeeDirectoryDialog";
import { APP_CONFIG } from "../../../src/config/appConfig";
import { useAuth } from "../../features/auth/AuthProvider";

// ✅ Local debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function EmployeeDirectoryList() {
  const inputRef = useRef<HTMLInputElement>(null);
  const limit = APP_CONFIG.PAGE_SIZE;
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const { organization_id: authOrganizationId } = useAuth();

  const [organizationId, setOrganizationId] = useState(
    authOrganizationId ?? ""
  );
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");

  const debouncedSearch = useDebounce(searchInput.trim(), 350);

  // Fetch filter data
  const { data: orgData } = useOrganizations(1, 100);
  const { data: deptData } = useDepartmentsByOrgId(organizationId || "", 1, 1000);
  const { data: desigData } = useDesignationsByOrgId(organizationId || "", departmentId, 1, 1000);

  const orgs = orgData?.organizations ?? [];
  const departments = deptData?.departments ?? [];
  const designations = desigData?.designations ?? [];

  useEffect(() => {
    if (authOrganizationId && !organizationId) {
      setOrganizationId(authOrganizationId);
    }
  }, [authOrganizationId]);

  // Employees
  const effectiveOrganizationId = organizationId || authOrganizationId || "";

  const { data, isFetching, isLoading } = useEmployeesActiveDirectory(
    page,
    limit,
    debouncedSearch,
    effectiveOrganizationId,
    departmentId,
    designationId
  );

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      { header: "Name", accessorKey: "full_name" },
      { header: "Email", accessorKey: "email" },
      {
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() => {
              setSelected(row.original);
              setOpenDialog(true);
            }}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Eye className="w-4 h-4" /> View Details
          </button>
        ),
      },
    ],
    []
  ); 

  if (isLoading)
    return <div className="p-8 text-center text-gray-500">Loading employees…</div>;

  const rows = data?.employees ?? [];
  const total = data?.paginationMetaInfo?.totalCount ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Employee Directory</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={organizationId}
            onChange={(e) => {
              setOrganizationId(e.target.value);
              setDepartmentId("");
              setDesignationId("");
            }}
            className="h-10 px-4 rounded-lg border border-gray-300 bg-white shadow-sm"
          >
            <option value="">All Organizations</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}  {o.country_code ? ` (${o.country_code})` : ""}
              </option>
            ))}
          </select>

          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setDesignationId("");
            }}
            className="h-10 px-4 rounded-lg border border-gray-300 bg-white shadow-sm"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={designationId}
            onChange={(e) => setDesignationId(e.target.value)}
            className="h-10 px-4 rounded-lg border border-gray-300 bg-white shadow-sm"
          >
            <option value="">All Designations</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            ref={inputRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search employees..."
            className="w-full h-10 pl-10 pr-10 border rounded-lg shadow-sm border-gray-300"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          {isFetching && (
            <Loader2 className="absolute right-3 top-2.5 w-5 h-5 animate-spin text-gray-400" />
          )}
        </div>
      </div>

      {/* 📱 Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-lg">No employees found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          rows.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between"
            >
              <div className="flex flex-col">
                <h3 className="font-semibold text-base text-gray-900">
                  {emp.full_name}
                </h3>
                <p className="text-sm text-gray-500">{emp.email || "—"}</p>
              </div>
              <button
                onClick={() => {
                  setSelected(emp);
                  setOpenDialog(true);
                }}
                className="mt-3 sm:mt-0 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 self-start sm:self-end"
              >
                <Eye className="w-4 h-4" /> View Details
              </button>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {total > limit && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </button>

              <span className="text-sm font-medium text-gray-700">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || isFetching}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 💻 Desktop Table */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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

      {/* Details Dialog */}
      {openDialog && selected && (
        <DirectoryDialog
          open={openDialog}
          employee={selected}
          onClose={() => {
            setOpenDialog(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
