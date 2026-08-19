import { useParams } from "react-router-dom";
import AttendanceList from "../attendance/AttendanceList";
import { UserCheck, ShieldAlert } from "lucide-react";
import { useCan } from "../../utils/permissions";
import { useAuth } from "../../features/auth/AuthProvider";

export default function TimeSheetAttendance() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { profile } = useAuth();
  const can = useCan();

  const canViewAll = can("attendance:view");
  const canViewOwn = can("attendance:view_own_record_only");
  const loggedInEmployeeId = profile?.id;
  const isOwnRecord = employeeId === loggedInEmployeeId;

  // 🧠 Access restriction check
  if (!canViewAll && !(canViewOwn && isOwnRecord)) {
    return (
      <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500">
            You don’t have permission to view attendance records for this employee.
            Please contact your HR or Administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // 🧩 Fallback: missing employee ID
  if (!employeeId) {
    return (
      <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Invalid employee ID</p>
        </div>
      </div>
    );
  }

  // ✅ Authorized
  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-indigo-600" />
            Attendance Records
          </h1>
          <p className="text-slate-600 mt-1">
            Track daily check-ins and work hours
          </p>
        </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <AttendanceList employeeId={employeeId} />
      </div>
    </div>
  );
}
