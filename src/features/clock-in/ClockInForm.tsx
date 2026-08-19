import React, { useMemo } from "react";
import { Loader2, MapPin, Clock, CheckCircle2 } from "lucide-react";
import {
  useClockIn,
  useClockOut,
  useTodayAttendance,
} from "../attendance/hooks";
import { useOnLeaveToday } from "../employees/leave/hooks";
import { useAuth } from "../auth/AuthProvider";
import { formatInTimeZone } from "date-fns-tz";
import { useOrganization } from "../organizations/settings/preferences/hooks";

export default function ClockInForm() {
  const { user, organization_country_code } = useAuth();
  const [isClockingIn, setIsClockingIn] = React.useState(false);
  const [isClockingOut, setIsClockingOut] = React.useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = React.useState(false); // ✅ prevents flicker

  const {
    data: today,
    isLoading: todayLoading,
    isFetching: todayIsFetching,
  } = useTodayAttendance();

  const { data: onLeaveData } = useOnLeaveToday();
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  // 🏢 Fetch org setting for SHOW_CLOCK_OUT
  const { data: orgData } = useOrganization();
  const showClockOut = orgData?.working_time_settings?.SHOW_CLOCK_OUT ?? true;

  const employeeId = String(user?.id || "").trim();

  // 🕒 Determine org timezone dynamically
  const orgTimeZone =
    organization_country_code === "IN"
      ? "Asia/Kolkata"
      : organization_country_code === "AE"
      ? "Asia/Dubai"
      : "UTC";

  const record = useMemo(() => {
    const records = today?.attendance ?? [];
    if (!records.length) return null;
    return (
      records.find(
        (r: any) => String(r.employee_id || "").trim() === employeeId
      ) || null
    );
  }, [today, employeeId]);

  const hasClockedIn = !!record?.clock_in;
  const hasClockedOut = !!record?.clock_out;

  const isOnLeaveToday = onLeaveData?.employees?.some((emp: any) =>
    String(emp.id || emp.employee_id || "").trim() === employeeId
  );

  // 🌍 Reverse geocode helper
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "User-Agent": "HRApp/1.0" } }
      );
      const data = await res.json();
      const a = data.address || {};
      const parts = [
        a.road,
        a.village || a.suburb,
        a.state_district || a.county,
        a.state,
        a.country,
      ].filter(Boolean);
      return parts.join(", ") || data.display_name;
    } catch {
      return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    }
  };

  // 🕓 Handle Clock-In (with optional auto Clock-Out)
  const handleClockIn = () => {
    if (isClockingIn || clockIn.isPending) return;
    setIsClockingIn(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const address = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );

          // Step 1️⃣: Clock In
          const result = await clockIn.mutateAsync({
            geo_location_clock_in: address,
          });

          // Step 2️⃣: Auto Clock-Out if disabled in settings
          if (!showClockOut) {
            setIsAutoCompleting(false); // reset safely
          }
        } finally {
          setIsClockingIn(false);
        }
      },
      (err) => {
        alert("Location access failed: " + err.message);
        setIsClockingIn(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 🕔 Handle Clock-Out
  const handleClockOut = () => {
    if (!record?.id) return alert("No attendance record found to clock out.");
    if (isClockingOut || clockOut.isPending) return;
    setIsClockingOut(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const address = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          await clockOut.mutateAsync({
            attendanceId: record.id,
            geo_location_clock_out: address,
          });
        } finally {
          setIsClockingOut(false);
        }
      },
      (err) => {
        alert("Location access failed: " + err.message);
        setIsClockingOut(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (todayLoading) {
    return (
      <div className="max-w-sm mx-auto bg-white shadow-lg rounded-2xl p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
        <p className="mt-4 text-gray-500">Loading attendance...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-transparent space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        Daily Attendance
      </h2>

      {/* --- On Leave --- */}
      {isOnLeaveToday ? (
        <div className="text-center bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-lg font-semibold text-gray-700 mb-1">
            On Leave Today 🌴
          </p>
          <p className="text-gray-500">Enjoy your time off!</p>
        </div>
      ) : hasClockedIn && hasClockedOut ? (
        showClockOut ? (
          <>
            {/* ✅ Completed Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-center py-5 shadow-md">
              <div className="flex flex-col items-center justify-center space-y-1">
                <CheckCircle2 className="w-7 h-7 mb-1" />
                <p className="font-semibold text-lg">Completed for Today</p>
                <p className="text-indigo-100 text-sm">
                  You marked your attendance successfully
                </p>
              </div>
            </div>

            {/* 🕒 Timeline Card */}
            <div className="rounded-2xl bg-indigo-50 p-6 shadow-inner relative overflow-hidden">
              <div className="absolute left-8 top-10 bottom-10 w-px bg-indigo-200" />

              {/* Clock In */}
              <div className="relative pl-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <p className="font-medium text-gray-700">Clock In</p>
                  </div>

                  {record.is_late ? (
                    <span className="text-xs font-medium bg-red-100 text-red-700 px-3 py-1 rounded-full">
                      {(() => {
                        const total = record.late_by_minutes || 0;
                        const hours = Math.floor(total / 60);
                        const minutes = total % 60;
                        if (hours > 0 && minutes > 0)
                          return `Late by ${hours}h ${minutes}m`;
                        if (hours > 0) return `Late by ${hours}h`;
                        return `Late by ${minutes}m`;
                      })()}
                    </span>
                  ) : (
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      On Time
                    </span>
                  )}
                </div>

                <p className="text-xl font-bold text-indigo-700 mt-2">
                  {formatInTimeZone(record.clock_in, orgTimeZone, "hh:mm a")}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  {formatInTimeZone(record.clock_in, orgTimeZone, "dd MMM yyyy")}
                </p>

                {record.geo_location_clock_in && (
                  <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-gray-100 shadow-sm text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-indigo-600 mt-0.5" />
                    <p>{record.geo_location_clock_in}</p>
                  </div>
                )}
              </div>

              <div className="h-8" />

              {/* Clock Out */}
              <div className="relative pl-10">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <p className="font-medium text-gray-700">Clock Out</p>
                </div>

                <p className="text-xl font-bold text-indigo-700 mt-2">
                  {formatInTimeZone(record.clock_out, orgTimeZone, "hh:mm a")}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  {formatInTimeZone(record.clock_out, orgTimeZone, "dd MMM yyyy")}
                </p>

                {record.geo_location_clock_out && (
                  <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-gray-100 shadow-sm text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-indigo-600 mt-0.5" />
                    <p>{record.geo_location_clock_out}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-xl text-center shadow-sm border border-gray-100">
                <p className="text-xs uppercase text-gray-500 font-medium tracking-wider">
                  Total Hours
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {record.total_hours
                    ? `${record.total_hours.toFixed(2)}h`
                    : "—"}
                </p>
              </div>
            </div>
          </>
        ) : (
          // ✅ UAE — Compact confirmation (even if backend has clock_out)
          <div className="text-center bg-green-50 p-6 rounded-2xl shadow-sm border border-green-100">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-lg text-green-700">
              Attendance Confirmed
            </p>

            {record?.is_late ? (
              <div className="inline-block px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full mb-2">
                {(() => {
                  const total = record.late_by_minutes || 0;
                  const h = Math.floor(total / 60);
                  const m = total % 60;
                  if (h > 0 && m > 0) return `Late by ${h}h ${m}m`;
                  if (h > 0) return `Late by ${h}h`;
                  return `Late by ${m}m`;
                })()}
              </div>
            ) : (
              <div className="inline-block px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full mb-2">
                On Time
              </div>
            )}

            <p className="text-2xl font-bold text-gray-800">
              {formatInTimeZone(record.clock_in, orgTimeZone, "hh:mm a")}
            </p>
            <p className="text-sm text-gray-500">
              {formatInTimeZone(record.clock_in, orgTimeZone, "dd MMM yyyy")}
            </p>

            {record.geo_location_clock_in && (
              <div className="flex items-start justify-center gap-2 bg-white rounded-lg p-3 border border-gray-100 shadow-sm text-sm text-gray-600 mt-3">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                <p className="text-left">{record.geo_location_clock_in}</p>
              </div>
            )}
          </div>
        )
      ) : hasClockedIn && !hasClockedOut && !isAutoCompleting ? (
        showClockOut ? (
          <div className="space-y-6 text-center">
            <button
              onClick={handleClockOut}
              disabled={clockOut.isPending || isClockingOut || todayIsFetching}
              className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 shadow transition"
            >
              {clockOut.isPending || isClockingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Clocking Out...
                </>
              ) : (
                "Clock Out"
              )}
            </button>
            <div className="bg-indigo-50 p-5 rounded-xl shadow-inner">
              <Clock className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
              <p className="font-medium text-gray-700">Clocked in at</p>
              <p className="text-xl font-bold text-indigo-700">
                {formatInTimeZone(record.clock_in, orgTimeZone, "hh:mm a")}
              </p>
            </div>
          </div>
        ) : (
          // ✅ Auto-confirm view when SHOW_CLOCK_OUT = false
          <div className="text-center bg-green-50 p-6 rounded-2xl shadow-sm border border-green-100">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-lg text-green-700">
              Attendance Confirmed
            </p>
            <p className="text-sm text-gray-500 mt-1">
              You are automatically marked present for today.
            </p>
          </div>
        )
      ) : (
        <div className="text-center space-y-6">
          <button
            onClick={handleClockIn}
            disabled={clockIn.isPending || isClockingIn || todayIsFetching}
            className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 shadow transition"
          >
            {clockIn.isPending || isClockingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Clocking In...
              </>
            ) : (
              "Clock In"
            )}
          </button>

          <p className="text-gray-500 text-sm">
            Start your workday by clocking in
          </p>
        </div>
      )}
    </div>
  );
}
