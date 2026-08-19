import { useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export default function EmployeeLeaveTab() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { profile } = useAuth();
  const role = profile?.role; // "hr" or "employee"

  return (
    <div className="space-y-6">
      <h2 className="text-base sm:text-lg font-semibold">Leave & Holiday Management</h2>

      {/* Leave Balance */}
      <div className="card p-4 bg-white shadow rounded space-y-2 text-sm sm:text-base">
        <h3 className="font-medium mb-2">Leave Balance</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-disc pl-5">
          <li>Annual Leave: 30 days</li>
          <li>Sick Leave: 90 days</li>
          <li>Maternity Leave: 60 days</li>
        </ul>
      </div>

      {/* Leave History (always visible) */}
      <div className="card p-4 bg-white shadow rounded space-y-2 text-sm sm:text-base">
        <h3 className="font-medium mb-2">Leave History</h3>
        {/* TODO: table from API */}
        <p className="text-gray-500 text-sm">No leave records yet.</p>
      </div>

      {/* Apply Leave (only employees see this) */}
      {role === "employee" && (
        <div className="card p-4 bg-white shadow rounded space-y-3 text-sm sm:text-base">
          <h3 className="font-medium">Apply for Leave</h3>
          <form className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Leave Type</label>
              <select className="input w-full">
                <option>Annual Leave</option>
                <option>Sick Leave</option>
                <option>Maternity Leave</option>
                <option>Emergency Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input type="date" className="input w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input type="date" className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Reason</label>
              <textarea className="input w-full" rows={2}></textarea>
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Submit Request
            </button>
          </form>
        </div>
      )}

      {/* Holiday Calendar (everyone can see) */}
      <div className="card p-4 bg-white shadow rounded space-y-2 text-sm sm:text-base">
        <h3 className="font-medium mb-2">Holiday Calendar</h3>
        <ul className="list-disc pl-5">
          <li>UAE: National Day – 2 Dec</li>
          <li>India: Independence Day – 15 Aug</li>
        </ul>
      </div>
    </div>
  );
}
