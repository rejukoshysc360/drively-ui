import { useEffect, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { useAuth } from "../../features/auth/AuthProvider";
import { useAttendance } from "./hooks";
import { useCan } from "../../../src/utils/permissions";
import { formatInTimeZone } from "date-fns-tz";

// ✅ ADDED
import ClockInForm from "../../features/clock-in/ClockInForm"; 

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ApiRow = {
  id: string | null;
  employee_id: string;
  clock_in?: string | null;
  clock_out?: string | null;
  status?: string | null;
  organization_id: string;
  employee_name?: string | null;
  employee_email?: string | null;
  geo_location_name?: string | null;
  is_late?: boolean | null;
  late_by_minutes?: number | null;
  created_at?: string;
};

type Row = {
  id: string;
  date: string;
  employee_name: string;
  employee_email?: string;
  status: string;
  check_in?: string;
  check_out?: string;
  total_hours?: number;
  location?: string;
  is_late?: boolean;
  late_by_minutes?: number;
  created_at?: string;
};

// ─────────────────────────────────────────────
// Mapper
// ─────────────────────────────────────────────
function toRow(r: ApiRow): Row {
  const checkIn = r.clock_in ?? undefined;
  const checkOut = r.clock_out ?? undefined;
  const total =
    checkIn && checkOut
      ? (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 36e5
      : undefined;

  let dateString = new Date().toISOString().slice(0, 10);
  const dateSource = (r as any).date || r.created_at;
  if (dateSource && typeof dateSource === "string") {
    dateString = dateSource.split("T")[0];
  }

  return {
    id: r.id || r.employee_id,
    date: dateString,
    employee_name: r.employee_name ?? "",
    employee_email: r.employee_email ?? "",
    status: r.status ?? "-",
    check_in: checkIn,
    check_out: checkOut,
    total_hours:
      typeof total === "number" && isFinite(total)
        ? Number(total.toFixed(2))
        : undefined,
    location:
      (r as any).geo_location_name ||
      (r as any).geo_location_clock_in ||
      "-",
    is_late: r.is_late ?? false,
    late_by_minutes: r.late_by_minutes ?? 0,
    created_at: r.created_at,
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function AttendanceListEmployee() {
  const can = useCan();
  const canViewOwn = can("attendance:view_own_record_only");

  if (!canViewOwn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500 text-sm">
        You don’t have permission to view your attendance records.
      </div>
    );
  }

  const { profile } = useAuth();
  const employeeId = profile?.id;
  const organization_country_code = profile?.organizations?.country_code;

  // ✅ TAB STATE
  const [activeTab, setActiveTab] = useState<"mark" | "history">("mark");

  const orgTimeZone =
    organization_country_code === "AE"
      ? "Asia/Dubai"
      : organization_country_code === "IN"
      ? "Asia/Kolkata"
      : organization_country_code === "AR"
      ? "America/Argentina/Buenos_Aires"
      : "UTC";

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE || 15;
  const today = new Date().toISOString().split("T")[0]; 
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState("all");

  useEffect(() => {
    setPage(1);
  }, [from, to, status]);

  const { data, isLoading, isFetching } = useAttendance(
    page,
    limit,
    undefined,
    from || undefined,
    to || undefined,
    employeeId,
    status
  );

  const apiRows: ApiRow[] = Array.isArray(data)
    ? data
    : (data?.attendance ?? data?.data ?? []);
  const rows = apiRows.map(toRow);
  const totalPages = data?.paginationMetaInfo?.totalPages ?? 1;

  const clearFilters = () => {
    setFrom(today);
    setTo(today);
    setStatus("all");
  };

  const formatTime = (dateStr?: string | null) =>
    dateStr ? formatInTimeZone(dateStr, orgTimeZone, "hh:mm a") : "—";

  const formatDate = (dateStr?: string | null) =>
    dateStr ? formatInTimeZone(dateStr, orgTimeZone, "EEE, dd MMM yyyy") : "—";

  const formatLateBy = (minutes?: number) => {
    const total = minutes || 0;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    if (mins > 0) return `${mins}m`;
    return "—";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-indigo-600" />
          My Attendance
        </h1>
        <p className="text-slate-600 mt-1">
          View your daily check-ins, check-outs, and work hours.
        </p>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab("mark")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === "mark"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-white"
          }`}
        >
          Mark Attendance
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === "history"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-white"
          }`}
        >
          Attendance History
        </button>
      </div>

      {/* MARK ATTENDANCE */}
      {activeTab === "mark" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <ClockInForm /> 
        </div>
      )}
            {activeTab === "history" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <Filter className="w-5 h-5" /> Filters
              </div>
              {(from || to || status !== "present") && (
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {APP_CONFIG.ATTENDANCE_FILTER_OPTIONS_ALL.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" /> From
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-10 text-gray-500">
              Loading attendance...
            </div>
          )}

          {/* Empty */}
          {!isLoading && rows.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-5">
                <Filter className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No attendance records found
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Try adjusting your filters or date range.
              </p>
            </div>
          )}

          {/* Table / Cards */}
          {!isLoading && rows.length > 0 && (
            <>
              {/* Mobile cards */}
              <div className="block lg:hidden space-y-4">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-gray-900">
                        {formatDate(row.date)}
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          {
                            present: "bg-green-100 text-green-800",
                            absent: "bg-red-100 text-red-800",
                            late: "bg-yellow-100 text-yellow-800",
                            completed: "bg-indigo-100 text-indigo-800",
                          }[row.status.toLowerCase()] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Clock In</p>
                        <p className="font-medium">
                          {formatTime(row.check_in)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Clock Out</p>
                        <p className="font-medium">
                          {formatTime(row.check_out)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Hours</p>
                        <p className="font-semibold text-indigo-700">
                          {row.total_hours !== undefined
                            ? `${row.total_hours.toFixed(2)}h`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Late By</p>
                        <p
                          className={`font-semibold ${
                            row.late_by_minutes > 60
                              ? "text-red-700"
                              : row.late_by_minutes > 15
                              ? "text-yellow-700"
                              : "text-gray-600"
                          }`}
                        >
                          {row.is_late
                            ? formatLateBy(row.late_by_minutes)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Clock In
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Clock Out
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Late By
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {rows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="px-6 py-5 text-sm text-gray-700">
                            {formatDate(row.date)}
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-700">
                            {formatTime(row.check_in)}
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-700">
                            {formatTime(row.check_out)}
                          </td>
                          <td
                            className={`px-6 py-5 text-right text-sm font-semibold ${
                              row.late_by_minutes > 60
                                ? "text-red-700"
                                : row.late_by_minutes > 15
                                ? "text-yellow-700"
                                : "text-gray-600"
                            }`}
                          >
                            {row.is_late
                              ? formatLateBy(row.late_by_minutes)
                              : "—"}
                          </td>
                          <td className="px-6 py-5 text-right font-semibold text-indigo-700">
                            {row.total_hours !== undefined
                              ? `${row.total_hours.toFixed(2)}h`
                              : "—"}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                {
                                  present: "bg-green-100 text-green-800",
                                  absent: "bg-red-100 text-red-800",
                                  late: "bg-yellow-100 text-yellow-800",
                                  completed: "bg-indigo-100 text-indigo-800",
                                }[row.status.toLowerCase()] ||
                                "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Page{" "}
                  <span className="text-indigo-600 font-bold">{page}</span> of{" "}
                  <span className="text-indigo-600 font-bold">
                    {totalPages}
                  </span>
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages || isFetching}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}