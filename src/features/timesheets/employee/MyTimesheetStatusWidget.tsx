import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import dayjs from "dayjs";
import { useTimesheetsForMyself } from "../hooks";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function getWeekRange(offset: number) {
  const start = dayjs().startOf("week").add(offset, "week");
  const end = start.add(6, "day");

  return {
    start: start.format("YYYY-MM-DD"),
    end: end.format("YYYY-MM-DD"),
    label: `${start.format("DD MMM")} - ${end.format("DD MMM")}`,
  };
}

export default function MyTimesheetComplianceWidget() {
  const navigate = useNavigate();

  // ✅ Last 3 weeks (current + previous 2)
  const weeks = [
    getWeekRange(0),
    getWeekRange(-1),
    getWeekRange(-2),
  ];

  // ✅ Fetch each week
  const q0 = useTimesheetsForMyself(weeks[0].start, weeks[0].end);
  const q1 = useTimesheetsForMyself(weeks[1].start, weeks[1].end);
  const q2 = useTimesheetsForMyself(weeks[2].start, weeks[2].end);

  const isLoading = q0.isLoading || q1.isLoading || q2.isLoading;

  // ✅ Friday logic
  const today = dayjs();
  const isFridayOrLater = today.day() >= 5; // 5 = Friday

  // ✅ Correct compliance logic
  const results = useMemo(() => {
    const dataList = [q0.data ?? [], q1.data ?? [], q2.data ?? []];

    return dataList.map((weekData, index) => {
      const isPending =
        weekData.length === 0 ||
        weekData.some(
          (t: any) =>
            t.status !== "submitted" &&
            t.status !== "approved"
        );

      const isCurrent = index === 0;

      const show =
        isCurrent
          ? isFridayOrLater && isPending
          : isPending;

      return {
        label: weeks[index].label,
        weekStart: weeks[index].start, // ✅ ADDED
        isPending,
        isCurrent,
        show,
      };
    });
  }, [q0.data, q1.data, q2.data, isFridayOrLater, weeks]);

  const hasAnyPending = results.some((r) => r.show);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
          Timesheet Status
        </h2>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="text-sm text-gray-500 text-center py-3">
          Loading…
        </div>
      ) : !hasAnyPending ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              All Timesheets Completed
            </p>
            <p className="text-xs text-green-700">
              You are up to date for the last 3 weeks.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">

          {results.map((r, i) =>
            r.show ? (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  r.isCurrent
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 ${
                    r.isCurrent ? "text-yellow-600" : "text-red-600"
                  }`}
                />

                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      r.isCurrent ? "text-yellow-800" : "text-red-800"
                    }`}
                  >
                    {r.isCurrent
                      ? "This Week Pending"
                      : "Previous Week Pending"}
                  </p>

                  <p
                    className={`text-xs ${
                      r.isCurrent ? "text-yellow-700" : "text-red-700"
                    }`}
                  >
                    Week: {r.label}
                  </p>

                  <button
                    onClick={() =>
                      navigate(
                        `/employee/timesheets?week=${dayjs(r.weekStart)
                          .startOf("week")
                          .format("YYYY-MM-DD")}`
                      )
                    }
                    className="text-xs text-indigo-600 mt-1 hover:underline"
                  >
                    Complete now →
                  </button>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}