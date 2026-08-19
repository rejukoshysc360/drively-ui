import { useState } from "react";
import {
  useEmployeeLeaves,
  useUpdateEmployeeLeave,
  useEmployeeAvailableLeave,
} from "../../employees/leave/hooks";
import { useAuth } from "../../auth/AuthProvider";
import { Filter, Info, ShieldAlert } from "lucide-react";
import { useParams } from "react-router-dom";
import FormDialog from "../../../components/ui/FormDialog";
import LeaveLedgerTabs from "./LeaveLedgerTabs";
import { useCan } from "../../../utils/permissions";

export default function LeaveApprovalsPage() {
  const { profile } = useAuth();
  const { employeeId } = useParams();

  const can = useCan();

  // 🔒 Permission checks
  const canViewAll = can("leaves:view");
  const canViewOwn = can("leaves:view_own_record_only");

  const loggedInEmployeeId = profile?.id;
  const isOwnRecord = employeeId === loggedInEmployeeId;

  // 🧠 If not allowed
  if (!canViewAll && !(canViewOwn && isOwnRecord)) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center text-gray-600 max-w-md px-6">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            You don’t have permission to view or approve other employees’ leave records.
            Please contact your HR or Administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Proceed if authorized
  const [page] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "cancelled"
  >("all");
  const [showAccrualDialog, setShowAccrualDialog] = useState(false);

  const { data, isLoading } = useEmployeeLeaves(employeeId!, page, limit);
  const updateLeave = useUpdateEmployeeLeave();

  const leaves = data?.leaves ?? [];
  const summary = data?.leave_summary;

  const firstLeaveTypeId = leaves?.[0]?.leave_type_id;
  const { data: available } = useEmployeeAvailableLeave(
    employeeId!,
    firstLeaveTypeId
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Leave Applications</h1>

      {/* Ledger Tabs */}
      <div className="mb-6">
        <LeaveLedgerTabs employeeId={employeeId!} />
      </div>

      {/* Info Button */}
      <div className="flex justify-start sm:justify-end mb-6">
        <button
          onClick={() => setShowAccrualDialog(true)}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 font-medium"
        >
          <Info className="w-4 h-4" />
          View Accrual Info
        </button>
      </div>

      {/* Accrual Info Dialog */}
      <FormDialog
        open={showAccrualDialog}
        title="Accrual Calculation Details"
        onClose={() => setShowAccrualDialog(false)}
      >
        <div className="text-sm text-gray-700 space-y-4 max-w-lg mx-auto">
          <p>
            This section explains how each leave balance number in your summary
            is calculated.
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Initial Accrued Days:</strong> Total leave earned at the
              start of the current year from monthly accruals, carry-forwards,
              or manual adjustments.
            </li>
            <li>
              <strong>Accrued Balance:</strong> Current system balance from
              audit logs, showing how much leave is available before new
              deductions.
            </li>
            <li>
              <strong>Remaining (Accrued):</strong> Real-time usable leave,
              calculated as{" "}
              <code className="bg-gray-100 px-1 rounded">
                Accrued Balance – Used Days
              </code>.
            </li>
            <li>
              <strong>Policy Year Reset:</strong> Values apply only to the
              current calendar year. Earlier accruals appear only if carried
              forward per policy.
            </li>
            <li>
              <strong>Carry-Forward Rules:</strong> Unused leave follows the
              company’s active policy (<em>carry_forward_only</em>,{" "}
              <em>encash_or_expire</em>, or <em>expire_only</em>).
            </li>
          </ul>

          <p className="text-xs text-gray-500 italic pt-2">
            Example: If you earned 2.5 days this year, used 2.5 days, and the
            audit shows 0 balance, your remaining accrued leave is 0.0 days.
          </p>
        </div>
      </FormDialog>
    </div>
  );
}
