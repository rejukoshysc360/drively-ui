import React, { useEffect, useState } from "react";
import { useOrganization, useUpdateOrganizationSettings } from "./hooks";
import { Pencil, Trash2, Plus, Lock } from "lucide-react";
import { useCan } from "../../../../utils/permissions";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";

type CompType = {
  id: string;
  name: string;
  sumup?: boolean;
  is_basic?: boolean;
  allow_overlap?: boolean;
  is_from_expense_tracker?: boolean;
};

export default function CompensationSettingsSection() {
  const { data: org, isLoading } = useOrganization();
  const updateOrg = useUpdateOrganizationSettings();
  const can = useCan();

  const canView = can("organization:view");
  const canUpdate = can("organization:update");

  const [types, setTypes] = useState<CompType[]>([]);
  const [newType, setNewType] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false); // ✅ NEW: prevent concurrent checkbox clicks

  // Delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<CompType | null>(null);

  // ✅ Safely load & deduplicate types when org changes
  useEffect(() => {
    if (org?.compensation_settings?.types) {
      const unique = Array.from(
        new Map(
          org.compensation_settings.types.map((t: any) => [t.id || t.name, t])
        ).values()
      );

      setTypes(
        unique.map((t: any) => ({
          id: t.id,
          name: t.name,
          sumup: !!t.sumup,
          is_basic: !!t.is_basic,
          allow_overlap: !!t.allow_overlap,
          is_from_expense_tracker: !!t.is_from_expense_tracker,
        }))
      );
    }
  }, [org]);

  if (!canView)
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-base">
          You don’t have permission to view compensation settings.
        </p>
      </div>
    );

  // Helper to call mutation safely
  const safeMutate = (payload: any) => {
    if (!canUpdate) return Promise.resolve();
    return updateOrg.mutateAsync({ compensation_settings: payload });
  };

  const handleToggleBasic = async (id: string) => {
    if (!canUpdate || toggleLoading) return;
    setToggleLoading(true);
    try {
      const updated = types.map((t) => ({
        ...t,
        is_basic: t.id === id ? !t.is_basic : false,
      }));
      setTypes(updated);
      await safeMutate({ types: updated });
    } finally {
      setToggleLoading(false);
    }
  };

  const handleToggleSumup = async (id: string) => {
    if (!canUpdate || toggleLoading) return;
    setToggleLoading(true);
    try {
      const updated = types.map((t) =>
        t.id === id ? { ...t, sumup: !t.sumup } : t
      );
      setTypes(updated);
      await safeMutate({ types: updated });
    } finally {
      setToggleLoading(false);
    }
  };

  const handleToggleAllowOverlap = async (id: string) => {
    if (!canUpdate || toggleLoading) return;
    setToggleLoading(true);
    try {
      const updated = types.map((t) =>
        t.id === id ? { ...t, allow_overlap: !t.allow_overlap } : t
      );
      setTypes(updated);
      await safeMutate({ types: updated });
    } finally {
      setToggleLoading(false);
    }
  };

  const handleToggleExpenseTracker = async (id: string) => {
    if (!canUpdate || toggleLoading) return;
    setToggleLoading(true);
    try {
      const updated = types.map((t) =>
        t.id === id
          ? { ...t, is_from_expense_tracker: !t.is_from_expense_tracker }
          : { ...t, is_from_expense_tracker: false } // ✅ only one allowed at a time
      );
      setTypes(updated);
      await safeMutate({ types: updated });
    } finally {
      setToggleLoading(false);
    }
  };

  // ✅ Fixed Add logic (no double-adds)
  const handleAdd = async () => {
    if (addLoading || !canUpdate) return;
    const clean = newType.trim();
    if (!clean) return;

    setAddLoading(true);
    setNewType("");

    try {
      await safeMutate({ types: [{ name: clean }] });
      // React Query refetch will refresh state automatically
    } catch (err) {
      console.error("Add failed:", err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditStart = (type: CompType) => {
    if (!canUpdate) return;
    setEditingId(type.id);
    setEditValue(type.name);
  };

  const handleEditSave = async (id: string) => {
    if (!canUpdate) return;
    const clean = editValue.trim();
    if (!clean) return;

    const updated = types.map((t) => (t.id === id ? { ...t, name: clean } : t));
    setTypes(updated);
    await safeMutate({ types: [{ id, name: clean }] });
    setEditingId(null);
    setEditValue("");
  };

  const handleDeleteClick = (type: CompType) => {
    if (!canUpdate) return;
    setTypeToDelete(type);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    setDeleteLoading(true);

    try {
      await safeMutate({
        types: [{ id: typeToDelete.id, deleted: true }],
      });

      setTypes((prev) => prev.filter((t) => t.id !== typeToDelete.id));
      setConfirmOpen(false);
      setTypeToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading)
    return <p className="text-gray-500">Loading compensation settings…</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Employee Compensation Component
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Add, rename, or remove employee compensation types (e.g.
                Basic, Bonus, Allowance, Commission).
              </p>
            </div>

            {!canUpdate && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Lock className="w-4 h-4" />
                View-only access
              </div>
            )}
          </div>
        </div>

        {/* Add New Type */}
        {canUpdate && (
          <div className="px-6 pt-5 pb-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="New type (e.g. Housing Allowance)"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={handleAdd}
                disabled={addLoading}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-sm font-medium transition
                  ${
                    addLoading
                      ? "bg-gray-400 cursor-wait text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
              >
                {addLoading ? "Adding..." : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Type
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* List of Types */}
        <div className="p-6 space-y-4">
          {types.length > 0 ? (
            <div className="space-y-4">
              {types.map((t) => (
                <div key={t.id} className="bg-gray-50 rounded-xl p-5 space-y-4">
                  {/* Name + Actions */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {editingId === t.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEditSave(t.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleEditSave(t.id)
                          }
                          className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          autoFocus
                        />
                      ) : (
                        <h4 className="font-medium text-gray-900 text-lg truncate">
                          {t.name}
                        </h4>
                      )}
                    </div>

                    {canUpdate && (
                      <div className="flex items-center gap-3">
                        {editingId !== t.id && (
                          <button
                            onClick={() => handleEditStart(t)}
                            className="p-2 rounded-lg hover:bg-gray-200 transition"
                            title="Edit name"
                          >
                            <Pencil className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(t)}
                          className="p-2 rounded-lg hover:bg-red-100 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>

{/* Normal Checkboxes in Grid */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {!t.name?.toLowerCase().includes("reimb") && (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={!!t.is_basic}
        onChange={() => handleToggleBasic(t.id)}
        disabled={!canUpdate || toggleLoading}
        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
      />
      <span className="text-sm font-medium text-gray-700">Basic Salary</span>
    </label>
  )}

  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={
        t.name?.toLowerCase().includes("reimb") ? true : !!t.sumup
      }
      onChange={() =>
        !t.name?.toLowerCase().includes("reimb") &&
        handleToggleSumup(t.id)
      }
      disabled={
        !canUpdate ||
        toggleLoading ||
        t.name?.toLowerCase().includes("reimb")
      }
      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
    />
    <span className="text-sm font-medium text-gray-700">Sum Up</span>
  </label>

  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={
        t.name?.toLowerCase().includes("reimb") ? true : !!t.allow_overlap
      }
      onChange={() =>
        !t.name?.toLowerCase().includes("reimb") &&
        handleToggleAllowOverlap(t.id)
      }
      disabled={
        !canUpdate ||
        toggleLoading ||
        t.name?.toLowerCase().includes("reimb")
      }
      className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
    />
    <span className="text-sm font-medium text-gray-700">Allow Overlap</span>
  </label>
</div>

{/* 💼 Reimbursement Section */}
{t.name?.toLowerCase().includes("reimb") && (
  <div className="mt-5">
    <div className="border border-purple-200 bg-purple-50 rounded-xl p-4 w-full">
      <h5 className="text-sm font-semibold text-purple-700 mb-3">
        Reimbursement Settings
      </h5>

      <div className="flex items-start sm:items-center gap-3">
        <input
          type="checkbox"
          checked={!!t.is_from_expense_tracker}
          onChange={() => handleToggleExpenseTracker(t.id)}
          disabled={!canUpdate || toggleLoading}
          className="w-5 h-5 mt-1 text-purple-600 rounded focus:ring-purple-500"
        />
        <div>
          <span className="text-sm text-gray-700 font-medium">
            Pull reimbursement data from Expense Tracker
          </span>
          <p className="text-xs text-gray-500 mt-1">
            When enabled, approved and unpaid employee expenses will automatically
            appear in this component during payslip generation.
          </p>
        </div>
      </div>
    </div>
  </div>
)}

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p className="text-base">No compensation types added yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Compensation Type"
        description={
          typeToDelete
            ? `Are you sure you want to delete "${typeToDelete.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (deleteLoading) return;
          setConfirmOpen(false);
          setTypeToDelete(null);
        }}
      />
    </div>
  );
}
