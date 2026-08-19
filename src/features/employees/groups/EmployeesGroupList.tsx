import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "../../../components/ui/DataTable";
import FormDialog from "../../../components/ui/FormDialog";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useAssignableEmployeesByOrgId, useEmployeesbyOrgId } from "../../employees/hooks";
import { useAuth } from "../../auth/AuthProvider";
import {
  useCreateEmployeeGroup,
  useDeleteEmployeeGroup,
  useEmployeeGroups,
  useUpdateEmployeeGroup,
} from "./hooks";
import { useOrganizations } from "../../../features/organizations/hooks";

type Group = {
  id: string;
  name: string;
  description?: string;
  employee_ids: string[];
  organization_id: string;
};

export default function EmployeesGroupList() {
  const { organization_id } = useAuth();

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useEmployeeGroups(page, limit);
  const groups = data?.groups ?? [];

  const createMutation = useCreateEmployeeGroup();
  const updateMutation = useUpdateEmployeeGroup();
  const deleteMutation = useDeleteEmployeeGroup();

  // Organizations
  const { data: orgsData } = useOrganizations(1, 100);
  const organizations = orgsData?.organizations ?? [];

  // Selected org (only for filtering employees UI)
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    organization_id || ""
  );

  // Employees per org
  const {
    data: empData,
    isLoading: employeesLoading,
  } = useAssignableEmployeesByOrgId(1, 1000, selectedOrgId);

  const employees = empData?.employees ?? [];

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  // ✅ FIX: single source of truth
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!selectedOrgId) {
      alert("Please select an organization");
      return;
    }

    const payload = {
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      employee_ids: selectedEmployees, // ✅ FIXED
      organization_id: selectedOrgId,
    };

    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        ...payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setOpenForm(false);
    setEditing(null);
    setSelectedEmployees([]); // reset after submit
  };

  const columns: ColumnDef<Group>[] = useMemo(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Description", accessorKey: "description" },
      {
        header: "Members",
        cell: ({ row }) => row.original.employee_ids?.length || 0,
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditing(row.original);

                // ✅ preload ALL selected employees
                setSelectedEmployees(row.original.employee_ids || []);

                setSelectedOrgId(row.original.organization_id);
                setOpenForm(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button onClick={() => setDeleteTarget(row.original)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Employee Groups</h1>

        <button
          onClick={() => {
            setEditing(null);
            setSelectedOrgId(organization_id || "");
            setSelectedEmployees([]);
            setOpenForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Group
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={groups}
        columns={columns}
        page={page}
        limit={limit}
        total={data?.paginationMetaInfo?.totalCount ?? 0}
        onPageChange={setPage}
      />

      {/* Form Dialog */}
      <FormDialog
        open={openForm}
        title={editing ? "Edit Group" : "Create Group"}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">Select organization</option>
              {organizations.map((org: any) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <input
            name="name"
            defaultValue={editing?.name}
            placeholder="Group name"
            className="input w-full"
            required
          />

          {/* Description */}
          <textarea
            name="description"
            defaultValue={editing?.description}
            placeholder="Description"
            className="input w-full"
          />

          {/* Employees */}
          <div className="max-h-60 overflow-y-auto border rounded p-2">
            {!selectedOrgId ? (
              <p className="text-sm text-gray-500">
                Select organization first
              </p>
            ) : employeesLoading ? (
              <p className="text-sm text-gray-500">Loading employees...</p>
            ) : employees.length === 0 ? (
              <p className="text-sm text-gray-500">
                No employees found
              </p>
            ) : (
              employees.map((e: any) => (
                <label
                  key={e.id}
                  className="flex items-center gap-2 py-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(e.id)}
                    onChange={() => toggleEmployee(e.id)}
                  />
                  {e.full_name}
                </label>
              ))
            )}
          </div>

          {/* Submit */}
          <button className="btn-primary w-full">
            {editing ? "Update Group" : "Create Group"}
          </button>
        </form>
      </FormDialog>

      {/* Delete Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Group"
          description={`Delete "${deleteTarget.name}"?`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}