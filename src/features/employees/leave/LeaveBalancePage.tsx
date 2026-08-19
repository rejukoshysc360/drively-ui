import { useAuth } from "../../../features/auth/AuthProvider";
import { Calendar } from "lucide-react";
import { useEmployeeLeaveBalances, useEmployeeLeaves } from "./hooks";

export default function LeaveBalancePage({ employeeId }: { employeeId?: string }) {
  const { profile } = useAuth();
  const effectiveId = employeeId ?? profile?.id;

  const { data: leaveBalances, isLoading, error } =
    useEmployeeLeaveBalances(effectiveId ?? "");

  // ✅ Fetch leaves (SOURCE OF TRUTH)
  const { data: leavesRes } = useEmployeeLeaves(
    effectiveId ?? "",
    1,
    2000, // 🔥 increased limit
    true
  );

  // ✅ ONLY approved leaves
const allLeaves = (leavesRes?.leaves ?? []).filter(
  (l: any) =>
    l.status === "approved" ||
    l.status === "pending_cancel_approval" ||
    l.status === "cancel_rejected"
);

  const leaveTypes = (leaveBalances?.balances ?? []).filter(
    (l: any) => l.show_to_employees !== false
  );

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        Loading leave balances…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-600 text-sm font-medium">
        Could not load leave balances.
      </div>
    );
  }

  if (leaveTypes.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 italic text-sm">
        No leave records available.
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-indigo-600" />
          My Leave Balances
        </h1>
        <p className="text-slate-600 mt-1">
          View your current leave entitlement and remaining balance
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {leaveTypes.map((l: any) => {
          // ✅ Filter leaves per type (approved only)
          const leaves = allLeaves.filter(
            (lv: any) => lv.leave_type_id === l.leave_type_id
          );

          // ✅ Correct calculation (same as LedgerPanel)
          let usedFull = 0,
            usedHalf = 0,
            usedUnpaid = 0;

          for (const lv of leaves) {
            usedFull += Number(lv.full_pay_days ?? 0);
            usedHalf += Number(lv.half_pay_days ?? 0);
            usedUnpaid += Number(lv.unpaid_days ?? 0);
          }

          const paidUsed = usedFull + usedHalf;

          const total = Number(l.accrued_balance ?? l.entitled_days ?? 0);
          const remaining = Number(l.remaining_days ?? 0);

          const percentUsed =
            total > 0 ? Math.min((paidUsed / total) * 100, 100) : 0;

          return (
            <div
              key={l.leave_type_id}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group"
            >
              <p className="font-bold text-lg text-slate-800 mb-5 group-hover:text-indigo-700 transition-colors">
                {l.leave_type}
              </p>

              <div className="space-y-4">
                {/* ✅ Paid vs Unpaid */}
                <div className="space-y-1 text-sm">
                  {/* Summary */}
                  <div className="flex justify-between text-slate-600">
                    <span>Paid Used</span>
                    <span className="font-medium text-indigo-700">
                      {paidUsed} days
                    </span>
                  </div>

                  {/* Breakdown */}
                  <div className="pl-3 space-y-1 text-xs border-l-2 border-slate-200">
                    <div className="flex justify-between text-slate-500">
                      <span>Full Pay Used</span>
                      <span>{usedFull} days</span>
                    </div>

                    <div className="flex justify-between text-amber-600">
                      <span>Half Pay Used</span>
                      <span>{usedHalf} days</span>
                    </div>

                    <div className="flex justify-between text-red-600">
                      <span>Unpaid Used</span>
                      <span>{usedUnpaid} days</span>
                    </div>
                  </div>
                </div>

                {/* ✅ Progress */}
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>

                {/* ✅ Remaining */}
                <p className="text-base pt-1">
                  Remaining:{" "}
                  <span
                    className={`font-bold ${
                      remaining <= 3 ? "text-amber-600" : "text-emerald-700"
                    }`}
                  >
                    {remaining} days
                  </span>
                </p>

                {/* ✅ Warning */}
                {usedUnpaid > 0 && (
                  <p className="text-xs text-red-600">
                    {usedUnpaid} day(s) taken as unpaid leave
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}