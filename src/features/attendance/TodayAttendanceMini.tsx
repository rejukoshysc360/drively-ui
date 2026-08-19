import React from "react";
import { useTodayAttendance } from "../../features/attendance/hooks";
import { useAuth } from "../../features/auth/AuthProvider";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarClock } from "lucide-react";

export function TodayAttendanceMini() {
  const { profile } = useAuth();
  const { data, isLoading } = useTodayAttendance();

  // 🌍 Determine org timezone
  const orgTimeZone = (() => {
    const cc = profile?.organizations?.country_code;
    switch (cc) {
      case "AE":
        return "Asia/Dubai";
      case "IN":
        return "Asia/Kolkata";
      case "AR":
        return "America/Argentina/Buenos_Aires";
      default:
        return "UTC";
    }
  })();

  const record = Array.isArray(data?.attendance)
    ? data.attendance[0]
    : Array.isArray(data)
    ? data[0]
    : null;

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Loading today’s attendance…
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm italic">
        No attendance record found for today.
      </div>
    );
  }

  // 🕒 Time formatting
  const formatTime = (dateStr?: string | null) =>
    dateStr ? formatInTimeZone(dateStr, orgTimeZone, "hh:mm a") : "—";

  const total =
    record.clock_in && record.clock_out
      ? (new Date(record.clock_out).getTime() -
          new Date(record.clock_in).getTime()) /
        36e5
      : null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <CalendarClock className="h-5 w-5 text-indigo-600" />
        Today’s Attendance Summary
      </h3>

      <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm sm:text-base">
          <div>
            <p className="text-slate-500 mb-1">Clock In</p>
            <p className="font-semibold text-slate-800">
              {formatTime(record.clock_in)}
            </p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">Clock Out</p>
            <p className="font-semibold text-slate-800">
              {formatTime(record.clock_out)}
            </p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">Total Hours</p>
            <p className="font-semibold text-indigo-700">
              {total !== null ? `${total.toFixed(2)}h` : "—"}
            </p>
          </div>
        </div> 
         
      </div>
    </div>
  );
}
