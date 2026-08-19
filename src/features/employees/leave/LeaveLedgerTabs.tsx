// components/leave/LeaveLedgerTabs.tsx
import React, { useEffect, useState } from "react";
import LedgerPanel from "./LedgerPanel";
import { useLeavePolicies } from "../../../features/organizations/settings/leave-policy/hooks";
import {
  useEmployeeAvailableLeave,
  useEmployeeLeaves,
} from "../../employees/leave/hooks";

import { useRoles } from "../../../utils/useRoles"; 

export default function LeaveLedgerTabs({ employeeId }: { employeeId: string }) {
  // ✅ Pass employeeId to backend (optional)
  const { data, isLoading } = useLeavePolicies(1, 50, employeeId);
  const policies = data?.policies ?? [];
  const [active, setActive] = useState<string | null>(null);

  const { data: leavesData } = useEmployeeLeaves(employeeId, 1, 200,true);
  const leaves = leavesData?.leaves ?? [];

  useEffect(() => {
    if (!active && policies.length > 0) {
      setActive(policies[0].id);
    }
  }, [policies, active]);

  if (isLoading)
    return (
      <p className="text-center text-sm text-gray-500 py-4">
        Loading leave policies…
      </p>
    );

  if (!policies || policies.length === 0)
    return (
      <p className="text-center text-sm text-gray-500 py-4">
        No leave policies found.
      </p>
    );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Leave Ledger Summary
        </h2>
      </div>

      {/* Horizontal Scrollable Tabs */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {policies.map((p) => (
            <LedgerTabButton
              key={p.id}
              policy={p}
              employeeId={employeeId}
              active={active}
              setActive={setActive}
              leaves={leaves}
            />
          ))}
        </div>
      </div>

      {/* Active Panel */}
      <div className="p-5">
        {active && (
          <LedgerPanel
            employeeId={employeeId}
            leaveTypeId={active}
            policy={policies.find((p) => p.id === active)}
          />
        )}
      </div>
    </div>
  );
}

// ✅ Subcomponent remains unchanged
function LedgerTabButton({
  policy,
  employeeId,
  active,
  setActive,
  leaves,
}: {
  policy: any;
  employeeId: string;
  active: string | null;
  setActive: (id: string) => void;
  leaves: any[];
}) {
  const { data: available } = useEmployeeAvailableLeave(employeeId, policy.id,true);
 

const policyLeaves = leaves.filter(
  (l: any) => l.leave_type_id === policy.id
);

let usedFull = 0;
let usedHalf = 0;
let usedUnpaid = 0;

for (const l of policyLeaves) {
  const isActiveUsage =
    l.status === "approved" ||
    l.status === "pending_cancel_approval" ||
    l.status === "cancel_rejected";

  if (!isActiveUsage) continue;

  usedFull += Number(l.full_pay_days ?? 0);
  usedHalf += Number(l.half_pay_days ?? 0);
  usedUnpaid += Number(l.unpaid_days ?? 0);
}

const totalUsed = usedFull + usedHalf + usedUnpaid;

const entitlement = Number(policy.entitlement_days ?? 0);
const isAccruable = policy.is_accruable ?? false;

const accruedBalance = Number(
  available?.accrued_balance ?? 0
);

const balance = isAccruable
  ? Math.max(accruedBalance - (usedFull + usedHalf), 0)
  : Math.max(entitlement - totalUsed, 0);

  const { isAdmin, isHR, isManager } = useRoles(); // ← Role detection

const pendingCount = leaves.filter((l) => {
  const isPending =
    l.leave_type_id === policy.id &&
    (l.status === "pending" || l.status === "pending_cancel_approval");

  if (isManager) {
    // Manager sees only those still awaiting *manager* action
    return isPending && l.manager_approval_status === "pending";
  }

  if (isHR || isAdmin) {
    // HR sees all pending leaves, regardless of manager approval
    return isPending;
  }

  // Employee view (same as before)
  return isPending;
}).length;

  const isActive = active === policy.id;

  return (
    <button
      onClick={() => setActive(policy.id)}
      className={`
        flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium
        whitespace-nowrap transition-all duration-200 flex-shrink-0
        ${
          isActive
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
            : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200"
        }
      `}
    >
      <span className="font-semibold">{policy.leave_type}</span>

      {/* Balance Badge */}
      {balance !== null && (
        <span
          className={`
            px-2.5 py-1 rounded-full text-xs font-bold
            ${isActive ? "bg-white/20" : "bg-green-100 text-green-700"}
          `}
        >
          {balance.toFixed(1)}d
        </span>
      )}

      {/* Pending Badge */}
      {pendingCount > 0 && (
        <span
          className={`
            px-2.5 py-1 rounded-full text-xs font-bold animate-pulse
            ${isActive ? "bg-yellow-200 text-yellow-900" : "bg-yellow-100 text-yellow-800"}
          `}
        >
          {pendingCount}
        </span>
      )}
    </button>
  );
}
