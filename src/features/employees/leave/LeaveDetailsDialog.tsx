import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  X,
} from "lucide-react";
import FormDialog from "../../../components/ui/FormDialog";
import {
  useEmployeeAvailableLeave,
  useEmployeeLeaveAccruals,
} from "../../employees/leave/hooks";
import { useCan } from "../../../utils/permissions";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function LeaveDetailsDialog({
  leave,
  onClose,
  onUpdate,
  allExhausted,
}: {
  leave: any;
  onClose: () => void;
  allExhausted: boolean;
  onUpdate: (
    employeeId: string,
    leave: any,
    status: "approved" | "rejected" | "cancel_approved" | "cancel_rejected",
    split?: {
      full_pay_days?: number;
      half_pay_days?: number;
      unpaid_days?: number;
      notes?: string;
      hr_rejection_reason?: string;
    }
  ) => Promise<void> | void;
}) {
  const can = useCan();
  const canUpdate =
    can("leaves:update") || can("leaves:update_own_record_only");

  const { data: available } = useEmployeeAvailableLeave(
    leave.employee_id,
    leave.leave_type_id
  );
  useEmployeeLeaveAccruals(leave.employee_id, leave.leave_type_id);

  const policy = leave.leave_policies ?? {};
  const totalDays = Number(leave.days_applied ?? 0);
  const isAccruable = Boolean(policy?.is_accruable);
  const fullCap = Number(policy?.full_pay_days ?? 0);
  const halfCap = Number(policy?.half_pay_days ?? 0);
  const unpaidCap = Number(policy?.unpaid_days ?? 0);

  const [confirmAction, setConfirmAction] = useState<
  "approve" | "reject" | "cancel_approve" | "cancel_reject" | null
>(null);

  // -------- prior usage ----------
  const { usedFullSoFar, usedHalfSoFar } = useMemo(() => {
    const prior = (leave?.allLeaves ?? []).filter(
      (l: any) =>
        l.id !== leave.id &&
        l.status === "approved" &&
        l.leave_type_id === leave.leave_type_id
    );
    let f = 0,
      h = 0;
    for (const l of prior) {
      f += Number(l.full_pay_days ?? 0);
      h += Number(l.half_pay_days ?? 0);
    }
    return { usedFullSoFar: round1(f), usedHalfSoFar: round1(h) };
  }, [leave]);

  // -------- base calculations ----------
  const accrualFullCap = Number(available?.remaining_days ?? 0);

  const {
    baseFullUsed,
    baseHalfUsed,
    baseUnpaidUsed,
    extraAllowance,
  } = useMemo(() => {
    let baseFull = 0;
    let baseHalf = 0;
    let baseUnpaid = 0;

    if (isAccruable) {
      baseFull = Math.min(accrualFullCap, totalDays);
    } else {
      const remainingFullCap = Math.max(fullCap - usedFullSoFar, 0);
      const remainingHalfCap = Math.max(halfCap - usedHalfSoFar, 0);
      const remainingUnpaidCap = Math.max(unpaidCap, 0);

      baseFull = Math.min(remainingFullCap, totalDays);
      const remAfterFull = totalDays - baseFull;

      baseHalf = Math.min(remainingHalfCap, remAfterFull);
      const remAfterHalf = remAfterFull - baseHalf;

      baseUnpaid = Math.min(remainingUnpaidCap, remAfterHalf);
    }

    const extra = Math.max(totalDays - (baseFull + baseHalf + baseUnpaid), 0);

    return {
      baseFullUsed: round1(baseFull),
      baseHalfUsed: round1(baseHalf),
      baseUnpaidUsed: round1(baseUnpaid),
      extraAllowance: round1(extra),
    };
  }, [
    isAccruable,
    accrualFullCap,
    totalDays,
    fullCap,
    halfCap,
    unpaidCap,
    usedFullSoFar,
    usedHalfSoFar,
  ]);

  // -------- HR-editable extra split ----------
  const [extraFull, setExtraFull] = useState(0);
  const [extraHalf, setExtraHalf] = useState(0);
  const [extraUnpaid, setExtraUnpaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  useEffect(() => {
    if (
      extraAllowance > 0 &&
      extraFull === 0 &&
      extraHalf === 0 &&
      extraUnpaid === 0
    ) {
      setExtraUnpaid(extraAllowance);
    }
  }, [extraAllowance]);

  const totalExtraChosen = extraFull + extraHalf + extraUnpaid;
  const isOverSplit = totalExtraChosen > extraAllowance;

  const steps = useMemo(() => {
    const n = Math.floor(extraAllowance * 2) + 1;
    return Array.from({ length: n }, (_, i) => i * 0.5);
  }, [extraAllowance]);

// --- Corrected Computed Split ---
const computedFull = round1(baseFullUsed + extraFull);
const computedHalf = round1(baseHalfUsed + extraHalf);
let computedUnpaid = round1(baseUnpaidUsed + extraUnpaid);

// Optional safety check to ensure totals align with totalDays
const totalSplit = computedFull + computedHalf + computedUnpaid;
if (totalSplit > totalDays) {
  // Clamp unpaid if totals exceed applied days
  const excess = totalSplit - totalDays;
  computedUnpaid = round1(Math.max(computedUnpaid - excess, 0));
}


  const availableDays = Number(available?.remaining_days ?? 0);
  const overdrawn = isAccruable && totalDays > availableDays;

  if (!leave || totalDays === 0) return null;

  async function handleAction(
    status: "approved" | "rejected" | "cancel_approved" | "cancel_rejected"
  ) {
    // extra safety: don't call backend if user can't manage
    if (!canUpdate) return;

    try {
      setLoading(true);

      if (status === "approved") {
        await onUpdate(leave.employee_id, leave, status, {
          full_pay_days: computedFull,
          half_pay_days: computedHalf,
          unpaid_days: computedUnpaid,
        });
      } else if (status === "rejected") {
      
      if (!rejectionNote.trim()) {
        setRejectionError("Rejection reason is required.");
        return;
      }
      setRejectionError("");
      await onUpdate(leave.employee_id, leave, "rejected", {
        hr_rejection_reason: rejectionNote,
      });
      } else if (status === "cancel_approved") {
        await onUpdate(leave.employee_id, leave, "cancelled");
      } else if (status === "cancel_rejected") {
        if (!rejectionNote.trim()) {
          setRejectionError("Rejection reason is required.");
          return;
        }
        setRejectionError("");
        await onUpdate(leave.employee_id, leave, "cancel_rejected", {
           notes: rejectionNote,
        });
      }

      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function performAction(
  action: "approved" | "rejected" | "cancelled" | "cancel_rejected"
) {
  if (!canUpdate) return;

  try {
    setLoading(true);

    if (action === "approved") {
      await onUpdate(leave.employee_id, leave, "approved", {
        full_pay_days: computedFull,
        half_pay_days: computedHalf,
        unpaid_days: computedUnpaid,
      });
    } else if (action === "rejected") {
      if (!rejectionNote.trim()) {
        setRejectionError("Rejection reason is required.");
        return;
      }
      setRejectionError("");
      await onUpdate(leave.employee_id, leave, "rejected", {
        hr_rejection_reason: rejectionNote,
      });
    } else if (action === "cancelled") {
      await onUpdate(leave.employee_id, leave, "cancel_approved");
    } else if (action === "cancel_rejected") {
      if (!rejectionNote.trim()) {
        setRejectionError("Rejection reason is required.");
        return;
      }
      setRejectionError("");
      await onUpdate(leave.employee_id, leave, "cancel_rejected", {
        hr_rejection_reason: rejectionNote,  // Changed from notes to hr_rejection_reason for consistency
      });
    }

    onClose();
  } catch {
  } finally {
    setLoading(false);
    setConfirmAction(null);
  }
}

return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center">
        {/* Dialog Container */}
<div
  className="
    w-full h-[100dvh]
    bg-white shadow-2xl
    rounded-none
    md:rounded-xl
    md:w-auto md:h-auto md:max-w-4xl md:max-h-[90vh]
    flex flex-col overflow-hidden
  "
>

 
  {/* Sticky Header */}
  <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 sticky top-0 z-10">
    <h2 className="text-lg font-semibold text-gray-900">Leave Details</h2>
    <button
      onClick={onClose}
      className="text-gray-500 hover:text-gray-700 transition"
    >
      <X className="w-5 h-5" />
    </button>
  </div>

  {/* Scrollable Content Area */}
  <div className="flex-1 overflow-y-auto px-6 pb-10 pt-4">

    {/* --- EMPLOYEE INFO --- */}
{/* --- EMPLOYEE INFO --- */}
<div className="mb-6">
  <h2 className="text-lg font-semibold text-gray-900">
    {leave.employees?.full_name}
  </h2>
  <p className="text-sm text-gray-500">{leave.employees?.email}</p>

 
{/* 🧩 Manager Approval Info */}
{leave.manager_id &&
  leave.status !== "cancelled" &&
  leave.status !== "pending_cancel_approval" && (
    
  <div className="text-sm mt-2 space-y-2">
    {leave.manager_approval_status === "pending" && (
      <p className="text-amber-600">
        🕓 This leave is awaiting manager approval from{" "}
        <strong>{leave.manager_name || "Manager"}</strong>.
      </p>
    )}
    {leave.manager_approval_status === "approved" && (
      <p className="text-blue-700">
        ✅ This leave was approved by{" "}
        <strong>{leave.manager_name || "Manager"}</strong> and is pending HR approval.
      </p>
    )}
    {leave.manager_approval_status === "rejected" && (
      <>
        <p className="text-red-600">
          ❌ This leave was rejected by{" "}
          <strong>{leave.manager_name || "Manager"}</strong>.
        </p>
        {leave.manager_rejection_reason && (
          <div className="ml-6 mt-1">
            <p className="text-xs text-gray-500">Manager's Reason:</p>
            <p className="text-sm text-red-700 italic whitespace-pre-line">
              {leave.manager_rejection_reason}
            </p>
          </div>
        )}
      </>
    )}
  </div>
)}
</div>

    {/* --- STATUS --- */}
    <div className="flex items-center gap-2 mb-6">
      {leave.status === "pending" && (
        <span className="flex items-center text-yellow-600 text-sm font-medium">
          <Clock className="w-4 h-4 mr-1" /> Pending Approval
        </span>
      )}
      {leave.status === "approved" && (
        <span className="flex items-center text-green-600 text-sm font-medium">
          <CheckCircle className="w-4 h-4 mr-1" /> Approved
        </span>
      )}
      {leave.status === "rejected" && (
        <span className="flex items-center text-red-600 text-sm font-medium">
          <XCircle className="w-4 h-4 mr-1" /> Rejected
        </span>
      )}
      {leave.status === "cancelled" && (
        <span className="flex items-center text-gray-600 text-sm font-medium">
          <XCircle className="w-4 h-4 mr-1" /> Cancelled
        </span>
      )}
      {leave.status === "cancel_rejected" && (
        <span className="flex items-center text-red-600 text-sm font-medium">
          <XCircle className="w-4 h-4 mr-1" /> Cancellation Rejected
        </span>
      )}
      {leave.status === "pending_cancel_approval" && (
        <span className="flex items-center text-indigo-600 text-sm font-medium">
          <RefreshCw className="w-4 h-4 mr-1 animate-spin-slow" /> Awaiting
          Cancel Approval
        </span>
      )}
    </div>

    {/* --- CANCELLATION INFO --- */}
    {(leave.cancel_reason || leave.status === "cancel_rejected") && (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
        {leave.cancel_reason && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">
              Employee’s Cancellation Reason
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {leave.cancel_reason}
            </p>
          </div>
        )}
        {leave.status === "cancel_rejected" && leave.hr_rejection_reason && (
          <div>
            <p className="text-xs text-gray-500 mb-1">HR’s Rejection Reason</p>
            <p className="text-sm text-red-700 whitespace-pre-line">
              {leave.hr_rejection_reason}
            </p>
          </div>
        )}
      </div>
    )}

    {/* --- HR REJECTION INFO --- */}
    {leave.status === "rejected" && leave.hr_rejection_reason && (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
        <p className="text-xs text-gray-500 mb-1">HR’s Rejection Reason</p>
        <p className="text-sm text-black-700 whitespace-pre-line">
          {leave.hr_rejection_reason}
        </p>
      </div>
    )}

    {/* --- BASIC INFO --- */}
    <div className="grid grid-cols-4 gap-y-6 gap-x-8 text-sm mb-8">
      <div>
        <p className="text-xs text-gray-500 mb-1">Leave Type</p>
        <p className="font-medium text-gray-900">
          {policy.leave_type || "-"}
          {leave?.is_half_day && (
            <span className="ml-2 text-sm text-gray-600">
              {leave.half_day_type === "morning"
                ? "(Morning Half)"
                : "(Afternoon Half)"}
            </span>
          )}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">Dates</p>
        <p className="font-medium text-gray-900">
          {leave.start_date} → {leave.end_date}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">Days Applied</p>
        <p className="font-medium text-gray-900">{totalDays}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">Notes</p>
        <p className="font-medium text-gray-900">{leave.notes || "—"}</p>
      </div>
    </div>

    {/* --- OVERDRAWN WARNING --- */}
    {overdrawn && leave.status === "pending" && (
      <div className="flex items-center bg-yellow-50 text-yellow-800 px-4 py-3 rounded mb-4">
        <AlertTriangle className="w-4 h-4 mr-2" />
        Applying {totalDays} days exceeds available balance of {availableDays}.
      </div>
    )}

    {/* --- APPROVAL ACTIONS --- */}
    {canUpdate && leave.status === "pending" && (
      <>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded mb-6">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            Expected Pay Breakdown (per UAE Policy)
          </p>

          <div className="grid grid-cols-4 text-center text-sm">
            <BreakdownBlock
              label="Full Pay (Base)"
              color="green"
              value={baseFullUsed}
            />
            <BreakdownBlock
              label="Half Pay (Base)"
              color="amber"
              value={baseHalfUsed}
            />
            <BreakdownBlock
              label="Unpaid (Base)"
              color="red"
              value={baseUnpaidUsed}
            />
            <BreakdownBlock
              label="Extra Period"
              color="gray"
              value={extraAllowance}
            />
          </div>

          <p className="mt-3 text-xs text-gray-600 italic">
            Base amounts above reflect your remaining entitlement for this
            request. You may allocate any extra days ({extraAllowance}) between
            Full, Half, or Unpaid at your discretion.
          </p>
        </div>

        {extraAllowance > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <SelectField
              label="Full Pay (Extra)"
              value={extraFull}
              setValue={setExtraFull}
              steps={steps}
              disableIf={(s) => s + extraHalf + extraUnpaid > extraAllowance}
            />
            <SelectField
              label="Half Pay (Extra)"
              value={extraHalf}
              setValue={setExtraHalf}
              steps={steps}
              disableIf={(s) => s + extraFull + extraUnpaid > extraAllowance}
            />
            <SelectField
              label="Unpaid (Extra)"
              value={extraUnpaid}
              setValue={setExtraUnpaid}
              steps={steps}
              disableIf={(s) => s + extraFull + extraHalf > extraAllowance}
            />
          </div>
        )}

        <div className="mt-4 mb-2 text-sm text-gray-700">
          <p>
            <strong>Final Split:</strong>{" "}
            <span className="text-green-700">
              Full {computedFull.toFixed(1)}
            </span>
            ,{" "}
            <span className="text-amber-700">
              Half {computedHalf.toFixed(1)}
            </span>
            ,{" "}
            <span className="text-red-700">
              Unpaid {computedUnpaid.toFixed(1)}
            </span>
          </p>
        </div>

        <div className="mt-6 mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason (Mandatory if Rejecting)
          </label>
          <textarea
            value={rejectionNote}
            onChange={(e) => {
              setRejectionNote(e.target.value);
              if (rejectionError) setRejectionError("");
            }}
            placeholder="Explain why leave is being rejected…"
            className={`w-full border rounded px-3 py-2 text-sm ${
              rejectionError ? "border-red-500" : "border-gray-300"
            }`}
            rows={3}
          />
          {rejectionError && (
            <p className="text-xs text-red-600 mt-1">{rejectionError}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-60"
            onClick={() => setConfirmAction("reject")}
          >
            Reject
          </button>
          <button
            disabled={isOverSplit || loading}
            className={`px-4 py-2 text-white text-sm rounded-lg ${
              isOverSplit || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={() => setConfirmAction("approve")}
          >
            Approve
          </button>
        </div>
      </>
    )}

    {/* --- CANCEL APPROVAL ACTIONS --- */}
    {canUpdate && leave.status === "pending_cancel_approval" && (
      <div className="mt-6 border-t pt-4">
        <p className="text-sm font-medium text-gray-800 mb-3">
          This employee has requested to cancel this approved leave.
        </p>

        {leave.cancel_reason && (
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-md mb-4">
            <p className="text-xs text-gray-500 mb-1">
              Employee’s Cancellation Reason
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {leave.cancel_reason}
            </p>
          </div>
        )}

        <div className="mt-4 mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason (Mandatory if rejecting cancellation)
          </label>
          <textarea
            value={rejectionNote}
            onChange={(e) => {
              setRejectionNote(e.target.value);
              if (rejectionError) setRejectionError("");
            }}
            placeholder="Explain why the cancellation request is rejected…"
            className={`w-full border rounded px-3 py-2 text-sm ${
              rejectionError ? "border-red-500" : "border-gray-300"
            }`}
            rows={3}
          />
          {rejectionError && (
            <p className="text-xs text-red-600 mt-1">{rejectionError}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-3">
          <button
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-60"
            onClick={() => setConfirmAction("cancel_reject")}
          >
            Reject Cancellation
          </button>

          <button
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60"
            onClick={() => setConfirmAction("cancel_approve")}
          >
            Approve Cancellation
          </button>
        </div>
      </div>
    )}

    {!canUpdate && (
      <p className="mt-2 text-xs text-gray-500 italic">
        You don’t have permission to approve or reject this leave request.
      </p>
    )}
  </div>
</div>


    <ConfirmDialog
      open={confirmAction === "approve"}
      title="Confirm Leave Approval"
      description={
        <>
          Are you sure you want to <strong>approve</strong> this leave request for{" "}
          <strong>{leave.employees?.full_name}</strong> from{" "}
          <strong>{leave.start_date}</strong> to <strong>{leave.end_date}</strong>?
          <br /><br />
          Final pay split: <strong>{computedFull.toFixed(1)}</strong> Full Pay,{" "}
          <strong>{computedHalf.toFixed(1)}</strong> Half Pay,{" "}
          <strong>{computedUnpaid.toFixed(1)}</strong> Unpaid.
        </>
      }
      confirmLabel="Yes, Approve"
      isLoading={loading}
      onConfirm={() => performAction("approved")}
      onClose={() => setConfirmAction(null)}
    />

    {/* Confirm Reject Leave */}
    <ConfirmDialog
      open={confirmAction === "reject"}
      title="Confirm Leave Rejection"
      description={
        <>
          Are you sure you want to <strong>reject</strong> this leave request for{" "}
          <strong>{leave.employees?.full_name}</strong> from{" "}
          <strong>{leave.start_date}</strong> to <strong>{leave.end_date}</strong>?
          <br /><br />
          The rejection reason provided will be visible to the employee.
        </>
      }
      confirmLabel="Yes, Reject"
      danger
      isLoading={loading}
      onConfirm={() => performAction("rejected")}
      onClose={() => setConfirmAction(null)}
    />

    {/* Confirm Approve Cancellation */}
    <ConfirmDialog
      open={confirmAction === "cancel_approve"}
      title="Approve Cancellation Request"
      description={
        <>
          Are you sure you want to <strong>approve the cancellation</strong> of this leave for{" "}
          <strong>{leave.employees?.full_name}</strong> ({leave.start_date} → {leave.end_date})?
          <br /><br />
          This will cancel the approved leave and restore the employee's balance.
        </>
      }
      confirmLabel="Yes, Approve Cancellation"
      isLoading={loading}
      onConfirm={() => performAction("cancelled")}
      onClose={() => setConfirmAction(null)}
    />

    {/* Confirm Reject Cancellation */}
    <ConfirmDialog
      open={confirmAction === "cancel_reject"}
      title="Reject Cancellation Request"
      description={
        <>
          Are you sure you want to <strong>reject the cancellation request</strong> for{" "}
          <strong>{leave.employees?.full_name}</strong> ({leave.start_date} → {leave.end_date})?
          <br /><br />
          The leave will remain approved.
        </>
      }
      confirmLabel="Yes, Reject Cancellation"
      danger
      isLoading={loading}
      onConfirm={() => performAction("cancel_rejected")}
      onClose={() => setConfirmAction(null)}
    />
    </div>
    </>
    
  );
}



// 🧩 Reusable Components
function BreakdownBlock({
  label,
  color,
  value,
}: {
  label: string;
  color: string;
  value: number;
}) {
  return (
    <div>
      <p className={`font-medium text-${color}-700`}>{label}</p>
      <p className={`text-lg font-semibold text-${color}-900`}>
        {value.toFixed(1)}
      </p>
    </div>
  );
}

function SelectField({
  label,
  value,
  setValue,
  steps,
  disableIf,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  steps: number[];
  disableIf: (s: number) => boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full border rounded px-2 py-1"
      >
        {steps.map((s) => (
          <option key={s} value={s} disabled={disableIf(s)}>
            {s.toFixed(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 2) / 2;
}

