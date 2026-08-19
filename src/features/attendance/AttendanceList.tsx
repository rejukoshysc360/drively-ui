import { useEffect, useState } from "react";
import Select from "react-select";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  UserCheck,
  X,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { useAuth } from "../../features/auth/AuthProvider";
import { useAttendance,useExportAttendance,useUpdateAttendanceByManager } from "./hooks";
import { useEmployees, useManagedEmployees } from "../employees/hooks";
import { useCan } from "../../../src/utils/permissions";
import { formatInTimeZone } from "date-fns-tz";
import { Eye, MapPin } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { format, parseISO } from "date-fns";
import { emitInfo } from "../../lib/info-bus";


// ─────────────────────────────────────────────
// Helper to format minutes → "8h 44m"
// ─────────────────────────────────────────────
function formatMinutes(minutes?: number): string {
  if (typeof minutes !== "number" || isNaN(minutes) || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function getFlagEmoji(tz?: string) {
  if (!tz) return "";
  if (tz.includes("Dubai")) return "🇦🇪";
  if (tz.includes("Kolkata")) return "🇮🇳";
  if (tz.includes("New_York")) return "🇺🇸";
  return "";
}


// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ApiRow = {
  id: string;
  employee_id: string;
  clock_in?: string | null;
  clock_out?: string | null;
  total_hours?: number;
  status?: string | null;
  organization_id: string;
  employees?: { id: string; email?: string | null; full_name?: string | null } | null;
  employee_name?: string | null;
  employee_email?: string | null;
  geo_location_name?: string | null;
  is_late?: boolean;
  late_by_minutes?: number;
  employee_timezone?: string;
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
  geo_location_clock_in?: string | null;
  geo_location_clock_out?: string | null;
  employee_timezone?: string;
  leave_label?: string;
  is_half_day?: boolean;
};

// ─────────────────────────────────────────────
// Mapper — preserve raw timestamps (with +04:00, etc.)
// ─────────────────────────────────────────────
function toRow(r: ApiRow): Row {
  return {
    id: r.id ,
    // ✅ Use backend-provided `r.date` if available
    date:
      (r as any).date?.split("T")[0] ||
      r.clock_in?.split("T")[0] ||
      r.created_at?.split("T")[0] ||
      "",
    employee_name: r.employee_name || r.employees?.full_name || "",
    employee_email: r.employee_email || r.employees?.email || "",
    status: r.status ?? "absent",
    leave_label: (r as any).leave_label ?? null,
    is_half_day: (r as any).is_half_day ?? false,
    check_in: r.clock_in ?? undefined,
    check_out: r.clock_out ?? undefined,
    total_hours: r.total_hours ?? undefined,
    location: r.geo_location_name || "-",
    is_late: r.is_late ?? false,
    late_by_minutes: r.late_by_minutes ?? 0,
    geo_location_clock_in: (r as any).geo_location_clock_in ?? null,
    geo_location_clock_out: (r as any).geo_location_clock_out ?? null,
    employee_timezone: r.employee_timezone ?? "UTC", 
  };
}



// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function AttendanceList({ employeeId }: { employeeId?: string }) {

  const can = useCan();
  const canEdit = can("attendance:update"); 


  const canViewAll = can("attendance:view");
  const canViewOwn = can("attendance:view_own_record_only");
  const hasAccess = canViewAll || canViewOwn;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");

  const [selectedRow, setSelectedRow] = useState<Row | null>(null);

  const exportAttendance = useExportAttendance();
  const [isExporting, setIsExporting] = useState(false);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500 text-sm">
        You don’t have permission to view attendance records.
      </div>
    );
  }

  const { profile } = useAuth();
 
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE || 15;
  const today = new Date().toISOString().split("T")[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeSearchInput, setEmployeeSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const updateAttendance = useUpdateAttendanceByManager();

  const handleSort = (column: string) => {
  if (sortBy === column) {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  } else {
    setSortBy(column);
    setSortOrder('asc');
  }
};

const startEdit = (row: Row) => {
  if (!row.id || !row.check_in) return; // 🚫 block absent

  setEditingRowId(row.id);

  const extractTime = (iso?: string | null) => {
    if (!iso) return "";
    const match = iso.match(/T(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : "";
  };

  setEditClockIn(extractTime(row.check_in));
  setEditClockOut(extractTime(row.check_out));
};

const buildISO = (time: string, baseIso?: string | null, tz?: string) => {
  if (!time) return null;

  const date = (baseIso || new Date().toISOString()).split("T")[0];

  const offset =
    tz === "Asia/Kolkata"
      ? "+05:30"
      : tz === "Asia/Dubai"
      ? "+04:00"
      : "+00:00";

  return `${date}T${time}:00${offset}`;
};


const handleExport = async () => {
  try {
    setIsExporting(true);

    const blob = await exportAttendance.mutateAsync({
      from,
      to,
      employeeId: selectedEmployee?.value || employeeId,
      status,
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `Attendance_${from || "start"}_${to || "end"}.xlsx`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
  } finally {
    setIsExporting(false);
  }
};

const saveEdit = async (row: Row) => {
  if (!editingRowId) return;
    // 🚫 BLOCK ABSENT / INVALID ROWS
  if (!row.id || !row.check_in) {
    emitInfo("Cannot edit absent record");
    return;
  }

  const tz = row.employee_timezone;

  const payload: any = {};

  const baseIso = row.check_in || row.check_out;

  const newClockIn = buildISO(editClockIn, baseIso, tz);
  const newClockOut = buildISO(editClockOut, baseIso, tz);

  // 🚨 VALIDATION
  if (editClockIn && editClockOut && editClockOut < editClockIn) {
    emitInfo("Clock-out cannot be before clock-in");
    return;
  }

  if (newClockIn) payload.clock_in = newClockIn;
  if (newClockOut) payload.clock_out = newClockOut;

  console.log("FINAL PAYLOAD:", payload);

await updateAttendance.mutateAsync({
  attendanceId: editingRowId,
  payload: payload,
});
  setEditingRowId(null);
};

const renderSortIcon = (column: string) => {
  if (sortBy !== column) return '↕';
  return sortOrder === 'asc' ? '↑' : '↓';
};

  // ─────────────────────────────────────────────
  // Determine organization timezone correctly
  // ─────────────────────────────────────────────
  const orgCountry =
    profile?.organization?.country_code ||
    profile?.organizations?.country_code ||
    profile?.country_code ||
    "AE";

  const orgTimezone =
    orgCountry.toUpperCase() === "AE"
      ? "Asia/Dubai"
      : orgCountry.toUpperCase() === "IN"
      ? "Asia/Kolkata"
      : orgCountry.toUpperCase() === "US"
      ? "America/New_York"
      : "UTC";

  // ✅ helper functions
// If backend already localized time (contains +offset), display it directly

function formatTimeRaw(iso?: string | null, tzLabel?: string) {
  if (!iso) return "—";
  // Match "2026-01-24T13:22:01+04:00"
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return "—";

  let hour = parseInt(m[1], 10);
  const minute = m[2];
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  const time = `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;

  const label =
    tzLabel === "Asia/Dubai" ? "AE" :
    tzLabel === "Asia/Kolkata" ? "IN" :
    tzLabel?.split("/")?.pop() || "";

  return `${time}${label ? ` (${label})` : ""}`;
}

function formatDateRaw(iso?: string | null) {
  if (!iso) return "—";
  const d = iso.split("T")[0];
  const date = new Date(d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}



  // Determine privilege level
  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
    ? [profile.roles]
    : [];
  const loggedInSlugs = roles.map((r: any) => r.slug?.toLowerCase?.());
  const isPrivilegedUser = ["admin", "hr", "manager"].some((r) =>
    loggedInSlugs.includes(r)
  );
  const isManager = loggedInSlugs.includes("manager");

  // Employee search
  const employeeSearchTerm =
    employeeSearchInput.length >= 3 ? employeeSearchInput.trim() : "";

    // Manager employees
const managedEmployeesQuery = useManagedEmployees(
  1,
  50,
  employeeSearchTerm,
   {
    crossOrg: true,
  }
);

const managedDefaultEmployeesQuery = useManagedEmployees(
  1,
  50,
  "",
   {
    crossOrg: true,
  }
);

// All employees (HR/Admin)
const allEmployeesQuery = useEmployees(
  1,
  50,
  employeeSearchTerm
);

const allDefaultEmployeesQuery = useEmployees(
  1,
  50,
  ""
);

// Final resolved data
const employeeSearchData = isManager
  ? managedEmployeesQuery.data
  : allEmployeesQuery.data;

const isSearchingEmployees = isManager
  ? managedEmployeesQuery.isLoading
  : allEmployeesQuery.isLoading;

const defaultEmployeeData = isManager
  ? managedDefaultEmployeesQuery.data
  : allDefaultEmployeesQuery.data;
 

  const employeeOptions = (employeeSearchData?.employees || []).map((e: any) => ({
    value: e.id,
    label: `${e.full_name} (${e.email || ""})`,
  }));

 
  const defaultEmployeeOptions = (defaultEmployeeData?.employees || []).map((e: any) => ({
    value: e.id,
    label: `${e.full_name} (${e.email || ""})`,
  }));

  useEffect(() => setPage(1), [from, to, status, selectedEmployee]);

  useEffect(() => {
  setPage(1);
}, [sortBy, sortOrder]);

  const { data, isLoading, isFetching } = useAttendance(
    page,
    limit,
    undefined,
    from || undefined,
    to || undefined,
    selectedEmployee?.value || employeeId,
    status,
    undefined,
    sortBy || 'created_at',
    sortOrder
  );

  const apiRows: ApiRow[] = Array.isArray(data)
    ? data
    : (data?.attendance ?? data?.data ?? []);
  const rows = apiRows.map(toRow);
  const totalPages = data?.paginationMetaInfo?.totalPages ?? 1;

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setStatus("all");
    setSelectedEmployee(null);
  };

  const isEditable = (row: Row) => {
  return !!row.id && !!row.check_in;
};

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {!employeeId && (
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-indigo-600" />
            Attendance Records
          </h1>
          <p className="text-slate-600 mt-1">
            Track daily check-ins and work hours
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
<div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">

  {/* Left */}
  <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
    <Filter className="w-5 h-5" />
    Filters
  </div>

  {/* Right */}
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:ml-auto">

    {(from || to || status !== "all" || selectedEmployee) && (
      <button
        onClick={clearFilters}
        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
      >
        Clear Filters
      </button>
    )}

    <button
      onClick={handleExport}
      disabled={isExporting}
      className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50"
    >
      {isExporting ? "Exporting..." : "Export Excel"}
    </button>

  </div>
</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isPrivilegedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee
              </label>
              <Select
                options={employeeSearchTerm ? employeeOptions : defaultEmployeeOptions}
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                onInputChange={setEmployeeSearchInput}
                placeholder="Type to search (min 3 chars)..."
                isClearable
                isLoading={isSearchingEmployees}
                isSearchable
                noOptionsMessage={() =>
                  employeeSearchInput.length < 3
                    ? "Type at least 3 characters"
                    : "No employees found"
                }
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "44px",
                    borderRadius: "0.75rem",
                    borderColor: "#d1d5db",
                  }),
                  menu: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>
          )}

          {isPrivilegedUser && (
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {APP_CONFIG.ATTENDANCE_FILTER_OPTIONS_ALL.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div> 
          )}

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
        <div className="text-center py-10 text-gray-500">Loading attendance...</div>
      )}

      {/* Empty */}
      {!isLoading && rows.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-5">
            <Filter className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No records found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Try adjusting your filters or date range.
          </p>
        </div>
      )}

      {/* Data Table / Cards */}
      {!isLoading && rows.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="block lg:hidden space-y-4">
            {rows.map((row) => (
              <div
                key={row.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
<div className="flex items-start gap-3 mb-3">
  {/* Avatar */}
  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
    {row.employee_name?.[0]?.toUpperCase() ?? "?"}
  </div>

  {/* Name + Email + Status */}
  <div className="flex-1 min-w-0">
    
    {/* NAME */}
    <p className="font-semibold text-gray-900 leading-tight break-words">
      {row.employee_name}
    </p>

    {/* EMAIL */}
    <p className="text-xs text-gray-500 truncate">
      {row.employee_email || "—"}
    </p>

    {/* 👇 STATUS MOVED DOWN */}
    <div className="flex flex-wrap gap-2 mt-2">
      
      {/* STATUS */}
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          {
            present: "bg-green-100 text-green-700",
            absent: "bg-red-100 text-red-700",
            late: "bg-yellow-100 text-yellow-700",
            clocked_in: "bg-indigo-100 text-indigo-700",
            on_leave: "bg-blue-100 text-blue-700",
          }[row.status?.toLowerCase()] || "bg-gray-100 text-gray-700"
        }`}
      >
        {row.status?.replace(/_/g, " ")}
      </span>

      {/* LEAVE */}
      {row.leave_label && (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            row.leave_label.toLowerCase().includes("pending")
              ? "bg-orange-100 text-orange-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {row.is_half_day ? "🌓 " : ""}
          {row.leave_label}
        </span>
      )}
    </div>
      
  </div>

  {/* 👁️ ICON (optional keep right) */}
  {(row.geo_location_clock_in || row.geo_location_clock_out) && (
    <button
      onClick={() => {
        setSelectedRow(row);
        setIsModalOpen(true);
      }}
      className="text-gray-500 hover:text-indigo-600 transition"
    >
      <Eye size={16} />
    </button>
  )}
</div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Date</p>
                    <p className="font-medium">{formatDateRaw(row.date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Hours</p>
                    <p className="font-semibold text-indigo-700">
                      {row.total_hours ? `${row.total_hours}h` : "—"}
                    </p>
                  </div>
                 {editingRowId === row.id && isEditable(row) ? (
  <div className="col-span-2 mt-2 space-y-3">

    {/* CLOCK IN */}
    <div>
      <p className="text-xs text-gray-500 mb-1">Clock In</p>
      <input
        type="time"
        value={editClockIn}
        onChange={(e) => setEditClockIn(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
    </div>

    {/* CLOCK OUT */}
    <div>
      <p className="text-xs text-gray-500 mb-1">Clock Out</p>
      <input
        type="time"
        value={editClockOut}
        onChange={(e) => setEditClockOut(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
    </div>

    {/* ACTIONS */}
    <div className="flex gap-3 pt-2">
      <button
        onClick={() => saveEdit(row)}
        disabled={updateAttendance.isPending}
        className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg text-sm flex justify-center items-center gap-2"
      >
        {updateAttendance.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4" /> Save
          </>
        )}
      </button>

      <button
        onClick={() => setEditingRowId(null)}
        className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg text-sm flex justify-center items-center gap-2"
      >
        <X className="w-4 h-4" /> Cancel
      </button>
    </div>
  </div>
) : (
  <>
    <div>
      <p className="text-xs text-gray-500">Clock In</p>
      <p className="font-medium">
        {formatTimeRaw(row.check_in, row.employee_timezone)}
      </p>
    </div>

    <div>
      <p className="text-xs text-gray-500">Clock Out</p>
      <p className="font-medium">
        {formatTimeRaw(row.check_out, row.employee_timezone)}
      </p>
    </div>
  </>
)}
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
                      {row.is_late ? formatMinutes(row.late_by_minutes) : "—"}
                    </p>
                  </div>
                  {canEdit && isEditable(row) && (
    <button
      onClick={() => startEdit(row)}
      className="mt-2 text-xs text-indigo-600 font-medium"
    >
      Edit Time
    </button>
  )}
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
                   <th
                  onClick={() => handleSort('employee_name')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none"
                >
                  Employee {renderSortIcon('employee_name')}
                </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
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
                    <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-5 font-medium text-gray-900">
                        {row.employee_name}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {row.employee_email || "—"}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        {formatDateRaw(row.date)}
                      </td>
                  <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
                   {editingRowId === row.id && isEditable(row) ? (
                      <input
                        type="time"
                        value={editClockIn}
                        onChange={(e) => setEditClockIn(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      formatTimeRaw(row.check_in, row.employee_timezone)
                    )}
                  </td>

<td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
 {editingRowId === row.id && isEditable(row) ? (
    <div className="flex items-center gap-3">
      
      <input
        type="time"
        value={editClockOut}
        onChange={(e) => setEditClockOut(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm h-9"
      />

<div className="flex items-center gap-2">

  {/* ✅ SAVE */}
  <button
    onClick={() => saveEdit(row)}
    disabled={updateAttendance.isPending}
    className="flex items-center justify-center w-8 h-8 rounded-md bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50 transition"
    title="Save"
  >
    {updateAttendance.isPending ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <Check className="w-4 h-4" />
    )}
  </button>

  {/* ❌ CANCEL */}
  <button
    onClick={() => setEditingRowId(null)}
    disabled={updateAttendance.isPending}
    className="flex items-center justify-center w-8 h-8 rounded-md bg-red-100 hover:bg-red-200 text-red-600 transition"
    title="Cancel"
  >
    <X className="w-4 h-4" />
  </button>

</div>

    </div>
  ) : (
    formatTimeRaw(row.check_out, row.employee_timezone)
  )}
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
                        {row.is_late ? formatMinutes(row.late_by_minutes) : "—"}
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-medium text-indigo-700">
                        {row.total_hours ? `${row.total_hours}h` : "—"}
                      </td>
<td className="px-6 py-5 text-center">
  <div className="flex items-center justify-center gap-2">
    
<span className="inline-flex items-center gap-2">
  {/* STATUS */}
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      {
        present: "bg-green-100 text-green-700",
        absent: "bg-red-100 text-red-700",
        late: "bg-yellow-100 text-yellow-700",
        clocked_in: "bg-indigo-100 text-indigo-700",
        on_leave: "bg-blue-100 text-blue-700",
      }[row.status?.toLowerCase()] || "bg-gray-100 text-gray-700"
    }`}
  >
    {row.status?.replace(/_/g, " ")}
  </span>

  {/* LEAVE LABEL */}
  {row.leave_label && (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        row.leave_label.toLowerCase().includes("pending")
          ? "bg-orange-100 text-orange-700"
          : "bg-purple-100 text-purple-700"
      }`}
    >
      {row.is_half_day ? "🌓 " : ""}
      {row.leave_label}
    </span>
  )}
</span>

    {/* 👇 EDIT BUTTON (ONLY MANAGER) */}
    {canEdit && isEditable(row) && (
      <button
        onClick={() => {
          setEditingRowId(row.id);

          const extractTime = (iso?: string | null) => {
            if (!iso) return "";
            const m = iso.match(/T(\d{2}):(\d{2})/);
            return m ? `${m[1]}:${m[2]}` : "";
          };

          setEditClockIn(extractTime(row.check_in));
          setEditClockOut(extractTime(row.check_out));
        }}
        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
      >
        Edit
      </button>
    )}
  </div>
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
      <div className="mt-10 flex flex-col items-center gap-4 px-4">
  <div className="flex items-center justify-center gap-3 w-full flex-nowrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
            className="flex-1 max-w-[140px] px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0 min-w-fit">
            Page <span className="text-indigo-600 font-bold">{page}</span> of{" "}
            <span className="text-indigo-600 font-bold">{totalPages}</span>
          </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isFetching}
             className="flex-1 max-w-[140px] px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* 👁️ Location Modal */}
{/* 👁️ Location Details Modal */}
 
{isModalOpen && selectedRow && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 relative">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-indigo-600" />
        Location Details
      </h3>

      <div className="space-y-4 text-sm">
        {/* Clock In */}
        <div>
          <p className="font-medium text-gray-700">Clock In</p>
          <p className="text-gray-600 mt-1">
            {selectedRow.check_in
              ? `${formatTimeRaw(selectedRow.check_in, selectedRow.employee_timezone)}`
              : "—"}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {selectedRow.geo_location_clock_in || "No location recorded"}
          </p>
        </div>

        {/* Clock Out */}
        <div className="border-t border-gray-200 pt-3">
          <p className="font-medium text-gray-700">Clock Out</p>
          <p className="text-gray-600 mt-1">
            {selectedRow.check_out
              ? `${formatTimeRaw(selectedRow.check_out, selectedRow.employee_timezone)}`
              : "—"}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {selectedRow.geo_location_clock_out || "No location recorded"}
          </p>
        </div>
      </div>

      <button
        onClick={() => setIsModalOpen(false)}
        className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl shadow transition"
      >
        Close
      </button>
    </div>
  </div>
)}



    </div>
  );
}
