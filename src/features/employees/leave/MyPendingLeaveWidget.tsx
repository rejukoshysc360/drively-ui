import { Calendar, Clock, ExternalLink } from "lucide-react";
import { useEmployeeLeaves } from "../../employees/leave/hooks";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";

interface Props {
  showHeader?: boolean;
  limit?: number;
}

export default function MyPendingLeaveWidget({
  showHeader = true,
  limit = 5,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useEmployeeLeaves(user?.id!, 1, 50);
  const leaves = data?.leaves ?? [];

  // ✅ Show ALL leave requests
  const visibleLeaves = leaves.slice(0, limit);

  const getStatus = (leave: any) => {
    const status = (leave.status || "").toLowerCase();

    if (leave.manager_approval_status === "approved" && status === "pending") {
      return {
        label: "Approved by Manager (Awaiting HR)",
        className: "bg-blue-100 text-blue-800",
      };
    }

    switch (status) {
      case "pending":
        return {
          label: "Pending Approval",
          className: "bg-yellow-100 text-yellow-800",
        };

      case "approved":
        return {
          label: "Approved",
          className: "bg-green-100 text-green-800",
        };

      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-100 text-red-800",
        };

      case "pending_cancel_approval":
        return {
          label: "Cancellation Pending Approval",
          className: "bg-orange-100 text-orange-800",
        };

      case "cancel_approved":
        return {
          label: "Cancellation Approved",
          className: "bg-purple-100 text-purple-800",
        };

      case "cancel_rejected":
        return {
          label: "Cancellation Rejected",
          className: "bg-red-100 text-red-800",
        };

      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-gray-100 text-gray-700",
        };

      default:
        return {
          label: leave.status || "Unknown",
          className: "bg-gray-100 text-gray-700",
        };
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-600" />

            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
              My Leaves
            </h2>

            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
              {leaves.length}
            </span>
          </div>

          <button
            onClick={() => navigate("/leave-apply?tab=requests")}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
          >
            View All <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500 py-4 text-center">
          Loading leaves…
        </div>
      ) : visibleLeaves.length > 0 ? (
        <div className="space-y-3">
          {visibleLeaves.map((leave: any) => {
            const badge = getStatus(leave);

            return (
              <div
                key={leave.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {leave.leave_policies?.leave_type ||
                        leave.leave_type ||
                        "Leave"}
                    </p>

                    <p className="text-xs text-gray-600 mt-1">
                      {format(parseISO(leave.start_date), "dd MMM")} →{" "}
                      {format(parseISO(leave.end_date), "dd MMM")}
                    </p>

                    {leave.is_half_day && (
                      <p className="text-xs text-gray-500 italic">
                        {leave.half_day_type === "morning"
                          ? "Morning Half"
                          : "Afternoon Half"}
                      </p>
                    )}

                    <span
                      className={`inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs font-semibold text-gray-800">
                      {leave.days_applied}{" "}
                      {leave.days_applied === 1 ? "day" : "days"}
                    </span>

                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(leave.created_at), "dd MMM yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500 py-4 text-center">
          No leave requests found.
        </div>
      )}
    </div>
  );
}
