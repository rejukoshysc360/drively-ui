// components/leave/LedgerPanel.tsx
import { useState } from "react";
import {
  useEmployeeAvailableLeave,
  useEmployeeLeaveAccruals,
  useEmployeeLeaves,
  useUpdateEmployeeLeave,
} from "../../employees/leave/hooks";
import LeaveSummaryCard from "./LeaveSummaryCard";
import AuditSummary from "./AuditSummary";
import LeaveRequestsList from "./LeaveRequestsList";
import LeaveDetailsDialog from "./LeaveDetailsDialog";
import { useAuth } from "../../auth/AuthProvider";
import { useCan } from "../../../utils/permissions";
import { useRoles } from "../../../utils/useRoles";
import ManagerLeaveDetailsDialog from "./ManagerLeaveDetailsDialog";
import { Plus } from "lucide-react";
import HRApplyLeaveDialog from "./HRApplyLeaveDialog";

export default function LedgerPanel({ employeeId, leaveTypeId, policy }: any) {
  const can = useCan();
  const [showDetails, setShowDetails] = useState(false);
  const [viewLeave, setViewLeave] = useState<any | null>(null);
  const { organization_id } = useAuth();

  const { isAdmin, isHR,isManager} = useRoles(); 
  const [showApplyLeave, setShowApplyLeave] = useState(false);
 

  // Condition: Only HR or Admin can view the Leave Summary Card
  const canViewSummaryCard = isAdmin || isHR || isManager;
  const canApplyLeave = isAdmin || isHR || isManager;

  const canViewBalance =
    can("leaves:view") || can("leaves:view_own_record_only");
  const canUpdateLeave = can("leaves:update");

  const { data: available, isLoading: availLoading } = canViewBalance
    ? useEmployeeAvailableLeave(employeeId, leaveTypeId, true)
    : { data: null, isLoading: false };

  const { data: accruals, isLoading: accrualsLoading } = canViewBalance
    ? useEmployeeLeaveAccruals(employeeId, leaveTypeId, true)
    : { data: null, isLoading: false };

    const { data: leavesRes, isLoading: leavesLoading } = useEmployeeLeaves(
      employeeId,
      1,
      200,
      true // ✅ just like other APIs, pass crossOrg=true
    );

  const updateLeave = useUpdateEmployeeLeave();

  if (availLoading || accrualsLoading || leavesLoading)
    return (
      <p className="text-center text-sm text-gray-500 py-8">
        Loading summary…
      </p>
    );

  const leaves = (leavesRes?.leaves ?? []).filter(
    (l: any) => l.leave_type_id === leaveTypeId
  );

  const entitlement = Number(policy?.entitlement_days ?? 0);
  const isAccruable = policy?.is_accruable ?? false;
  const accruedBalance = Number(
    isAccruable ? available?.accrued_balance ?? 0 : entitlement
  );
  const carryForwardPolicy = policy?.carry_forward_policy || "—";

  let usedFull = 0,
    usedHalf = 0,
    usedUnpaid = 0;

  for (const l of leaves) {
    const isValidUsage =
      l.status === "approved" ||
      l.status === "pending_cancel_approval" ||
      l.status === "cancel_rejected";

    if (!isValidUsage) continue;

    usedFull += Number(l.full_pay_days ?? 0);
    usedHalf += Number(l.half_pay_days ?? 0);
    usedUnpaid += Number(l.unpaid_days ?? 0);
  }

  const paidUsed = usedFull + usedHalf;
  const totalUsed = paidUsed + usedUnpaid;
  const remainingAccrued = Math.max(accruedBalance - paidUsed, 0);

  const remaining = isAccruable? remainingAccrued: Math.max(entitlement - totalUsed, 0);

  const extraLeaveTaken = isAccruable
    ? usedUnpaid > 0
      ? `${usedUnpaid.toFixed(1)} days`
      : "—"
    : totalUsed > entitlement
    ? `${(totalUsed - entitlement).toFixed(1)} days`
    : "—";

  const summary = {
    leave_type: policy?.leave_type ?? "Unknown",
    entitlements: {
      total_entitlement: entitlement,
      is_accruable: isAccruable,
    },
    historical_usage: {
      total_used: totalUsed,
      used_full_pay: usedFull,
      used_half_pay: usedHalf,
      used_unpaid: usedUnpaid,
    },
    exhausted: remainingAccrued <= 0,
    message:
      remainingAccrued <= 0
        ? "Entitlement exhausted — further approvals may be unpaid."
        : undefined,
  };

  const handleUpdate = (
    employeeId: string,
    leave: any,
    status:
      | "approved"
      | "rejected"
      | "cancelled"
      | "cancel_rejected"
      | "pending_cancel_approval",
    split?: any
  ) => {
    if (!canUpdateLeave) return;

    const input: any = {
      status,
      days_applied: leave.days_applied,
    };

    if (status === "rejected" && split?.hr_rejection_reason) {
      input.hr_rejection_reason = split.hr_rejection_reason;
    }

    if (status === "approved" && split) {
      if (split.full_pay_days !== undefined)
        input.full_pay_days = split.full_pay_days;
      if (split.half_pay_days !== undefined)
        input.half_pay_days = split.half_pay_days;
      if (split.unpaid_days !== undefined)
        input.unpaid_days = split.unpaid_days;
    }

    if (status === "cancel_rejected" && split?.hr_rejection_reason) {
      input.hr_rejection_reason = split.hr_rejection_reason;
    }

    updateLeave.mutate({
      organization_id: organization_id!,
      employee_id: employeeId,
      leave_id: leave.id,
      input,
    });
  };
const handleManagerUpdate = (
  employeeId: string,
  leave: any,
  action: "approved" | "rejected",
  extra?: { manager_rejection_reason?: string }
) => {
  const input: any = {
    manager_approval_status: action === "approved" ? "approved" : "rejected",
  };

  if (action === "rejected") {
    if (!extra?.manager_rejection_reason?.trim()) {
      return;
    }
    input.manager_rejection_reason = extra.manager_rejection_reason.trim();
  }

  // No "status" field sent at all — completely removed

  updateLeave.mutate({
    organization_id: organization_id!,
    employee_id: employeeId,
    leave_id: leave.id,
    input,
  });
};
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {/* Summary Card */}
{canApplyLeave && (
  <div className="space-y-4">
    <div className="flex justify-end">
      <button
        onClick={() => setShowApplyLeave(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <Plus className="w-4 h-4" />
        Apply Leave
      </button>
    </div>

    {canViewSummaryCard && (
      <LeaveSummaryCard
        summary={summary}
        available={available}
      />
    )}
  </div>
)}

      {/* Collapsible Accrued Ledger */}
       {canViewSummaryCard && (
      <div className="bg-gray-50/70 rounded-xl border border-gray-200 p-5">
        <button
          onClick={() => setShowDetails((s) => !s)}
          className="w-full flex items-center justify-between text-sm font-medium text-indigo-700 hover:text-indigo-800 transition"
        >
          <span>{showDetails ? "Hide" : "View"} Accrued Ledger</span>
          <svg
            className={`w-5 h-5 transition-transform ${showDetails ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="mt-5 space-y-5 text-sm">
            {/* Policy Info – No Overflow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-medium text-gray-500">Carry Forward Policy</p>
                <p className="font-semibold text-gray-900 break-words">
                  {carryForwardPolicy}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Accrual Basis</p>
                <p className="font-semibold text-gray-900">
                  {isAccruable ? "Accrual-Based" : "Fixed Entitlement"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Extra Leave Taken</p>
              <p className={`font-semibold ${usedUnpaid > 0 || totalUsed > entitlement ? "text-red-700" : "text-gray-900"}`}>
                {extraLeaveTaken}
              </p>
            </div>

            {/* Audit Summary */}
            {canViewBalance && accruals && (
              <div className="mt-6">
               <AuditSummary
                available={available}
                accruals={accruals}
                leave={{
                  allLeaves: leaves,
                  totalUsed,
                  remaining
                }}
              />
              </div>
            )}
          </div>
        )}
      </div>
       )}

      {/* Leave Requests */}
     
      <div className="mt-6">
        <LeaveRequestsList
          leaves={leaves}
          onView={(leave) =>
            setViewLeave({ ...leave, allLeaves: leaves, canUpdate: canUpdateLeave })
          }
        />
      </div> 
      <HRApplyLeaveDialog
  open={showApplyLeave}
  employeeId={employeeId}
  onClose={() => setShowApplyLeave(false)}
/>

      {/* Conditional Dialog Rendering */}
      {viewLeave && isManager && (
        <ManagerLeaveDetailsDialog
          leave={viewLeave}
          onClose={() => setViewLeave(null)}
          onUpdate={handleManagerUpdate}
        />
      )} 

      {viewLeave && !isManager && (
        <LeaveDetailsDialog
          leave={viewLeave}
          onClose={() => setViewLeave(null)}
          onUpdate={handleUpdate}
          allExhausted={remainingAccrued <= 0}
        />
      )}
    </div>
  );
}