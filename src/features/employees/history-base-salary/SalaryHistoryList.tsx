import React, { useMemo, useState } from "react";
import { useSalaryHistory, useDeleteSalary, useUpdateSalary } from "./hooks";
import { Pencil, Trash2, Save, X, Mail } from "lucide-react";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import { emitApiError } from "../../../lib/error-bus";
import { useAuth } from "../../auth/AuthProvider";
import { useSendEmailTemplate } from "../../email-templates/hooks";
import ConfirmDialog from "../../../components/ui/ConfirmDialog"; // ← Already imported
import { emitSuccess } from "../../../lib/success-bus";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  employeeId: string;
  currency: string;
  employee?: { full_name?: string; email?: string; hire_date: string };
  canUpdate?: boolean;
  canDelete?: boolean;
  canSendEmail?: boolean;
};

export default function SalaryHistoryTableList({
  employeeId,
  currency,
  employee,
  canUpdate = false,
  canDelete = false,
  canSendEmail = false,
}: Props) {
  const { data: org, isLoading: orgLoading } = useOrganization();

  const { organization_id , profile } = useAuth();

  const userRoleSlug = profile?.roles?.slug || "";
  const isEmployee = userRoleSlug === "emp";

  const isManager = userRoleSlug === "manager"; // adjust slug if different

   const canToggleAmounts = isEmployee || isManager;

  const [showAmounts, setShowAmounts] = useState(!canToggleAmounts); 

 
  const isSelfViewEmployee = isEmployee && profile?.id?.toString() === employeeId?.toString();

  const sendEmail = useSendEmailTemplate(organization_id!);

  const typeOptions = useMemo(() => {
    const list = org?.compensation_settings?.types ?? [];
    return list
      .filter((t: any) => !t.deleted)
      .map((t: any) => ({
        id: String(t.id),
        name: String(t.name || ""),
        label:
          (t.name || "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Unnamed",
        is_basic: !!t.is_basic,
        allow_overlap: !!t.allow_overlap,
      }));
  }, [org, orgLoading]);

  const typeById = useMemo(() => {
    const m = new Map();
    for (const t of typeOptions) m.set(t.id, t);
    return m;
  }, [typeOptions]);

  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const { data, isLoading, refetch } = useSalaryHistory(
    employeeId,
    undefined,
    selectedTypeId || undefined
  );
  const update = useUpdateSalary(employeeId);
  const del = useDeleteSalary(employeeId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<any>({});

  // DELETE CONFIRMATION STATE
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<any>(null);

  const startEdit = (rec: any) => {
    if (!canUpdate) return;
    setEditingId(rec.id);
    setFormState({
      amount: rec.amount,
      effective_from: rec.effective_from,
      effective_to: rec.effective_to || "",
      remarks: rec.remarks || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormState({});
  };

  const validateAndSaveEdit = () => {
    if (!canUpdate || !editingId) return;

    if (employee?.hire_date) {
      const hireDate = new Date(employee.hire_date);
      hireDate.setHours(0, 0, 0, 0);

      if (!formState.effective_from) {
        emitApiError({ message: "Effective From date is required." });
        return;
      }

      const newFromDate = new Date(formState.effective_from);
      newFromDate.setHours(0, 0, 0, 0);

      if (newFromDate < hireDate) {
        emitApiError({
          message: `Effective From cannot be earlier than employee's joining date (${employee.hire_date}).`,
        });
        return;
      }
    }

    const recordBeingEdited = data?.find((r: any) => r.id === editingId);
    if (!recordBeingEdited) return;

    const selectedType = typeById.get(String(recordBeingEdited.type_id));
    if (!selectedType) return;

    const values = { ...formState, type_id: recordBeingEdited.type_id };
    const allowOverlap = !!selectedType.allow_overlap;

    const fromDate = new Date(values.effective_from);
    const toDate = values.effective_to ? new Date(values.effective_to) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (toDate && toDate <= fromDate) {
      emitApiError({ message: "Effective To must be after Effective From" });
      return;
    }

    const isBackdated = fromDate < today;
    const daysBack = isBackdated
      ? Math.floor((today.getTime() - fromDate.getTime()) / 86400000)
      : 0;

    const normalize = (d: string | null) => {
      if (!d) return null;
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    };

    const newFrom = normalize(values.effective_from)!;
    const newTo = normalize(values.effective_to);

    const overlappingRecords = data?.filter((rec: any) => {
      if (rec.id === editingId) return false;
      if (String(rec.type_id) !== selectedType.id) return false;

      const recFrom = normalize(rec.effective_from)!;
      const recTo = normalize(rec.effective_to);

      const recEnd = recTo ?? Number.MAX_SAFE_INTEGER;
      const newEnd = newTo ?? Number.MAX_SAFE_INTEGER;

      const overlap = !(newEnd < recFrom || newFrom > recEnd);
      const nextDayAllowed = newFrom === recEnd + 86400000;

      return overlap && !nextDayAllowed;
    });

    if (overlappingRecords?.length) {
      if (allowOverlap) {
        setConfirmConfig({
          title: "Date Overlap Warning",
          description: `This update overlaps with ${overlappingRecords.length} existing record(s) for "${selectedType.label}".\n\nDo you still want to proceed?`,
          confirmLabel: "Proceed Anyway",
          danger: false,
          onConfirm: () => {
            setConfirmOpen(false);
            doSaveEdit();
          },
        });
        setConfirmOpenConfirm(true);
        return;
      } else {
        setConfirmConfig({
          title: "Date Overlap Detected",
          description: "Cannot save: This change overlaps with another record.",
          confirmLabel: "OK",
          danger: true,
          onConfirm: () => setConfirmOpen(false),
        });
        setConfirmOpen(true);
        return;
      }
    }

    const sameTypeRecords = data
      ?.filter(
        (r: any) => r.id !== editingId && String(r.type_id) === selectedType.id
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.effective_from).getTime() -
          new Date(b.effective_from).getTime()
      );

    if (sameTypeRecords?.length) {
      const previous = sameTypeRecords
        .filter((r: any) => new Date(r.effective_from) < fromDate)
        .pop();
      const next = sameTypeRecords.find(
        (r: any) => new Date(r.effective_from) > fromDate
      );

      const prevTo = previous?.effective_to
        ? normalize(previous.effective_to)!
        : null;
      const nextFrom = next ? normalize(next.effective_from)! : null;

      let gapMessage: string | null = null;

      if (prevTo && newFrom > prevTo + 86400000) {
        gapMessage = `A gap will exist between ${previous.effective_to} and ${values.effective_from}.`;
      }

      if (
        toDate &&
        nextFrom &&
        nextFrom > new Date(values.effective_to).getTime() + 86400000
      ) {
        gapMessage = `A gap will exist between ${values.effective_to} and ${next.effective_from}.`;
      }

      if (gapMessage) {
        setConfirmConfig({
          title: "Gap Detected",
          description: `${gapMessage}\n\nProceed anyway?`,
          confirmLabel: "Proceed Anyway",
          danger: false,
          onConfirm: () => {
            setConfirmOpen(false);
            doSaveEdit();
          },
        });
        setConfirmOpen(true);
        return;
      }
    }

    if (isBackdated) {
      setConfirmConfig({
        title: "Back-dated Edit",
        description: `You are back-dating this record by ${daysBack} day(s). This may trigger retroactive payroll.\n\nProceed?`,
        confirmLabel: "Yes, Proceed",
        danger: false,
        onConfirm: () => {
          setConfirmOpen(false);
          doSaveEdit();
        },
      });
      setConfirmOpen(true);
      return;
    }

    doSaveEdit();
  };

  const doSaveEdit = () => {
    if (!canUpdate) return;
    update.mutate(
      {
        salaryId: editingId!,
        input: {
          amount: formState.amount,
          effective_from: formState.effective_from,
          effective_to: formState.effective_to || null,
          remarks: formState.remarks || null,
        },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          refetch();
          emitSuccess({ message: "Salary updated successfully!", type: "success" });
        },
        onError: () => emitApiError({ message: "Failed to update salary" }),
      }
    );
  };

  // DELETE WITH CONFIRMATION
{/* DELETE WITH CONFIRMATION — NOW 100% RELIABLE */}
const handleDelete = (record: any) => {
  if (!canDelete) return;

  setDeleteTarget(record);
  setConfirmConfig({
    title: "Delete Salary Record",
    description: `Are you sure you want to delete the salary record of ${currency} ${record.amount?.toLocaleString()} effective from ${record.effective_from}?`,
    confirmLabel: "Delete",
    danger: true,
    onConfirm: async () => {
      try {
        await del.mutateAsync(record.id);
        refetch();
        emitSuccess({ message: "Salary record deleted", type: "success" });
      } catch (err) {
        emitApiError({ message: "Failed to delete salary record" });
      } finally {
        // Always close dialog, regardless of success/failure
        setConfirmOpen(false);
        setConfirmConfig(null);
        setDeleteTarget(null);
      }
    },
    onCancel: () => {
      setConfirmOpen(false);
      setConfirmConfig(null);
      setDeleteTarget(null);
    },
  });
  setConfirmOpen(true);
};

  const handleSendSalaryEmail = (rec: any) => {
    const t = rec.type_id ? typeById.get(String(rec.type_id)) : undefined;
    const typeLabel = t?.label || "Basic";

    if (!employee?.email) {
      emitApiError({ message: "No email found for this employee" });
      return;
    }

    sendEmail.mutate(
      {
        to: employee.email,
        type: "salary_increment",
        data: {
          name: employee.full_name || "Employee",
          amount: rec.amount,
          effective_from: rec.effective_from,
          type_label: typeLabel,
          currency,
        },
      },
      {
        onSuccess: () =>
          emitApiError({ message: "Salary hike email sent successfully!", type: "success" }),
        onError: () => emitApiError({ message: "Failed to send salary email" }),
      }
    );
  };

    const gapInfo = useMemo(() => {
    // ... (your existing gap detection logic - unchanged)
    // Keeping it exactly as you had
    if (!data?.length) return [];

    const normalize = (d: string | null) => (d ? new Date(d).getTime() : null);
    const allGaps: { id: string; message: string; type_id: string; afterDate?: string }[] = [];

    const groups = data.reduce((acc: any, rec: any) => {
      (acc[rec.type_id] = acc[rec.type_id] || []).push(rec);
      return acc;
    }, {});

    for (const [typeId, records] of Object.entries(groups)) {
      const sorted = (records as any[]).sort(
        (a, b) => new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime()
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        const currentTo = normalize(current.effective_to);
        const nextFrom = normalize(next.effective_from);

        if (currentTo && nextFrom && nextFrom > currentTo + 86400000) {
          const days = Math.round((nextFrom - currentTo) / 86400000);
          allGaps.push({
            id: `${current.id}-gap`,
            type_id: typeId,
            afterDate: current.effective_to,
            message: `Gap of ${days} day(s) between ${current.effective_to} to ${next.effective_from}`,
          });
        }
      }

      if (employee?.hire_date && sorted.length) {
        const firstStart = new Date(sorted[0].effective_from).getTime();
        const doj = new Date(employee.hire_date).getTime();
        if (firstStart > doj) {
          allGaps.push({
            id: `${typeId}-doj-gap`,
            type_id: typeId,
            message: `Coverage for ${typeById.get(typeId)?.label ?? "this component"} starts after joining date (${employee.hire_date}. Payslip working days considers salary effective date)`,
          });
        }
      }
    }

    return allGaps;
  }, [data, employee, typeById]);

  if (isLoading || orgLoading) return <p>Loading...</p>;



  return (
    <div className="space-y-4">
      {/* Filter */}
{/* Filter — Hidden only for self-view employees */}
{!isSelfViewEmployee && (
  <div className="flex flex-wrap items-center gap-3">
    <label className="font-medium">Filter by Type:</label>
    <select
      className="input w-60"
      value={selectedTypeId}
      onChange={(e) => setSelectedTypeId(e.target.value)}
      disabled={orgLoading}
    >
      <option value="">{orgLoading ? "Loading types..." : "All"}</option>
      {typeOptions.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
)}

  <div className="flex justify-end">
    {canToggleAmounts && ( <button
      onClick={() => setShowAmounts((prev) => !prev)}
      className="flex items-center gap-2 px-3 py-1 border rounded text-sm hover:bg-gray-50"
    >
      {showAmounts ? (
        <>
          <EyeOff className="w-4 h-4" /> Hide Amounts
        </>
      ) : (
        <>
          <Eye className="w-4 h-4" /> Show Amounts
        </>
      )}
    </button>
    )}
  </div>

      {/* Table */}
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Amount ({currency || "—"})</th>
            <th className="p-2 border">Effective From</th>
            <th className="p-2 border">Effective To</th>
            {/* Hide Remarks, Edit, Delete, Email for employee self-view */}
            {!isSelfViewEmployee && <th className="p-2 border">Remarks</th>}
            {!isSelfViewEmployee && <th className="p-2 border w-16 text-center">Edit</th>}
            {!isSelfViewEmployee && <th className="p-2 border w-16 text-center">Delete</th>}
          </tr>
        </thead>
        <tbody>
          {data?.length ? (
            data.map((rec: any) => {
              const isEditing = editingId === rec.id;
              const t = rec.type_id ? typeById.get(String(rec.type_id)) : undefined;
              const typeLabel =
                t?.label ||
                (rec.type
                  ? rec.type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())
                  : "—");
              const isBasic = !!t?.is_basic;

              return (
                <React.Fragment key={rec.id}>
                  <tr
                    className={`hover:bg-gray-50 ${
                      gapInfo.some(
                        (g) =>
                          g.type_id === rec.type_id &&
                          (g.afterDate === rec.effective_to ||
                            g.id.startsWith(rec.type_id))
                      )
                        ? "border-l-4 border-yellow-400"
                        : ""
                    }`}
                  >
                    <td className="p-2 border">{typeLabel}</td>
                    <td className="p-2 border">
                {isEditing ? (
                  <input
                    type="number"
                    className="input w-full"
                    value={formState.amount ?? ""}
                    onChange={(e) =>
                      setFormState((f: any) => ({
                        ...f,
                        amount:
                          e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                  />
                ) : (
                  <>
                    {!canToggleAmounts || showAmounts
                      ? `${currency} ${rec.amount?.toLocaleString() ?? 0}`
                      : "••••••"}
                  </>
                )}
              </td>
                    <td className="p-2 border">
                      {isEditing ? (
                        <input
                          type="date"
                          className="input w-full"
                          value={formState.effective_from ?? ""}
                          onChange={(e) =>
                            setFormState((f: any) => ({
                              ...f,
                              effective_from: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        rec.effective_from
                      )}
                    </td>
                    <td className="p-2 border">
                      {isEditing ? (
                        <input
                          type="date"
                          className="input w-full"
                          value={formState.effective_to ?? ""}
                          onChange={(e) =>
                            setFormState((f: any) => ({
                              ...f,
                              effective_to: e.target.value || null,
                            }))
                          }
                        />
                      ) : (
                        rec.effective_to ?? "-"
                      )}
                    </td>
                    {!isSelfViewEmployee && (
                    <td className="p-2 border">
                      {isEditing ? (
                        <input
                          type="text"
                          className="input w-full"
                          value={formState.remarks ?? ""}
                          onChange={(e) =>
                            setFormState((f: any) => ({
                              ...f,
                              remarks: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        rec.remarks || "-"
                      )}
                    </td>
                    )}
                    {!isSelfViewEmployee && (
                    <td className="p-2 border text-center">
                      {isEditing ? (
                        canUpdate && (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={validateAndSaveEdit}
                              className="p-1 rounded text-green-600 hover:bg-green-50"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded text-gray-600 hover:bg-gray-50"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      ) : (
                        canUpdate && (
                          <button
                            onClick={() => startEdit(rec)}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </td>
                     )}
                     {!isSelfViewEmployee && (
                    <td className="p-2 border text-center">
                      {!isEditing && canDelete && (
                        <button
                          onClick={() => handleDelete(rec)}
                          className="p-1 rounded text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                    )} 
                  </tr>

                  {/* Inline gap warnings */}
                  {gapInfo
                    .filter(
                      (g) =>
                        g.type_id === rec.type_id &&
                        (g.afterDate === rec.effective_to ||
                          g.id.startsWith(rec.type_id))
                    )
                    .map((g) => (
                      <tr key={g.id} className="bg-yellow-50 text-xs text-yellow-800">
                        <td colSpan={8} className="p-2 border-t border-yellow-200">
                          Warning: {g.message}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td className="p-4 text-center text-gray-500" colSpan={8}>
                No salary records found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Unified Confirm Dialog (used for edit warnings AND delete) */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmConfig?.title || "Confirm Action"}
        description={confirmConfig?.description || "Are you sure?"}
        confirmLabel={confirmConfig?.confirmLabel || "Confirm"}
        danger={!!confirmConfig?.danger}
        isLoading={del.isPending || update.isPending}
        onConfirm={confirmConfig?.onConfirm || (() => setConfirmOpen(false))}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}