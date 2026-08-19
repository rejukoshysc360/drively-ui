import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function LeaveSummaryCard({
  summary,
  available,
}: {
  summary: any;
  available?: any;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const entitlement = summary.entitlements?.total_entitlement ?? 0;
  const isAccruable =
    available?.is_accruable ?? summary?.entitlements?.is_accruable ?? true;
  const initialAccrued = Number(available?.initial_accrued_days ?? 0);
  const accruedBalance = Number(available?.accrued_balance ?? 0);
  const daysAvailed = Number(available?.days_availed ?? 0);
  const carryPolicy = available?.carry_forward_policy || "—";

  const usedFull = Number(summary.historical_usage?.used_full_pay ?? 0);
  const usedHalf = Number(summary.historical_usage?.used_half_pay ?? 0);
  const usedUnpaid = Number(summary.historical_usage?.used_unpaid ?? 0);

  const paidUsed = usedFull + usedHalf;
  const totalUsed = paidUsed + usedUnpaid;

  const remainingAccrued = Math.max(accruedBalance - paidUsed, 0);
  const remainingEntitlement = Math.max(entitlement - totalUsed, 0);
  const remaining = isAccruable
    ? remainingAccrued.toFixed(1)
    : remainingEntitlement.toFixed(1);

  const extraTaken = isAccruable
    ? usedUnpaid
    : Math.max(totalUsed - entitlement, 0);

  const extraColor =
    extraTaken > 1 ? "text-red-700" : extraTaken > 0 ? "text-orange-600" : "";

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">
            {summary.leave_type} Audit
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              summary.exhausted
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {summary.exhausted ? "Exhausted" : "Active"}
          </span>
        </div>
      </div>

      {/* Main Summary */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Entitlement</p>
            <p className="font-bold text-gray-900">{entitlement} days</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Accrued To Date</p>
            <p className="font-bold text-gray-900">{initialAccrued.toFixed(1)} days</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Total Used</p>
            <p className="font-bold text-blue-700">{totalUsed.toFixed(1)} days</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">
              Remaining {isAccruable ? "(Accrued)" : "(Entitlement)"}
            </p>
            <p className={`font-bold ${Number(remaining) <= 0 ? "text-red-700" : "text-green-700"}`}>
              {remaining} days
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Carry Policy</p>
            <p className="font-medium text-gray-900 truncate">{carryPolicy}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Extra Taken</p>
           <p className={`font-bold ${extraColor}`}>
            {extraTaken > 0 ? `${extraTaken.toFixed(1)} days` : "—"}
          </p>
          </div>
        </div>
      </div>

      {/* Expand Button */}
      <div className="px-6 pb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition mx-auto"
        >
          {showDetails ? (
            <>Hide Details <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>View Details <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {/* EXPANDED SECTION — FIXED: No more overflow */}
      {showDetails && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/50">
          {/* First Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 text-xs">
            <div className="space-y-1">
              <p className="text-gray-500">Full Pay Used</p>
              <p className="font-semibold text-green-700">{usedFull.toFixed(1)} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Half Pay Used</p>
              <p className="font-semibold text-amber-700">{usedHalf.toFixed(1)} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Unpaid Used</p>
              <p className="font-semibold text-red-700">{usedUnpaid.toFixed(1)} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Approved Days</p>
              <p className="font-semibold">{daysAvailed.toFixed(1)} days</p>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 mt-6 text-xs">
            <div className="space-y-1">
              <p className="text-gray-500">Accrued Balance</p>
              <p className="font-semibold">{accruedBalance.toFixed(1)} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Total Entitlement</p>
              <p className="font-semibold">{entitlement} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Policy Type</p>
              <p className="font-semibold">{isAccruable ? "Accrual" : "Fixed"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Carry Forward</p>
              <p className="font-semibold break-words">{carryPolicy}</p>
            </div>
          </div>

          {summary.message && (
            <p className="mt-5 text-center text-xs text-amber-700 italic">
              {summary.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}