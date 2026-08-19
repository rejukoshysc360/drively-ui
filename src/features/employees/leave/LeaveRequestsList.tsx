import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Paperclip,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import FormDialog from "../../../components/ui/FormDialog";
import { useCan } from "../../../utils/permissions";
import { employeeLeaveApi } from "../../employees/leave/api";
import { useAuth } from "../../auth/AuthProvider";
import { useRoles } from "../../../utils/useRoles"; // ← Make sure this hook exists

export default function LeaveRequestsList({
  leaves,
  onView,
}: {
  leaves: any[];
  onView: (leave: any) => void;
}) {
  const { organization_id } = useAuth();
  const can = useCan();
  const canUpdateLeave = can("leaves:update"); // HR only
  const { isAdmin, isHR, isManager } = useRoles(); // ← Role detection

  const [attachments, setAttachments] = useState<Record<string, any[]>>({});
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [loadingAttachments, setLoadingAttachments] = useState<string | null>(null);

  const fetchAttachments = async (leave: any) => {
    if (attachments[leave.id]) return;
    setLoadingAttachments(leave.id);
    try {
      const res = await employeeLeaveApi.listAttachments(
        organization_id!,
        leave.employee_id || leave.user_id || leave.profile_id,
        leave.id
      );
      setAttachments((prev) => ({ ...prev, [leave.id]: res }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch attachments");
    } finally {
      setLoadingAttachments(null);
    }
  };

  if (!leaves || leaves.length === 0)
    return (
      <p className="text-sm text-gray-500 italic mt-2">
        No leave applications found for this type.
      </p>
    );

  // Helper to determine what status to display
    const getDisplayedStatus = (leave: any) => {
      // ✅ If HR has already finalized it, everyone (including manager) sees that status
      if (leave.status && leave.status !== "pending") {
        return leave.status;
      }

      // 🔹 Otherwise, manager’s decision drives it
      if (isManager) {
        return leave.manager_approval_status || "pending";
      }

      // 🔹 For HR/Admin fallback
      return leave.status || "pending";
    };


  // Helper for badge content
const renderStatusBadge = (leave: any) => {
  const displayedStatus = getDisplayedStatus(leave);

  // 🔹 Manager View (fixed logic)
  if (isManager) {
    // ✅ If HR already finalized — respect HR’s decision (skip "Awaiting Your Approval")
    if (leave.status && leave.status !== "pending") {
      if (leave.status === "approved") {
        return (
          <span className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" /> Approved
            {leave.manager_approval_status === "pending" && (
              <span
                className="text-xs text-gray-500 italic ml-1"
                title="Approved by HR due to manager unavailability"
              >
                ⓘ by HR
              </span>
            )}
          </span>
        );
      }

      if (leave.status === "rejected") {
        return (
          <span className="flex items-center text-red-600">
            <XCircle className="w-4 h-4 mr-1" /> Rejected
            {leave.manager_approval_status === "pending" && (
              <span
                className="text-xs text-gray-500 italic ml-1"
                title="Rejected by HR due to manager unavailability"
              >
                ⓘ by HR
              </span>
            )}
          </span>
        );
      }

      if (leave.status === "cancelled") {
        return (
          <span className="flex items-center text-gray-600">
            <XCircle className="w-4 h-4 mr-1" /> Cancelled
          </span>
        );
      }

      if (leave.status === "cancel_approved") {
        return (
          <span className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" /> Cancel Request Approved
          </span>
        );
      }

      if (leave.status === "cancel_rejected") {
        return (
          <span className="flex items-center text-orange-600">
            <XCircle className="w-4 h-4 mr-1" /> Cancel Request Rejected
          </span>
        );
      }

      if (leave.status === "pending_cancel_approval") {
        return (
          <span className="flex items-center text-indigo-600">
            <RefreshCw className="w-4 h-4 mr-1 animate-spin-slow" />
            Awaiting Cancel Approval
          </span>
        );
      }
    }

    // 🕓 Manager still needs to act (only if HR has NOT finalized)
    if (
      leave.status === "pending" &&
      leave.manager_approval_status === "pending"
    ) {
      return (
        <span className="flex items-center text-yellow-600">
          <Clock className="w-4 h-4 mr-1" /> Awaiting Your Approval
        </span>
      );
    }

    // 🟦 Manager approved, waiting for HR
    if (
      leave.manager_approval_status === "approved" &&
      leave.status === "pending"
    ) {
      return (
        <span className="flex items-center text-blue-600">
          <CheckCircle className="w-4 h-4 mr-1" /> Approved by You – Awaiting HR
        </span>
      );
    }

    // ✅ Both approved
    if (
      leave.manager_approval_status === "approved" &&
      leave.status === "approved"
    ) {
      return (
        <span className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" /> Approved
        </span>
      );
    }

    // ❌ HR rejected after manager approved
    if (
      leave.manager_approval_status === "approved" &&
      leave.status === "rejected"
    ) {
      return (
        <span className="flex items-center text-red-600">
          <XCircle className="w-4 h-4 mr-1" /> Rejected by HR
        </span>
      );
    }

    // ❌ Manager rejected
    if (leave.manager_approval_status === "rejected") {
      return (
        <span className="flex items-center text-red-600">
          <XCircle className="w-4 h-4 mr-1" /> Rejected by You
        </span>
      );
    }
  }

  // 🔹 HR / Admin View (unchanged)
  if (displayedStatus === "pending") {
    if (leave.manager_approval_status === "approved") {
      return (
        <span className="flex items-center text-blue-600">
          <Clock className="w-4 h-4 mr-1" /> Manager Approved – Awaiting HR
        </span>
      );
    }

    if (leave.manager_approval_status === "rejected") {
      return (
        <span className="flex items-center text-red-600">
          <XCircle className="w-4 h-4 mr-1" /> Rejected by Manager
        </span>
      );
    }

    return (
      <span className="flex items-center text-yellow-600">
        <Clock className="w-4 h-4 mr-1" /> Pending Manager Approval
      </span>
    );
  }

  if (displayedStatus === "approved") {
    return (
      <span className="flex items-center text-green-600">
        <CheckCircle className="w-4 h-4 mr-1" /> Approved
      </span>
    );
  }

  if (displayedStatus === "rejected") {
    return (
      <span className="flex items-center text-red-600">
        <XCircle className="w-4 h-4 mr-1" /> Rejected
      </span>
    );
  }

  if (displayedStatus === "cancelled") {
    return (
      <span className="flex items-center text-gray-600">
        <XCircle className="w-4 h-4 mr-1" /> Cancelled
      </span>
    );
  }

  if (displayedStatus === "pending_cancel_approval") {
    return (
      <span className="flex items-center text-indigo-600">
        <RefreshCw className="w-4 h-4 mr-1 animate-spin-slow" />
        Awaiting Cancel Approval
      </span>
    );
  }

  if (displayedStatus === "cancel_rejected") {
    return (
      <span className="flex items-center text-orange-600">
        <XCircle className="w-4 h-4 mr-1" /> Cancel Request Rejected
      </span>
    );
  }

  if (displayedStatus === "cancel_approved") {
    return (
      <span className="flex items-center text-green-600">
        <CheckCircle className="w-4 h-4 mr-1" /> Cancel Request Approved
      </span>
    );
  }

  return <span className="text-gray-500">Unknown</span>;
};


  return (
    <div className="overflow-x-auto bg-white border rounded mt-4">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2">Dates</th>
            <th className="px-4 py-2">Requested Days</th>
            <th className="px-4 py-2">Approved Days</th>
            <th className="px-4 py-2">Reason</th>
            <th className="px-4 py-2">Attachments</th>
            <th className="px-4 py-2">Status</th>
            {(canUpdateLeave || isManager) && <th className="px-4 py-2 text-right">Actions</th>}
          </tr>
        </thead>

        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id} className="border-t hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2 text-gray-700">
                {leave.created_at
                  ? new Date(leave.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>

              <td className="px-4 py-2">
                {leave.start_date} → {leave.end_date}
              </td>

              <td className="px-4 py-2">{leave.days_applied}</td>

              <td className="px-4 py-2">
                {leave.days_approved ? Number(leave.days_approved).toFixed(1) : "-"}
              </td>

              <td className="px-4 py-2">{leave.notes || "-"}</td>

              {/* Attachments */}
              <td className="px-4 py-2">
                {attachments[leave.id]?.length ? (
                  <div className="space-y-1">
                    {attachments[leave.id].map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between border p-1.5 rounded bg-gray-50 text-xs"
                      >
                        <span className="truncate max-w-[120px]">{doc.file_name}</span>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="text-indigo-600 hover:underline font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => fetchAttachments(leave)}
                    disabled={loadingAttachments === leave.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition text-xs font-medium"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {loadingAttachments === leave.id ? "Loading..." : "View Attachments"}
                  </button>
                )}
              </td>

              {/* Status Badge – Role-aware */}
              <td className="px-4 py-2 font-medium">
                {renderStatusBadge(leave)}
              </td>

             {/* Actions – Show for HR and Managers */}
{(canUpdateLeave && !isManager) ||
(isManager &&
  [
    "pending",
    "approved",
    "rejected",
    "cancel_approved",
    "cancel_rejected",
    "cancelled",
  ].includes(leave.status)) ? (
  <td className="px-4 py-2 text-right">
    <button
      className="px-3 py-1 border rounded text-xs hover:bg-gray-50 flex items-center justify-end ml-auto"
      onClick={() => onView(leave)}
    >
      <FileText className="w-4 h-4 inline mr-1" />
      {canUpdateLeave && !isManager ? "View / Manage" : "Review"}
    </button>
  </td>
) : (
  <td className="px-4 py-2 text-right">--</td>
)}
            </tr>
          ))}
        </tbody>
      </table>

      {/* File Preview Modal */}
      {previewDoc && (
        <FormDialog
          open={!!previewDoc}
          title={`Preview — ${previewDoc.file_name}`}
          maxWidth="max-w-2xl"
          onClose={() => setPreviewDoc(null)}
        >
          <div className="h-[80vh] w-full">
            <iframe
              src={previewDoc.presigned_url || previewDoc.url}
              className="w-full h-full rounded"
            />
          </div>
        </FormDialog>
      )}
    </div>
  );
}