import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, X } from "lucide-react";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useCan } from "../../../utils/permissions";

export default function ManagerLeaveDetailsDialog({
  leave,
  onClose,
  onUpdate,
}: {
  leave: any;
  onClose: () => void;
  onUpdate: (
    employeeId: string,
    leave: any,
    status: "approved" | "rejected",
    extra?: { manager_rejection_reason?: string }
  ) => Promise<void> | void;
}) {
  const can = useCan();
  const canUpdate =
    can("leaves:approve_by_manager") || can("leaves:update_own_record_only");

  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [rejectionNote, setRejectionNote] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalDays = Number(leave.days_applied ?? 0);
  if (!leave || totalDays === 0) return null;

  async function performAction(action: "approved" | "rejected") {
    if (!canUpdate) return;

    try {
      setLoading(true);

      if (action === "rejected") {
        if (!rejectionNote.trim()) {
          setRejectionError("Rejection reason is required.");
          return;
        }
        setRejectionError("");
      }

      await onUpdate(
        leave.employee_id,
        leave,
        action,
        action === "rejected"
          ? { manager_rejection_reason: rejectionNote.trim() }
          : undefined
      );
      onClose();
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
        <div className="w-full h-[100dvh] bg-white shadow-2xl rounded-none md:rounded-xl md:w-auto md:h-auto md:max-w-3xl md:max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-900">
              Leave Request Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-10 pt-4">
            {/* Employee Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {leave.employees?.full_name}
              </h2>
              <p className="text-sm text-gray-500">{leave.employees?.email}</p>
            </div>

            {/* Status */}
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
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm mb-8 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Leave Type</p>
                <p className="font-medium text-gray-900">
                  {leave.leave_policies?.leave_type || "-"}
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

            {/* 🔹 Show HR Rejection Details when applicable */}
            {/* 🔹 Cancellation Info */}
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

                {leave.status === "cancel_rejected" &&
                  leave.hr_rejection_reason && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Cancellation Rejection Reason
                      </p>

                      <p className="text-sm text-red-700 whitespace-pre-line">
                        {leave.hr_rejection_reason}
                      </p>
                    </div>
                  )}
              </div>
            )}

{/* 🔹 Manager Rejection Info */}
{leave.manager_approval_status === "rejected" &&
  leave.manager_rejection_reason && (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <p className="text-xs text-red-600 mb-1">
        Manager Rejection Reason
      </p>

      <p className="text-sm text-red-700 whitespace-pre-line">
        {leave.manager_rejection_reason}
      </p>
    </div>
)}

{/* 🔹 HR Rejection Info */}
{leave.status === "rejected" &&
  leave.hr_rejection_reason && (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <p className="text-xs text-red-600 mb-1">
        HR Rejection Reason
      </p>

      <p className="text-sm text-red-700 whitespace-pre-line">
        {leave.hr_rejection_reason}
      </p>
    </div>
)}

            {/* Manager Actions */}
            {canUpdate && leave.status === "pending" &&  leave.manager_approval_status == "pending" && (
              <>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason{" "}
                    <span className="text-red-600">
                      (required if rejecting)
                    </span>
                  </label>
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => {
                      setRejectionNote(e.target.value);
                      if (rejectionError) setRejectionError("");
                    }}
                    placeholder="Explain why the leave request is being rejected…"
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
                    onClick={() => setConfirmAction("reject")}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => setConfirmAction("approve")}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                </div>
              </>
            )}

            {!canUpdate && leave.status === "pending" && (
              <p className="mt-4 text-xs text-gray-500 italic">
                You don’t have permission to approve or reject this leave
                request.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Approve */}
      <ConfirmDialog
        open={confirmAction === "approve"}
        title="Confirm Leave Approval"
        description={
          <>
            Are you sure you want to <strong>approve</strong> this leave request
            for <strong>{leave.employees?.full_name}</strong> from{" "}
            <strong>{leave.start_date}</strong> to{" "}
            <strong>{leave.end_date}</strong>?
          </>
        }
        confirmLabel="Yes, Approve"
        isLoading={loading}
        onConfirm={() => performAction("approved")}
        onClose={() => setConfirmAction(null)}
      />

      {/* Confirm Reject */}
      <ConfirmDialog
        open={confirmAction === "reject"}
        title="Confirm Leave Rejection"
        description={
          <>
            Are you sure you want to <strong>reject</strong> this leave request
            for <strong>{leave.employees?.full_name}</strong> from{" "}
            <strong>{leave.start_date}</strong> to{" "}
            <strong>{leave.end_date}</strong>?
            <br />
            <br />
            The rejection reason will be visible to the employee.
          </>
        }
        confirmLabel="Yes, Reject"
        danger
        isLoading={loading}
        onConfirm={() => performAction("rejected")}
        onClose={() => setConfirmAction(null)}
      />
    </>
  );
}
