// src/chart/TaskProgressOverlay.tsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useTaskProgress } from "../../../../features/timesheets/hooks";
import { GlobalContext } from "../state/Contexts/GlobalStateProvider";
import { useAuth } from "../../../../features/auth/AuthProvider";
import { useOrganization } from "../../../../features/organizations/hooks";
import { useHolidays } from "../../../../features/organizations/settings/hooks";

dayjs.extend(weekOfYear);

// Info overlays
import KeyCalculationsOverlay from "./KeyCalculationsOverlay";
import InterpretingReportOverlay from "./InterpretingReportOverlay";
import StatusLogicOverlay from "./StatusLogicOverlay";

type TaskProgressOverlayProps = {
  task: any;
  onClose: () => void;
};

const TaskProgressOverlay: React.FC<TaskProgressOverlayProps> = ({ task, onClose }) => {
  const { organization_id } = useAuth();
  const globalCTX = useContext(GlobalContext);
  const fallbackProjectId = globalCTX?.projectId;
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  const projectId = task.project_id ?? fallbackProjectId;
  const { data: progressData = [], isLoading: progressLoading } = useTaskProgress(projectId, task.id);

  // State for info overlays
  const [showKeyCalc, setShowKeyCalc] = useState(false);
  const [showInterpret, setShowInterpret] = useState(false);
  const [showStatusLogic, setShowStatusLogic] = useState(false);

  // === Organization Settings ===
  const { data: org, isLoading: orgLoading } = useOrganization(organization_id || "");
  const settings = org?.working_time_settings || {};
  const dailyHours = settings.DAILY_WORKING_HOURS ?? settings.ORG_DAILY_HOURS ?? 9;

  const workingDays = useMemo(() => {
    const days = settings.working_days ?? ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    return new Set(days.map((d: string) => d.toUpperCase()));
  }, [settings.working_days]);

  // === Task Dates ===
  const start = task.start_date ? dayjs(task.start_date) : task.start ? dayjs(task.start) : null;
  const end = task.end_date ? dayjs(task.end_date) : task.end ? dayjs(task.end) : null;
  const expected = task.expected_deadline ? dayjs(task.expected_deadline) : end;
  const today = dayjs();

  // === Holidays (using your existing hook) ===
  const yearsToFetch = useMemo(() => {
    if (!start || !expected) return [];
    const startYear = start.year();
    const endYear = expected.year();
    const years = new Set<number>();
    for (let y = startYear; y <= endYear; y++) years.add(y);
    return Array.from(years);
  }, [start, expected]);

  const holidayQueries = yearsToFetch.map((year) => useHolidays(1, 200, year)); // large limit to get all

  const holidaysLoading = holidayQueries.some((q) => q.isLoading);
  const allHolidays = holidayQueries.flatMap((q) => q.data?.holidays ?? []);

  const holidaySet = useMemo(() => {
    if (!start || !expected) return new Set<string>();
    const set = new Set<string>();
    for (const h of allHolidays) {
      const hDate = dayjs(h.date);
      if (hDate.isSameOrAfter(start) && hDate.isSameOrBefore(expected)) {
        set.add(hDate.format("YYYY-MM-DD"));
      }
    }
    return set;
  }, [allHolidays, start, expected]);

  // === Count Working Days (exclude weekends + holidays) ===
  const countWorkingDays = (from: dayjs.Dayjs | null, to: dayjs.Dayjs | null): number => {
    if (!from || !to || !from.isValid() || !to.isValid()) return 0;

    let count = 0;
    let cursor = from.clone();

    while (cursor.isBefore(to) || cursor.isSame(to, "day")) {
      const dayName = cursor.format("dddd").toUpperCase();
      const dateKey = cursor.format("YYYY-MM-DD");

      if (workingDays.has(dayName) && !holidaySet.has(dateKey)) {
        count++;
      }
      cursor = cursor.add(1, "day");
    }

    return count;
  };

  // === Derived Metrics ===
  const totalCompleted = progressData.reduce((sum, p) => sum + p.completed_hours, 0);
  const totalAllocated = progressData.reduce((sum, p) => sum + p.allocated_hours, 0);
  const totalHours = task.hours ?? totalAllocated ?? 0;

  const plannedWorkingDays = countWorkingDays(start, end || expected);
  const plannedEffort = plannedWorkingDays * dailyHours;

  const workProgress = totalHours > 0 ? totalCompleted / totalHours : 0;

  const totalWorkingDays = countWorkingDays(start, expected);
  const elapsedWorkingDays = countWorkingDays(start, today);
  const timeProgress = totalWorkingDays > 0 ? elapsedWorkingDays / totalWorkingDays : 0;

  let status: "ahead" | "on_track" | "behind" = "on_track";
  if (workProgress >= timeProgress + 0.1) status = "ahead";
  else if (workProgress <= timeProgress - 0.1) status = "behind";

  const daysRemaining = countWorkingDays(today, expected);
 
  const displayTimeProgress = Math.min(timeProgress, 1);
  const displayWorkProgress = workProgress; // allow >1 for overruns
  


  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const toggleExpanded = (employeeId: string) => {
    setExpandedEmployees((prev) => {
      const next = new Set(prev);
      next.has(employeeId) ? next.delete(employeeId) : next.add(employeeId);
      return next;
    });
  };

  const gap = (workProgress - timeProgress) * 100;
  const targetWorkByToday = (timeProgress * 100).toFixed(1);
  const remainingPercent = 100 - workProgress * 100;
  const remainingHours = totalHours - totalCompleted;

  const isLoading = progressLoading || orgLoading || holidaysLoading;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
          <p className="text-lg font-medium text-gray-700">Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center sm:items-end sm:justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white w-full h-full sm:rounded-t-3xl sm:max-w-4xl sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 pr-10">
              Task Progress: {task.name}
            </h3>
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 text-3xl leading-none transition"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {/* Summary Section */}
            <div className="py-6 space-y-4 text-sm text-gray-700 border-b border-gray-100">
              <p>
                <strong>Start:</strong> {start ? start.format("DD/MM/YYYY") : "-"} |{" "}
                <strong>End:</strong> {end ? end.format("DD/MM/YYYY") : "-"}
                <span className="ml-2 text-gray-500 italic text-xs">(Gantt scheduling dates)</span>
              </p>

              <p>
                <strong className="text-violet-700">Expected Deadline:</strong>{" "}
                {expected ? expected.format("DD/MM/YYYY") : "-"}
                {daysRemaining > 0 && (
                  <span className="ml-2 text-gray-500">({daysRemaining} working days left)</span>
                )}
                {daysRemaining === 0 && <span className="ml-2 text-gray-500">(Due today)</span>}
                {daysRemaining < 0 && (
                  <span className="ml-2 text-red-600">
                    ({Math.abs(daysRemaining)} working days overdue)
                  </span>
                )}
              </p>

              <p>
                <strong>Planned:</strong> {plannedWorkingDays || "-"} working days ({plannedEffort}h)
              </p>

              <p>
                <strong className="text-violet-700">Allocated:</strong> {totalAllocated}h |{" "}
                <strong className="text-violet-700">Completed:</strong> {totalCompleted}h
              </p>

              <p>
               <strong className="text-violet-700">Work Progress:</strong> {(displayWorkProgress * 100).toFixed(1)}% |{" "}
              <strong className="text-violet-700">Time Progress:</strong> {(displayTimeProgress * 100).toFixed(1)}%
              {workProgress > 1 && (
              <span className="ml-2 text-red-600 text-sm font-medium">
                ⚠ Overrun by {((workProgress - 1) * 100).toFixed(0)}%
              </span>
            )}
              </p>

              {/* Status Block */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="font-semibold text-base">
                  Status:{" "}
                  <span
                    className={
                      status === "ahead"
                        ? "text-green-600"
                        : status === "behind"
                        ? "text-red-600"
                        : "text-amber-600"
                    }
                  >
                    {status === "ahead" ? "Ahead of Schedule" : status === "behind" ? "Behind Schedule" : "On Track"}
                  </span>
                </p>

                <p className="mt-2 text-sm">
                  <strong>Gap:</strong>{" "}
                  <span className={gap > 0 ? "text-green-600" : gap < 0 ? "text-red-600" : "text-gray-600"}>
                    {gap > 0 ? "+" : ""}{gap.toFixed(1)}% ({gap > 0 ? "ahead" : gap < 0 ? "behind" : "on schedule"})
                  </span>
                </p>

                <p className="text-gray-600 italic mt-2 text-sm">
                  To stay on schedule, <strong>{targetWorkByToday}%</strong> should be done by today. Currently at <strong>{(workProgress * 100).toFixed(1)}%</strong>.
                </p>

                <p className="text-gray-600 italic text-sm">
                  Remaining effort: <strong>{remainingHours.toFixed(1)}h</strong> ({remainingPercent.toFixed(1)}% to finish)
                </p>
              </div>

              {/* Info Links */}
              <div className="mt-6 flex flex-wrap gap-6 text-indigo-600 text-sm font-medium">
                <button onClick={() => setShowKeyCalc(true)} className="hover:underline">
                  Key Calculations
                </button>
                <button onClick={() => setShowInterpret(true)} className="hover:underline">
                  How to Read Report
                </button>
                <button onClick={() => setShowStatusLogic(true)} className="hover:underline">
                  Status Logic
                </button>
              </div>
            </div>

            {/* Dual Progress Bar */}
            <div className="py-6 border-b border-gray-100">
              <div className="flex justify-between mb-4 text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-600 rounded-full"></div>
                  Work: {(workProgress * 100).toFixed(1)}%
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                  Time: {(timeProgress * 100).toFixed(1)}%
                </div>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-green-300/50" style={{ width: `${timeProgress * 100}%` }} />
                <div
                  className="absolute inset-0 bg-indigo-600 transition-all duration-700"
                  style={{ width: `${workProgress * 100}%` }}
                />
              </div>
            </div>

            {/* Calendar Timeline */}
            {start && expected && (
              <div className="py-6 border-b border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-4">Calendar Timeline</h4>
                {(() => {
                  const totalDays = Math.max(expected.diff(start, "day"), 1);
                  const tickCount = 7;

                  let tickType: "day" | "week" | "month" = "day";
                  let step = totalDays / (tickCount - 1);

                  if (totalDays > 180) {
                    tickType = "month";
                    step = expected.diff(start, "month") / (tickCount - 1);
                  } else if (totalDays > 30) {
                    tickType = "week";
                    step = expected.diff(start, "week") / (tickCount - 1);
                  }

                  const ticks = Array.from({ length: tickCount }).map((_, i) => {
                    if (tickType === "month") return start.add(Math.round(step * i), "month");
                    if (tickType === "week") return start.add(Math.round(step * i), "week");
                    return start.add(Math.round(step * i), "day");
                  });

                  return (
                    <>
                      <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden mb-4">
                        <div className="absolute inset-0 bg-green-300/50" />
                        <div
                          className="absolute inset-0 bg-indigo-500 transition-all duration-700"
                          style={{ width: `${Math.min(workProgress * 100, 100)}%` }}
                        />
                        {today.isAfter(start) && today.isBefore(expected) && (
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-red-600"
                            style={{ left: `${Math.min((today.diff(start, "day") / totalDays) * 100, 100)}%` }}
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-7 text-xs text-gray-600 mb-3">
                        {ticks.map((tick, i) => (
                          <div key={i} className="text-center text-[10px] sm:text-xs">
                            {tickType === "month"
                              ? tick.format("MMM YYYY")
                              : tickType === "week"
                              ? `Wk ${tick.week()}`
                              : tick.format("DD MMM")}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-green-300/60 rounded"></span> Planned
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-indigo-500 rounded"></span> Completed
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-3 bg-red-600"></span> Today
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Employee Section */}
            <div className="py-6">
              {progressData.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-base">
                  No assignees or timesheet entries yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {progressData.map((p) => {
                    const employeeId = String(p.employee.id);
                    const isExpanded = expandedEmployees.has(employeeId);

                    const empProgress =
                      p.allocated_hours > 0 ? (p.completed_hours / p.allocated_hours) * 100 : 0;
                    const remaining = Math.max(p.allocated_hours - p.completed_hours, 0);

                    let riskLevel: "low" | "medium" | "high" | "complete" = "low";
                    if (p.completed_hours >= p.allocated_hours) riskLevel = "complete";
                    else if (empProgress < timeProgress * 100 - 10) riskLevel = "high";
                    else if (Math.abs(empProgress - timeProgress * 100) <= 10) riskLevel = "medium";

                    const riskColor =
                      riskLevel === "high"
                        ? "text-red-600"
                        : riskLevel === "medium"
                        ? "text-amber-600"
                        : riskLevel === "complete"
                        ? "text-blue-600"
                        : "text-green-600";

                    const riskLabel =
                      riskLevel === "high"
                        ? "⚠️ At Risk"
                        : riskLevel === "medium"
                        ? "⏳ Monitor"
                        : riskLevel === "complete"
                        ? "✅ Complete"
                        : "🟢 On Track";

                    return (
                      <div key={employeeId} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleExpanded(employeeId)}
                        >
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {p.employee.full_name || "Unknown Employee"}
                            </h4>
                            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>{p.completed_hours}h / {p.allocated_hours}h</span>
                              <span>Remaining: {remaining}h</span>
                              <span className={`font-semibold ${riskColor}`}>{riskLabel}</span>
                            </div>
                          </div>
                          <button className="text-gray-500 hover:text-gray-700 text-2xl">
                            {isExpanded ? "▲" : "▼"}
                          </button>
                        </div>

                      <div className="mt-4">
  <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="absolute inset-0 bg-green-300/50"
      style={{ width: `${timeProgress * 100}%` }}
    />
    <div
      className={`absolute inset-0 ${
        p.completed_hours > p.allocated_hours
          ? "bg-red-500"
          : "bg-indigo-600"
      } transition-all duration-700`}
      style={{ width: `${Math.min(empProgress, 100)}%` }}
    />
  </div>

  <div className="mt-2 flex justify-between text-xs text-gray-600">
    <span>
      Work: {empProgress.toFixed(1)}%
      {p.completed_hours > p.allocated_hours && (
        <span className="text-red-600 font-semibold ml-1">
          (+{(p.completed_hours - p.allocated_hours).toFixed(1)}h)
        </span>
      )}
    </span>
    <span>Time: {(timeProgress * 100).toFixed(1)}%</span>
  </div>

  {p.completed_hours > p.allocated_hours && (
    <div className="mt-1 text-xs font-semibold text-red-600">
      ⚠ Overrun by {(p.completed_hours - p.allocated_hours).toFixed(1)}h (
      {((p.completed_hours / p.allocated_hours - 1) * 100).toFixed(0)}%)
    </div>
  )}
</div>

                        {isExpanded && (
                          <div className="mt-5 pt-5 border-t border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-3">Timesheet Timeline</h5>
                            {p.timeline.length === 0 ? (
                              <p className="text-sm text-gray-500 italic">No entries recorded.</p>
                            ) : (
                              <div className="overflow-x-auto -mx-5 px-5">
                                <div className="flex items-end gap-3 min-w-max py-4">
                                  {(() => {
                                    const sorted = [...p.timeline].sort(
                                      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                                    );
                                    const startDate = dayjs(sorted[0].date);
                                    const endDate = dayjs(sorted[sorted.length - 1].date);
                                    const fullTimeline: { date: string; hours: number }[] = [];

                                    let cursor = startDate;
                                    while (cursor.isBefore(endDate) || cursor.isSame(endDate)) {
                                      const found = sorted.find((t) =>
                                        dayjs(t.date).isSame(cursor, "day")
                                      );
                                      fullTimeline.push({
                                        date: cursor.format("YYYY-MM-DD"),
                                        hours: found ? found.hours : 0,
                                      });
                                      cursor = cursor.add(1, "day");
                                    }

                                    return fullTimeline.map((entry, i) => {
                                      const isToday = dayjs(entry.date).isSame(dayjs(), "day");
                                      const barHeight = Math.min(entry.hours * 6, 100);

                                      return (
                                        <div key={i} className="flex flex-col items-center w-12">
                                          <div
                                            className={`w-4 rounded-t-md transition-all ${
                                              entry.hours > 0
                                                ? isToday ? "bg-purple-600" : "bg-indigo-500"
                                                : isToday ? "bg-purple-300" : "bg-gray-300"
                                            }`}
                                            style={{ height: `${barHeight || 6}px` }}
                                            title={`${entry.date}: ${entry.hours}h`}
                                          />
                                          <span className="text-[10px] mt-1 font-medium text-gray-800">
                                            {entry.hours > 0 ? `${entry.hours}h` : ""}
                                          </span>
                                          <span
                                            className={`text-[9px] mt-1 ${
                                              isToday ? "text-purple-600 font-bold" : "text-gray-500"
                                            }`}
                                          >
                                            {dayjs(entry.date).format("MMM DD")}
                                          </span>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>

                                <div className="h-px w-full bg-gray-300 -mt-2 mb-3"></div>

                                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-indigo-500 rounded"></span> Logged
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-purple-600 rounded"></span> Today
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-gray-300 rounded"></span> None
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Overlays */}
      {showKeyCalc && <KeyCalculationsOverlay onClose={() => setShowKeyCalc(false)} />}
      {showInterpret && <InterpretingReportOverlay onClose={() => setShowInterpret(false)} />}
      {showStatusLogic && <StatusLogicOverlay onClose={() => setShowStatusLogic(false)} />}
    </>
  );
};

export default TaskProgressOverlay;