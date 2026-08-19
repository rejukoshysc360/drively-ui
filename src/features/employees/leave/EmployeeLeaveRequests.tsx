// src/pages/leave/EmployeeLeaveRequests.tsx
import { useState } from "react";
import { Paperclip, Calendar, X, Clock, Filter } from "lucide-react";
import { useEmployeeLeaves } from "../../employees/leave/hooks";
import { employeeLeaveApi } from "../../employees/leave/api";
import { useAuth } from "../../auth/AuthProvider";
import {
  format,
  differenceInCalendarDays,
  parseISO,
  startOfDay,
} from "date-fns";
import FormDialog from "../../../components/ui/FormDialog";
import { toast } from "react-hot-toast";
import { useCan } from "../../../utils/permissions";

export default function EmployeeLeaveRequests() {
  const { user } = useAuth();

  const can = useCan();

  // Permissions
  const canView = can("leaves:view") || can("leaves:view_own_record_only");
  const canUpdate =
    can("leaves:update") || can("leaves:update_own_record_only");

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white border border-gray-200 rounded-lg shadow-sm text-center p-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-14 h-14 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3m0 4h.01M4.293 6.707a1 1 0 011.414 0L12 13l6.293-6.293a1 1 0 111.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">
          Access Restricted
        </h2>
        <p className="text-gray-500 text-sm">
          You don’t have permission to view leave requests.
        </p>
      </div>
    );
  }

  const [page] = useState(1);
  const [limit] = useState(20);
  const [cancelLeave, setCancelLeave] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const { data, isLoading, refetch } = useEmployeeLeaves(
    user?.id!,
    page,
    limit,
  );
  const leaves = data?.leaves ?? [];

  const [attachments, setAttachments] = useState<Record<string, any[]>>({});

  const fetchAttachments = async (leaveId: string) => {
    if (attachments[leaveId]) return;
    try {
      const res = await employeeLeaveApi.listAttachments(
        leaves[0].organization_id,
        user?.id!,
        leaveId,
      );
      setAttachments((prev) => ({ ...prev, [leaveId]: res }));
    } catch {
      toast.error("Failed to fetch attachments");
    }
  };

  // Updated cancellation rules with 7-day cutoff for approved leaves
  const getCancelRule = (leave: any) => {
    const today = startOfDay(new Date());

    const start = startOfDay(parseISO(leave.start_date));
    const end = startOfDay(parseISO(leave.end_date));

    const status = (leave.status || "").toLowerCase();

    // Final states
    if (["rejected", "cancelled"].includes(status)) {
      return {
        allow: false,
        autoApprove: false,
        requireReason: false,
        label: "finalized",
      };
    }

    // Pending requests can always be cancelled directly
    if (["pending", "pending_approval"].includes(status)) {
      return {
        allow: true,
        autoApprove: true,
        requireReason: true,
        label: "pending_direct_cancel",
      };
    }

    // Approved leave
    if (status === "approved") {
      // Entire leave already finished
      if (today > end) {
        return {
          allow: false,
          autoApprove: false,
          requireReason: false,
          label: "leave_completed",
        };
      }

      // Leave hasn't started yet
      if (today < start) {
        return {
          allow: true,
          autoApprove: false,
          requireReason: true,
          label: "approved_before_start",
        };
      }

      // Leave is currently in progress
      // Backend will split consumed/future days.
      return {
        allow: true,
        autoApprove: false,
        requireReason: true,
        label: "approved_partial_cancel",
      };
    }

    return {
      allow: false,
      autoApprove: false,
      requireReason: false,
      label: "unknown",
    };
  };

  const handleCancelConfirm = async () => {
    if (!cancelLeave) return;

    const rule = getCancelRule(cancelLeave);

    // This should never hit because we block in the dialog UI,
    // but keeping as safety net
    if (!rule.allow) {
      setCancelLeave(null);
      return;
    }

    if (rule.requireReason && !cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }

    try {
      setCancelLoading(true);
      const updatePayload: any = { cancel_reason: cancelReason };

      if (rule.autoApprove) {
        updatePayload.status = "cancelled";
      } else {
        updatePayload.status = "pending_cancel_approval";
      }

      await employeeLeaveApi.update(
        cancelLeave.organization_id,
        user?.id!,
        cancelLeave.id,
        updatePayload,
      );

      await refetch();

      if (rule.autoApprove) {
        toast.success("Leave cancelled successfully.");
      } else {
        toast.success("Cancellation request sent to HR for approval.");
      }

      setCancelLeave(null);
      setCancelReason("");
    } catch {
      toast.error("Failed to cancel leave.");
    } finally {
      setCancelLoading(false);
    }
  };

  const canCancelLeave = (leave: any) => {
    const rule = getCancelRule(leave);
    const status = (leave.status || "").toLowerCase();

    const isSystemGenerated = leave.notes
      ?.toLowerCase()
      .includes("system generated consumed leave after partial cancellation");

    return (
      canUpdate &&
      !isSystemGenerated &&
      (status === "pending" || status === "approved") &&
      rule.allow
    );
  };

  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-5">
        {leaves.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="bg-gray-100 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Filter className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              No leave requests
            </h3>
            <p className="text-gray-500">
              You haven't applied for any leave yet.
            </p>
          </div>
        )}

        {leaves.map((leave) => (
          <div
            key={leave.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group"
          >
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-indigo-900">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold">
                    {leave.leave_policies?.leave_type ||
                      leave.leave_type ||
                      "Leave"}{" "}
                    — {leave.days_applied} day
                    {leave.days_applied > 1 ? "s" : ""}
                    {leave.is_half_day
                      ? ` (${leave.half_day_type === "morning" ? "Morning Half" : "Afternoon Half"})`
                      : ""}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    // Final HR decisions take highest priority
                    leave.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : leave.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : leave.status === "cancelled"
                          ? "bg-gray-100 text-gray-700"
                          : leave.status === "cancel_rejected"
                            ? "bg-red-100 text-red-800"
                            : leave.status === "pending_cancel_approval"
                              ? "bg-orange-100 text-orange-700"
                              : // Manager decisions (when no final HR action yet)
                                leave.manager_approval_status === "approved"
                                ? "bg-blue-100 text-blue-800"
                                : leave.manager_approval_status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : // Default pending
                                    "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {
                    // If HR has made a final decision, show that first
                    leave.status && leave.status !== "pending"
                      ? leave.status === "approved"
                        ? "Approved"
                        : leave.status === "rejected"
                          ? "Rejected"
                          : leave.status === "cancelled"
                            ? "Cancelled"
                            : leave.status === "cancel_rejected"
                              ? "Cancellation Rejected"
                              : leave.status === "cancel_approved"
                                ? "Cancellation Approved"
                                : leave.status === "pending_cancel_approval"
                                  ? "Cancellation Pending Approval"
                                  : "Pending Approval"
                      : // HR is still pending → show Manager's decision
                        leave.manager_approval_status === "approved"
                        ? "Approved by Manager (Awaiting HR)"
                        : leave.manager_approval_status === "rejected"
                          ? "Rejected by Manager"
                          : "Pending Approval"
                  }
                </span>
              </div>
              {leave.manager_approval_status === "rejected" &&
                leave.manager_rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <strong>Manager's Rejection Reason:</strong>
                    <p className="mt-1 italic">
                      {leave.manager_rejection_reason}
                    </p>
                  </div>
                )}
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {format(parseISO(leave.start_date), "dd MMM yyyy")} →{" "}
                  {format(parseISO(leave.end_date), "dd MMM yyyy")}
                </span>
              </div>

              {leave.notes && (
                <p className="text-sm text-gray-600 italic mb-3">
                  "{leave.notes}"
                </p>
              )}

              {/* Employee's Cancellation Reason – for cancelled, pending cancel, or cancel rejected */}

              {leave.cancel_reason && (
                <div className="mt-3 text-sm text-gray-700 italic">
                  <span className="font-medium text-gray-900">
                    Cancellation Reason:
                  </span>{" "}
                  {leave.cancel_reason}
                </div>
              )}

              {(leave.status === "rejected" ||
                leave.status === "cancel_rejected") &&
                leave.hr_rejection_reason && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                    <strong>Rejection Reason:</strong>{" "}
                    {leave.hr_rejection_reason}
                  </div>
                )}

              <button
                onClick={() => fetchAttachments(leave.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition text-sm font-medium mt-3"
              >
                <Paperclip className="w-4 h-4" />
                View Attachments
              </button>

              {attachments[leave.id] && attachments[leave.id].length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments[leave.id].map((doc) => (
                    <div
                      key={doc.id}
                      className="flex justify-between items-center border p-2 rounded bg-gray-50"
                    >
                      <span className="text-sm truncate">{doc.file_name}</span>
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="text-indigo-600 text-sm font-medium hover:underline"
                      >
                        Preview
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Submitted on{" "}
                  {format(parseISO(leave.created_at), "dd MMM yyyy, hh:mm a")}
                </p>

                {/* NEW: Small note for approved leaves older than 7 days */}
                {leave.status?.toLowerCase() === "approved" &&
                  getCancelRule(leave).label === "leave_completed" && (
                    <p className="text-xs text-gray-500 italic">
                      Cancellation not available — this leave has already been
                      completed.
                    </p>
                  )}
              </div>

              {canCancelLeave(leave) && (
                <button
                  onClick={() => setCancelLeave(leave)}
                  className="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel Leave
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cancel Dialog – now handles both allowed and blocked cases */}
      {cancelLeave && (
        <FormDialog
          open={!!cancelLeave}
          title="Cancel Leave Request"
          onClose={() => {
            setCancelLeave(null);
            setCancelReason("");
          }}
          maxWidth="max-w-md"
        >
          <div className="p-6 space-y-5">
            {(() => {
              const rule = getCancelRule(cancelLeave);
              const daysSinceStart = differenceInCalendarDays(
                new Date(),
                startOfDay(parseISO(cancelLeave.start_date)),
              );

              // Blocked: leave started more than 7 days ago
              if (!rule.allow && rule.label === "leave_completed") {
                return (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="w-8 h-8 text-red-600" />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">
                      Leave Already Completed
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      This leave has already ended. Completed leave cannot be
                      cancelled through the portal.
                    </p>

                    <button
                      onClick={() => {
                        setCancelLeave(null);
                        setCancelReason("");
                      }}
                      className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Close
                    </button>
                  </div>
                );
              }

              // Allowed cases
              return (
                <>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Are you sure you want to request cancellation of your leave
                    from{" "}
                    <strong>
                      {format(parseISO(cancelLeave.start_date), "dd MMM yyyy")}
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {format(parseISO(cancelLeave.end_date), "dd MMM yyyy")}
                    </strong>
                    ?
                  </p>

                  {rule.label === "approved_hr_review" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800 font-medium">
                        Note: This is an approved leave. Your cancellation
                        request will be sent to HR for review and approval.
                      </p>
                    </div>
                  )}

                  {rule.requireReason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for cancellation{" "}
                        <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Please explain why you want to cancel this leave..."
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => {
                        setCancelLeave(null);
                        setCancelReason("");
                      }}
                      className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleCancelConfirm}
                      disabled={
                        cancelLoading ||
                        (rule.requireReason && !cancelReason.trim())
                      }
                      className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelLoading ? "Processing..." : "Confirm Cancellation"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </FormDialog>
      )}

      {/* Document Preview Dialog */}
      {previewDoc && (
        <FormDialog
          open={!!previewDoc}
          title={`Preview — ${previewDoc.file_name}`}
          maxWidth="max-w-2xl"
          onClose={() => setPreviewDoc(null)}
        >
          <div className="h-[80vh] w-full">
            <iframe
              src={previewDoc.presigned_url}
              className="w-full h-full rounded"
            />
          </div>
        </FormDialog>
      )}
    </div>
  );
}
