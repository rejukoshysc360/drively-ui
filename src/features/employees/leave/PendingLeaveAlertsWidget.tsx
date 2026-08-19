import React, { useState } from "react";
import { FileText } from "lucide-react";
import { usePendingLeavesToday } from "../leave/hooks";
import { getLeaveBadge } from "../../../utils/leaveHelpers";
import { useRoles } from "../../../utils/useRoles";

type Props = {
  onViewMore?: () => void;
  maxItems?: number;
};

export default function PendingLeaveAlertsWidget({
  onViewMore,
  maxItems = 5,
}: Props) {

  const { isAdmin, isHR, isManager } = useRoles();

  const crossOrg = isManager;



  const { data, isLoading } = usePendingLeavesToday(crossOrg);


  const leaves = data?.leaves ?? [];
  const [visibleCount, setVisibleCount] = useState(maxItems);
  const visibleLeaves = leaves.slice(0, visibleCount);
  const hasMore = visibleCount < leaves.length;

  const getStatusColor = (status: string | null | undefined) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-rose-100 text-rose-700";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
      {/* Consistent Header - Matches "My Leave Balances" and "HR Announcements" */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              Pending Leave Approvals (Last 7 Days)
            </h2>
          </div>

          {onViewMore && (
            <button
              onClick={onViewMore}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View All →
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading pending leaves…</p>
          </div>
        ) : visibleLeaves.length > 0 ? (
          <div className="space-y-4">
            {visibleLeaves.map((leave) => {
              const badge = getLeaveBadge(leave);
              const employeeId =
                leave.employees?.employee_id ?? leave.employee_id;
              const employeeName = leave.employees?.full_name ?? "Unknown";

              return (
                <a
                  key={leave.id}
                  href={`/employees/${employeeId}/view-leave-submission`}
                  className="block p-5 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-all duration-200 group border border-transparent hover:border-indigo-100"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                      {employeeName
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-base group-hover:text-indigo-700 transition-colors">
                        {employeeName}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {leave.leave_policies.leave_type}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>

                        <span className="text-slate-500 text-xs self-center">
                          {leave.start_date}
                          {leave.start_date !== leave.end_date && ` → ${leave.end_date}`}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            leave.manager_approval_status
                          )}`}
                        >
                          Manager: {leave.manager_approval_status?.toUpperCase() || "PENDING"}
                        </span>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            leave.status
                          )}`}
                        >
                          HR: {leave.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}

            {hasMore && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setVisibleCount((prev) => prev + maxItems)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                >
                  Show More
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="font-medium text-slate-700">No pending leave requests</p>
            <p className="text-slate-500 text-sm mt-1">
              All leave applications have been processed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}