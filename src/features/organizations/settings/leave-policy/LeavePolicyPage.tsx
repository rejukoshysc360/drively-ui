import { useState } from "react";
import {
  useLeavePolicies,
  useCreateLeavePolicy,
  useUpdateLeavePolicy,
  useDeleteLeavePolicy,
} from "./hooks";
import { LeavePolicy } from "./api";
import { Plus, Trash2, Pencil, Lock } from "lucide-react";
import { useAuth } from "../../../auth/AuthProvider";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import FormDialog from "../../../../components/ui/FormDialog";
import { useCan } from "../../../../utils/permissions";
import { emitApiError } from "../../../../lib/error-bus";

export default function LeavePolicyPage() {

  const { organization_id, organization_country_code } = useAuth();
  const can = useCan();

  const canView = can("leave-policies:view");
  const canCreate = can("leave-policies:create");
  const canUpdate = can("leave-policies:update");
  const canDelete = can("leave-policies:delete");

  const [page, setPage] = useState(1);
  const limit = 10;

  const [editing, setEditing] = useState<LeavePolicy | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeavePolicy | null>(null);
  const [showCarryDialog, setShowCarryDialog] = useState(false);

  // Controlled form fields
  const [leaveType, setLeaveType] = useState("");
  const [entitlementDays, setEntitlementDays] = useState(0);
  const [fullPayDays, setFullPayDays] = useState(0);
  const [halfPayDays, setHalfPayDays] = useState(0);
  const [unpaidDays, setUnpaidDays] = useState(0);
  const [isAccruable, setIsAccruable] = useState(true);
  const [isCarryForwardEnabled, setIsCarryForwardEnabled] = useState(false);
  const [isEncashableOnExit, setIsEncashableOnExit] = useState(false);
  const [carryLimit, setCarryLimit] = useState(0);
  const [carryPolicy, setCarryPolicy] = useState("carry_forward_only");

  const [carryForwardExpiryMonths, setCarryForwardExpiryMonths] = useState(15);

  const { data, isLoading, refetch } = useLeavePolicies(page, limit);
  const createPolicy = useCreateLeavePolicy();
  const updatePolicy = useUpdateLeavePolicy(editing?.id || "");
  const deletePolicy = useDeleteLeavePolicy();

  const policies = data?.policies ?? [];
  const totalPages = data?.paginationMetaInfo?.totalPages ?? 1;
  const currentPage = data?.paginationMetaInfo?.currentPage ?? 1;

  const [showToEmployees, setShowToEmployees] = useState(true);

  if (!canView)
    return (
      <p className="text-gray-500 text-sm">
        You don’t have permission to view leave policies.
      </p>
    );

  const resetForm = () => {
    setEditing(null);
    setLeaveType("");
    setEntitlementDays(0);
    setFullPayDays(0);
    setHalfPayDays(0);
    setUnpaidDays(0);
    setIsAccruable(true);
    setIsCarryForwardEnabled(false);
    setCarryLimit(0);
    setCarryPolicy("carry_forward_only");
    setShowToEmployees(true);
    setIsEncashableOnExit(false);
    setCarryForwardExpiryMonths(15);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreate && !canUpdate) return;

    

    const totalAllocatedDays =
  fullPayDays + halfPayDays + unpaidDays;

// Issues 1 & 2
if (totalAllocatedDays !== entitlementDays) {
  emitApiError({
    message:
      "The total of Full Pay, Half Pay and Unpaid days must exactly match the Entitlement Days.",
  });
  return;
}

// Issue 4
if (
  isCarryForwardEnabled &&
  carryLimit > entitlementDays
) {
  emitApiError({
    message:
      "Carry Forward Limit cannot be greater than Entitlement Days.",
  });
  return;
}
if (
  isAccruable &&
  isCarryForwardEnabled &&
  carryForwardExpiryMonths < 1
) {
  emitApiError({
    message:
      "Carry Forward Expiry must be at least 1 month.",
  });
  return;
}


    const input = {
      leave_type: leaveType,
      entitlement_days: entitlementDays,
      full_pay_days: fullPayDays,
      half_pay_days: halfPayDays,
      unpaid_days: unpaidDays,
      is_accruable: isAccruable,
      is_carry_forward_enabled: isCarryForwardEnabled,
      carry_forward_limit: carryLimit,
      carry_forward_policy: carryPolicy,
      carry_forward_expiry_months:
  isAccruable && isCarryForwardEnabled
    ? carryForwardExpiryMonths
    : null,
      show_to_employees: showToEmployees,
      is_encashable_on_exit: isEncashableOnExit,
    };

    if (editing) {
      if (!canUpdate) return;
      await updatePolicy.mutateAsync(input);
    } else {
      if (!canCreate) return;
      await createPolicy.mutateAsync(input);
    }

setOpenForm(false);
resetForm();
refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold flex flex-col sm:flex-row sm:items-center gap-2">
          <span>Leave Policies</span>
          {!canUpdate && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Lock size={12} /> View-only access
            </span>
          )}
        </h2>

        {canCreate && (
          <button
            onClick={() => {
              resetForm();
              setOpenForm(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 min-w-[140px] h-10"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Add Policy</span>
            <span className="xs:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="card bg-white shadow rounded overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm font-medium text-gray-700">Leave Policies List</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading policies…</div>
        ) : policies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No leave policies found.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 pb-4">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 uppercase text-xs tracking-wider">
                  <th className="py-3 px-4 font-medium">Leave Type</th>
                  <th className="py-3 px-4 font-medium">Entitlement</th>
                  <th className="py-3 px-4 font-medium text-center">Full Pay</th>
                  <th className="py-3 px-4 font-medium text-center">Half Pay</th>
                  <th className="py-3 px-4 font-medium text-center">Unpaid</th>
                  <th className="py-3 px-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {policies.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {p.leave_type}
                    </td>
                    <td className="py-4 px-4 text-gray-700">{p.entitlement_days}</td>
                    <td className="py-4 px-4 text-center text-gray-700">
                      {p.full_pay_days}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700">
                      {p.half_pay_days}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700">
                      {p.unpaid_days}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center items-center gap-4">
                        {canUpdate && (
                          <button
                            onClick={() => {
                              setEditing(p);
                              setLeaveType(p.leave_type || "");
                              setEntitlementDays(p.entitlement_days || 0);
                              setFullPayDays(p.full_pay_days || 0);
                              setHalfPayDays(p.half_pay_days || 0);
                              setUnpaidDays(p.unpaid_days || 0);
                              setIsAccruable(p.is_accruable ?? true);
                              setIsCarryForwardEnabled(p.is_carry_forward_enabled ?? false);
                              setCarryLimit(p.carry_forward_limit || 0);
                              setCarryPolicy(p.carry_forward_policy || "carry_forward_only");
                              setCarryForwardExpiryMonths( p.carry_forward_expiry_months ?? 15);
                              setShowToEmployees(p.show_to_employees ?? true);
                              setIsEncashableOnExit(
                              p.is_encashable_on_exit ?? false
                              );
                              setOpenForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            aria-label="Edit policy"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            aria-label="Delete policy"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                        {!canUpdate && !canDelete && (
                          <span className="text-xs text-gray-400">Restricted</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-6 w-full max-w-md">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  ← Previous
                </button>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  Next →
                </button>
              </div>

              <span className="text-sm font-medium text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* UAE Notes */}
      {organization_country_code === "AE" && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 space-y-4">
          <p className="font-semibold text-base">Notes on UAE Leave Policy:</p>
          <ul className="list-disc list-inside space-y-3 text-gray-800">
            <li>Entitlements reset every year. Days are counted cumulatively even if taken in separate periods.</li>
            <li>
              <strong>Annual Leave:</strong> HR defines entitlement (e.g., 30 calendar days). Leave accrues annually and requires manager approval.
              <div className="ml-6 mt-2 text-gray-700 text-sm">
                Entitlement: None during first 6 months, 2 paid days/month from 6 months to 1 year, 30 days/year after 1 year.
              </div>
            </li>
            <li><strong>Sick Leave:</strong> Applied in sequence – Full Pay → Half Pay → Unpaid.</li>
            <li><strong>Maternity Leave:</strong> Paid in two phases – full pay first, then half pay.</li>
            <li>Medical certificates required for sick and maternity leave.</li>
            <li><strong>Casual Leave:</strong> Not mandated by law; offered per company policy.</li>
          </ul>
        </div>
      )}
      {organization_country_code === "IN" && (
  <div className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 space-y-4">
    <p className="font-semibold text-base">
      Notes on India Leave Policy:
    </p>

    <ul className="list-disc list-inside space-y-3 text-gray-800">
      <li>Leave entitlements are governed by the company's leave policy and applicable state labour laws.</li>

      <li>
        <strong>Earned / Privilege Leave:</strong> Accrues as per company policy and may be carried forward subject to the configured carry-forward rules.
      </li>

      <li>
        <strong>Casual Leave:</strong> Intended for short-term personal requirements and generally cannot be carried forward.
      </li>

      <li>
        <strong>Sick Leave:</strong> Granted for illness. A medical certificate may be required depending on company policy and the duration of leave.
      </li>

      <li>
        <strong>Maternity Leave:</strong> Granted in accordance with the applicable provisions of Indian labour laws and company policy.
      </li>

      <li>
        Leave approval is subject to reporting manager approval and organizational policy.
      </li>

      <li>
        Carry forward, encashment, and expiry of leave balances follow the configuration defined for each leave type.
      </li>
    </ul>
  </div>
)}

      {/* Add/Edit Dialog */}
      {(canCreate || canUpdate) && (
        <FormDialog
          open={openForm}
          title={editing ? "Edit Leave Policy" : "Add Leave Policy"}
          onClose={() => {
            setOpenForm(false);
            resetForm();
          }}
        >
          <form onSubmit={handleFormSubmit} className="space-y-5 max-w-2xl mx-auto pb-20 sm:pb-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <input
                type="text"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                placeholder="e.g., Annual, Sick, Maternity"
                required
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entitlement Days</label>
              <input
                type="number"
                value={entitlementDays}
                onChange={(e) => setEntitlementDays(Number(e.target.value))}
                min="0"
                required
                className="input w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Pay Days</label>
                <input
                  type="number"
                  value={fullPayDays}
                  onChange={(e) => setFullPayDays(Number(e.target.value))}
                  min="0"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Half Pay Days</label>
                <input
                  type="number"
                  value={halfPayDays}
                  onChange={(e) => setHalfPayDays(Number(e.target.value))}
                  min="0"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unpaid Days</label>
                <input
                  type="number"
                  value={unpaidDays}
                  onChange={(e) => setUnpaidDays(Number(e.target.value))}
                  min="0"
                  className="input w-full"
                />
              </div>
            </div>

            <hr className="my-6 border-gray-300" />

            <div className="space-y-4">
             <label className="flex items-center gap-3 text-sm">
  <input
    type="checkbox"
    checked={showToEmployees}
    onChange={(e) => setShowToEmployees(e.target.checked)}
    className="rounded h-4 w-4"
  />
  <span>Show this policy to employees</span>
</label>

              <p className="text-sm font-medium text-gray-700">Accrual & Carry Forward Settings</p>


              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={isAccruable}
                  onChange={(e) => setIsAccruable(e.target.checked)}
                  className="rounded h-4 w-4"
                />
                <span>Monthly accrual enabled</span>
              </label>
              <label className="flex items-center gap-3 text-sm">
  <input
    type="checkbox"
    checked={isEncashableOnExit}
    disabled={!isAccruable}
    onChange={(e) =>
      setIsEncashableOnExit(e.target.checked)
    }
    className="rounded h-4 w-4"
  />
  <span
    className={!isAccruable ? "text-gray-400" : ""}
  >
    Encash unused balance on separation
      {!isAccruable && (
      <span className="ml-1 text-xs">
        (requires monthly accrual)
      </span>
    )}
  </span>
</label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={isCarryForwardEnabled}
                  onChange={(e) => setIsCarryForwardEnabled(e.target.checked)}
                  className="rounded h-4 w-4"
                />
                <span>Allow carry forward at year-end</span>
              </label> 
                {isAccruable && isCarryForwardEnabled && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Carry Forward Limit
                        </label>

                        <input
                          type="number"
                          value={carryLimit}
                          onChange={(e) => setCarryLimit(Number(e.target.value))}
                          min="0"
                          className="input w-full"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium text-gray-700">
                            Carry Forward Policy
                          </label>

                          <button
                            type="button"
                            onClick={() => setShowCarryDialog(true)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs"
                          >
                            ℹ️ Info
                          </button>
                        </div>

                        <select
                          value={carryPolicy}
                          onChange={(e) => setCarryPolicy(e.target.value)}
                          className="input w-full"
                        >
                          <option value="carry_forward_only">
                            Carry forward only
                          </option>
                          <option value="carry_and_encash_excess">
                            Carry forward and encash excess
                          </option>
                          <option value="expire_only">
                            Expire only
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Carry Forward Expiry (Months)
                      </label>

                      <input
                        type="number"
                        min={1}
                        value={carryForwardExpiryMonths}
                        onChange={(e) =>
                          setCarryForwardExpiryMonths(Number(e.target.value))
                        }
                        className="input w-full"
                      />

                      <p className="text-xs text-gray-500 mt-1">
                        Number of months the carried-forward leave remains valid before expiring.
                      </p>
                    </div>
                  </>
                )}
            </div>

            {/* Fixed Buttons - Right-aligned on desktop, fixed bottom on mobile */}
            <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 p-4 sm:static sm:border-0 sm:p-0 sm:mt-8">
              <div className="flex flex-row gap-3 max-w-2xl mx-auto sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setOpenForm(false);
                    resetForm();
                  }}
                  className="flex-1 sm:flex-initial bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial bg-black text-white hover:bg-gray-800 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                  disabled={createPolicy.isPending || updatePolicy.isPending}
                >
                  {editing
                    ? updatePolicy.isPending
                      ? "Updating…"
                      : "Update"
                    : createPolicy.isPending
                    ? "Creating…"
                    : "Create"}
                </button>
              </div>
            </div>
          </form>
        </FormDialog>
      )}

      {/* Carry Forward Info Dialog */}
      <FormDialog
        open={showCarryDialog}
        title="Carry Forward Policy Details"
        onClose={() => setShowCarryDialog(false)}
      >
        <div className="text-sm text-gray-700 space-y-4">
          <p>These policies determine how unused leave days are treated at year-end.</p>
          <ul className="list-disc pl-5 space-y-3">
            <li><strong>carry_forward_only:</strong> Carry up to the defined limit. Excess expires.</li>
            <li><strong>carry_and_encash_excess:</strong> Carry limited days; excess becomes encashable.</li>
            <li><strong>expire_only:</strong> Excess days expire immediately with no encashment.</li>
          </ul>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      {canDelete && deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Leave Policy"
          description={`Are you sure you want to delete "${deleteTarget.leave_type}"?`}
          confirmLabel="Delete"
          danger
          isLoading={deletePolicy.isPending}
          onConfirm={async () => {
            await deletePolicy.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            refetch();
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}