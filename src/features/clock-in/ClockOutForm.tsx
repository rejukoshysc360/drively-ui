import React from "react";
import { useClockOut, useTodayAttendance } from "../attendance/hooks";
import { useOnLeaveToday } from "../employees/leave/hooks";
import { useAuth } from "../auth/AuthProvider";

export default function ClockOutForm() {
  const { user } = useAuth();
  const { data: today } = useTodayAttendance();
  const { data: onLeaveData } = useOnLeaveToday();
  const clockOut = useClockOut();

  const record = today?.attendance?.[0];
  const alreadyClockedIn = !!record?.clock_in;
  const alreadyClockedOut = !!record?.clock_out;
  const employeeId = user?.id;

  // ✅ Check if this user is on leave today
  const isOnLeaveToday = onLeaveData?.employees?.some(
    (emp: any) => emp.employee_id === employeeId
  );

  const doClockOut = () => {
    if (record?.id) {
      clockOut.mutate(record.id);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow rounded p-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Attendance</h2>

      {isOnLeaveToday ? (
        <>
          <button
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold"
          >
            On Leave Today
          </button>
          <p className="mt-2 text-gray-600 text-sm">
            You’re on approved leave today — no need to clock out.
          </p>
        </>
      ) : !alreadyClockedIn ? (
        <p className="text-gray-600 text-sm">
          You haven’t clocked in yet today.
        </p>
      ) : alreadyClockedOut ? (
        <>
          <button
            disabled
            className="px-4 py-2 bg-gray-400 text-white rounded font-semibold"
          >
            Clocked Out Today
          </button>
          <p className="mt-2 text-gray-600 text-sm">
            You clocked out at{" "}
            {record?.clock_out &&
              new Date(record.clock_out).toLocaleTimeString()}
          </p>
        </>
      ) : (
        <button
          onClick={doClockOut}
          className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700"
          disabled={clockOut.isLoading}
        >
          {clockOut.isLoading ? "Clocking out..." : "Clock Out"}
        </button>
      )}
    </div>
  );
}
