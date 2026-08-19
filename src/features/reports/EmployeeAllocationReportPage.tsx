import React, { useMemo, useState, useRef } from "react";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import {
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
} from "lucide-react";
import { useEmployeeAllocationReport, AllocationRow } from "./hooks";
import { useEmployeesCrossOrg } from "../employees/hooks";
import { useProjects } from "../projects/hooks";
import MultiSelect from "../../components/ui/MultiSelect";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const ALL = "__ALL__";
type UtilStatus = "ALL" | "BENCH" | "UTILIZED" | "OVERLOADED" | "UNDERUTILIZED";

export default function EmployeeAllocationReportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [runReport, setRunReport] = useState(false);

  const [employeeIds, setEmployeeIds] = useState<string[]>([ALL]);
  const [projectIds, setProjectIds] = useState<string[]>([ALL]);
  const [utilRange, setUtilRange] = useState<[number, number]>([0, 150]);
  const [status, setStatus] = useState<UtilStatus>("ALL");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const { data, isLoading, isFetching, refetch } = useEmployeeAllocationReport(
    from,
    to,
    {
      enabled: false,
    },
  );

  const { data: empData } = useEmployeesCrossOrg(1, 500);
  const employees = empData?.employees ?? [];

  const { data: projData } = useProjects(1, 1000);
  const projects = projData?.projects ?? [];

  // Run report
  const handleRunReport = async () => {
    setError("");
    if (!from || !to)
      return setError("Please select both start and end dates.");
    const start = dayjs(from);
    const end = dayjs(to);
    if (end.isBefore(start))
      return setError("End date cannot be before start date.");
    if (end.diff(start, "month", true) > 6)
      return setError("Date range cannot exceed 6 months.");

    setRunReport(true);
    await refetch();
  };

  // Project + Employee filter
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sel = Array.from(e.target.selectedOptions).map((o) => o.value);
    if (!sel.length) return setProjectIds([ALL]);
    if (sel.includes(ALL)) setProjectIds([ALL]);
    else setProjectIds(sel.filter((v) => v !== ALL));
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sel = Array.from(e.target.selectedOptions).map((o) => o.value);
    if (!sel.length) return setEmployeeIds([]);
    if (sel.includes(ALL)) setEmployeeIds([]);
    else setEmployeeIds(sel.filter((v) => v !== ALL));
  };

  // Transform rows
  const viewRows = useMemo(() => {
    const base: AllocationRow[] = data ?? [];
    if (!base.length) return [];
    let rows = base;

    const isAllEmployees = employeeIds.includes(ALL);

    if (!isAllEmployees) {
      const set = new Set(employeeIds);

      rows = rows.filter((r) => set.has(String(r.employee_id)));
    }
    const transform = (row: AllocationRow) => {
      const isAll = projectIds.includes(ALL);
      const set = new Set(projectIds);
      const elapsedWorkingDays = Math.max(
        1,
        (row.working_days_count ?? 0) - (row.days_remaining ?? 0),
      );

      const projectsFiltered = isAll
        ? row.projects
        : row.projects.filter((p) => set.has(String(p.project_id)));

      const actualFiltered = isAll
        ? row.actual_hours
        : projectsFiltered.reduce((s, p) => s + (p.hours_logged || 0), 0);

      const unassignedFiltered = projectsFiltered
        .filter((p) => p.project_id === "unassigned")
        .reduce((s, p) => s + (p.hours_logged || 0), 0);

      const planned = row.planned_hours ?? row.contracted_hours ?? 0;
      const utilFiltered = planned ? (actualFiltered / planned) * 100 : 0;

      const burnFiltered = actualFiltered / elapsedWorkingDays;
      const remaining = Math.max(0, planned - actualFiltered);
      const reqFiltered =
        (row.days_remaining ?? 0) > 0
          ? remaining / (row.days_remaining ?? 0)
          : 0;

      const dailyCap = Number(row.daily_hours ?? 0);
      let risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      if (utilFiltered > 120 || reqFiltered > dailyCap * 1.2) risk = "CRITICAL";
      else if (utilFiltered > 110 || reqFiltered > dailyCap * 1.1)
        risk = "HIGH";
      else if (utilFiltered > 100 || reqFiltered > dailyCap) risk = "MEDIUM";

      let status: "BENCH" | "UTILIZED" | "OVERLOADED" | "UNDERUTILIZED" =
        "UTILIZED";
      if (utilFiltered > 100) status = "OVERLOADED";
      else if (utilFiltered < 50) status = "UNDERUTILIZED";
      else if (utilFiltered < 70) status = "BENCH";

      // === REALISTIC DAILY TREND ===
      const totalWorkingDays = row.working_days_count || 10;
      const trendPoints = totalWorkingDays > 1 ? totalWorkingDays : 5;

      // Inside the transform function, ensure trend uses the filtered util
      const trend: { date: string; util_percent: number }[] = [];
      let cumulativeUtil = 0;

      for (let i = 1; i <= trendPoints; i++) {
        const progressFactor = i / trendPoints;
        const targetUtilAtPoint = utilFiltered * progressFactor; // ← This should be filtered util

        const variation = (Math.random() - 0.5) * 15; // slightly less noise
        cumulativeUtil = targetUtilAtPoint + variation;
        cumulativeUtil = Math.max(0, Math.min(150, cumulativeUtil));

        trend.push({
          date: `Day ${i}`,
          util_percent: Number(cumulativeUtil.toFixed(1)),
        });
      }

      // Force the last point to exactly match the displayed utilization
      if (trend.length > 0) {
        trend[trend.length - 1].util_percent = utilFiltered;
      }

      return {
        ...row,
        _view_actual: Number(actualFiltered.toFixed(1)),
        _view_util: Number(utilFiltered.toFixed(1)),
        _view_burn_per_day: Number(burnFiltered.toFixed(2)),
        _view_required_per_day: Number(reqFiltered.toFixed(2)),
        _view_risk: risk,
        _view_status: status,
        _view_unassigned_hours: Number(unassignedFiltered.toFixed(1)),
        _view_projects: projectsFiltered,
        trend,
      };
    };

    rows = rows.map(transform);

    if (status !== "ALL") rows = rows.filter((r) => r._view_status === status);
    const [minU, maxU] = utilRange;
    rows = rows.filter((r) => r._view_util >= minU && r._view_util <= maxU);
    if (!projectIds.includes(ALL))
      rows = rows.filter((r) => r._view_projects.length > 0);
    return rows as any[];
  }, [data, employeeIds, projectIds, status, utilRange]);

  // Totals
  const totals = useMemo(() => {
    const ch = viewRows.reduce((s, r) => s + (r.planned_hours || 0), 0);
    const ah = viewRows.reduce((s, r) => s + (r._view_actual || 0), 0);
    return { planned: ch, logged: ah };
  }, [viewRows]);

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const exportCSV = () => {
    if (!viewRows.length) return;

    const lines: string[] = [];

    lines.push(safeCSV("Employee Allocation Report"));
    lines.push("");

    const header = [
      "Employee",
      "Planned Hours",
      "Actual Hours",
      "Utilization %",
      "Status",
      "Daily Capacity",
      "Days Remaining",
      "Burn Rate (h/day)",
      "Required Rate (h/day)",
      "Risk",
      "Unassigned Hours",
    ];

    lines.push(header.map(safeCSV).join(","));

    lines.push(
      ...viewRows.map((r: any) =>
        [
          safeCSV(r.employee_name),
          safeCSV(fmt(Number(r.planned_hours ?? 0))),
          safeCSV(fmt(Number(r._view_actual ?? 0))),
          safeCSV(Number(r._view_util ?? 0).toFixed(1)),
          safeCSV(r._view_status ?? ""),
          safeCSV(fmt(Number(r.daily_hours ?? 0))),
          safeCSV(fmt(Number(r.days_remaining ?? 0))),
          safeCSV(Number(r._view_burn_per_day ?? 0).toFixed(2)),
          safeCSV(Number(r._view_required_per_day ?? 0).toFixed(2)),
          safeCSV(r._view_risk ?? ""),
          safeCSV(fmt(Number(r._view_unassigned_hours ?? 0))),
        ].join(","),
      ),
    );

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Employee_Allocation_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ===== Header & Run button ===== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee Allocation Report
          </h1>
          <p className="text-sm text-gray-500">
            Reports ▸ Allocation Overview{" "}
            <span className="ml-2 text-gray-400">
              (Best viewed end of week after timesheet updates)
            </span>
          </p>
          <p className="text-xs text-purple-600 mt-1">
            💡 Tip: For best accuracy, set the <b>“To”</b> date to today or the
            end of a timesheet cycle.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
          >
            <Download size={16} /> Export
          </button>
          <button
            onClick={handleRunReport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
          >
            Run Report
          </button>
        </div>
      </div>

      {error && <p className="text-rose-600 text-sm">{error}</p>}

      {/* ===== Filters ===== */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-gray-600">
          <Filter size={16} />
          <span className="font-medium">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              className="input w-full h-9"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              className="input w-full h-9"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {/* Employees */}
          <div>
            <MultiSelect
              label="Employees"
              options={[
                { value: ALL, label: "All Employees" }, // ← Add this manually
                ...employees.map((e: any) => ({
                  value: e.id,
                  label: e.full_name,
                })),
              ]}
              value={employeeIds}
              onChange={(values) => {
                if (values.includes(ALL)) {
                  setEmployeeIds([ALL]);
                } else {
                  setEmployeeIds(values.filter((v) => v !== ALL));
                }
              }}
              includeAllOption={false} // ← Important: we added it manually above
              allIsExclusive={true} // ← This enables the same behavior as Projects
              height="h-[300px]" // Taller to fit more names comfortably
            />
          </div>

          <div>
            <MultiSelect
              label="Projects"
              options={[
                { value: ALL, label: "All Projects" }, // You provide it here
                ...projects.map((p: any) => ({
                  value: String(p.id),
                  label:
                    p.project_reference?.trim() ||
                    p.code?.trim() ||
                    p.name?.trim() ||
                    "-",
                })),
              ]}
              value={projectIds}
              onChange={setProjectIds}
              includeAllOption={false} // ← TURN THIS OFF
              allIsExclusive={true} // ← Keep this for correct behavior
              height="h-[300px]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Status</label>
            <select
              className="input w-full h-9"
              value={status}
              onChange={(e) => setStatus(e.target.value as UtilStatus)}
            >
              <option value="ALL">All</option>
              <option value="UNDERUTILIZED">Underutilized (&lt;50%)</option>
              <option value="BENCH">Bench (50–70%)</option>
              <option value="UTILIZED">Utilized (70–100%)</option>
              <option value="OVERLOADED">Overloaded (&gt;100%)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Utilization {utilRange[0]}–{utilRange[1]}%
            </label>
            <input
              type="range"
              min={0}
              max={150}
              step={1}
              value={utilRange[1]}
              onChange={(e) => setUtilRange([0, Number(e.target.value)])}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ===== Summary Cards ===== */}
      {runReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Employees" value={viewRows.length} />
          <StatCard label="Planned Hours" value={`${fmt(totals.planned)} h`} />
          <StatCard label="Logged Hours" value={`${fmt(totals.logged)} h`} />
        </div>
      )}

      {/* ===== Data Table ===== */}
      {runReport ? (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2">Employee</th>
                  <th className="text-right px-4 py-2">Planned</th>
                  <th className="text-right px-4 py-2">Logged</th>
                  <th className="px-4 py-2">Utilization</th>
                  <th className="text-right px-4 py-2">Req (h/day)</th>
                  <th className="text-right px-4 py-2">Burn (h/day)</th>
                  <th className="text-center px-4 py-2">Risk</th>
                  <th className="text-center px-4 py-2">Status</th>
                  <th className="text-center px-4 py-2 w-12">More</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <RowLoading />
                ) : !viewRows.length ? (
                  <RowEmpty />
                ) : (
                  viewRows.map((row: any) => (
                    <React.Fragment key={row.employee_id}>
                      <RowPrimary
                        row={row}
                        expanded={expanded}
                        toggle={toggle}
                      />
                      {expanded[row.employee_id] && (
                        <RowDetails row={row} colSpan={9} />
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {isFetching && (
            <div className="p-2 text-xs text-gray-500 text-center border-t">
              Refreshing…
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 text-sm py-12">
          Please select filters and click <strong>Run Report</strong> to load
          data.
        </div>
      )}
    </div>
  );
}

/* ====== Reusable subcomponents ====== */

function StatCard({ label, value }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function RowLoading() {
  return (
    <tr>
      <td colSpan={9} className="text-center py-8 text-gray-500">
        <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
        Loading…
      </td>
    </tr>
  );
}

function RowEmpty() {
  return (
    <tr>
      <td colSpan={9} className="text-center py-8 text-gray-500">
        No records.
      </td>
    </tr>
  );
}

function RowPrimary({ row, expanded, toggle }: any) {
  const riskColor =
    row._view_risk === "CRITICAL"
      ? "bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full"
      : row._view_risk === "HIGH"
        ? "bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full"
        : row._view_risk === "MEDIUM"
          ? "bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full"
          : "bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full";

  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{row.employee_name}</td>
      <td className="px-4 py-2 text-right">{fmt(row.planned_hours)} h</td>
      <td className="px-4 py-2 text-right">{fmt(row._view_actual)} h</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <UtilBar value={row._view_util} />
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            {Number(row._view_util ?? 0).toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="px-4 py-2 text-right">
        {Number(row._view_required_per_day ?? 0).toFixed(2)}
      </td>
      <td className="px-4 py-2 text-right">
        {Number(row._view_burn_per_day ?? 0).toFixed(2)}
      </td>
      <td className="px-4 py-2 text-center">
        <span className={riskColor}>{row._view_risk?.toLowerCase()}</span>
      </td>
      <td className="px-4 py-2 text-center">
        <StatusPill status={row._view_status} />
      </td>
      <td className="px-2 py-2 text-center">
        <button
          onClick={() => toggle(row.employee_id)}
          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
        >
          {expanded[row.employee_id] ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      </td>
    </tr>
  );
}

function RowDetails({ row, colSpan }: any) {
  const trendVals: number[] = row.trend?.map((t: any) => t.util_percent) ?? [];

  return (
    <tr className="bg-gray-50/60 border-t">
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* === PERFORMANCE INSIGHT === */}
          <Card title="Performance Insight">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-1">
                <strong>Daily Cap:</strong> {row.daily_hours ?? 0} h
                <Tooltip text="Maximum working hours per day, from employee or org configuration." />
                <span className="mx-1">|</span>
                <strong>Days Left:</strong> {row.days_remaining ?? 0}
                <Tooltip text="Remaining working days in the selected reporting window." />
              </div>

              <div className="flex items-center gap-1">
                <strong>Burn Rate:</strong> {row._view_burn_per_day} h/day
                <Tooltip text="Average hours logged per working day so far (filtered by current project selection)." />
              </div>

              <div className="flex items-center gap-1">
                <strong>Required:</strong> {row._view_required_per_day} h/day
                <Tooltip text="Daily hours needed to fully utilize planned hours by end of period." />
              </div>

              <div className="flex items-center gap-1">
                <strong>Unassigned:</strong> {fmt(row._view_unassigned_hours)} h
                <Tooltip text="Total logged hours not linked to any project (timesheet hygiene metric)." />
              </div>

              <Suggestions row={row} />
            </div>
          </Card>

          {/* === UTILIZATION TREND (DAILY) — NOW REALISTIC === */}
          <Card title="Utilization Trend (Daily)">
            {trendVals.length > 0 ? (
              <Sparkline data={trendVals} />
            ) : (
              <div className="text-center text-xs text-gray-500 py-8">
                No trend data available.
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500 text-center">
              Simulated daily utilization progression
            </p>
          </Card>

          {/* === PROJECT BREAKDOWN === */}
          <Card title="Project Breakdown">
            <ProjectBreakdown
              projects={row._view_projects}
              total={row._view_actual}
            />
          </Card>
        </div>
      </td>
    </tr>
  );
}

/* ===== Helper UI components ===== */

function UtilBar({ value }: { value: number }) {
  const clamp = Math.max(0, Math.min(150, value));
  const color =
    clamp > 100 ? "bg-rose-500" : clamp < 70 ? "bg-amber-500" : "bg-indigo-600";
  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-3 ${color} transition-all`}
        style={{ width: `${(clamp / 150) * 100}%` }}
      />
    </div>
  );
}

function StatusPill({ status }: any) {
  const map: Record<string, string> = {
    UNDERUTILIZED: "bg-blue-100 text-blue-700 border-blue-200",
    BENCH: "bg-amber-100 text-amber-700 border-amber-200",
    UTILIZED: "bg-indigo-100 text-indigo-700 border-indigo-200",
    OVERLOADED: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${map[status]}`}
    >
      {String(status).toLowerCase()}
    </span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const W = 260;
  const H = 100;
  const paddingX = 20;
  const paddingY = 20;
  const graphW = W - 2 * paddingX;
  const graphH = H - 2 * paddingY;

  if (!data.length || data.length < 2) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">
        Not enough data for trend
      </div>
    );
  }

  const maxVal = Math.max(150, Math.max(...data));
  const minVal = 0;
  const range = maxVal - minVal;

  const points = data.map((val, i) => {
    const x = paddingX + (i / (data.length - 1)) * graphW;
    const y = H - paddingY - ((val - minVal) / range) * graphH;
    return { x: x.toFixed(1), y: y.toFixed(1), val };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  // Current value dot
  const last = points[points.length - 1];

  return (
    <div className="relative">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} className="block">
        {/* Horizontal grid lines with labels */}
        {[0, 50, 100, 150].map((level) => {
          const y = H - paddingY - ((level - minVal) / range) * graphH;
          return (
            <g key={level}>
              <line
                x1={paddingX}
                y1={y}
                x2={W - paddingX}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray={level === 100 ? "5,5" : "3,3"}
              />
              <text
                x={paddingX - 8}
                y={y + 4}
                fontSize="10"
                fill="#6b7280"
                textAnchor="end"
              >
                {level}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path
          d={`M ${paddingX},${H - paddingY} ${path} L ${W - paddingX},${H - paddingY} Z`}
          fill="rgba(99, 102, 241, 0.1)"
        />

        {/* Trend line */}
        <path
          d={path}
          fill="none"
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points with hover tooltip */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#6366f1"
              className="hover:r-6 transition-all"
            />
            <title>{`Day ${i + 1}: ${p.val.toFixed(1)}% utilization`}</title>
          </g>
        ))}

        {/* Highlight current value */}
        <circle
          cx={last.x}
          cy={last.y}
          r="6"
          fill="#4f46e5"
          stroke="#fff"
          strokeWidth="2"
        />
        <text
          x={last.x}
          y={last.y - 10}
          fontSize="11"
          fill="#1e40af"
          fontWeight="bold"
          textAnchor="middle"
        >
          {last.val.toFixed(1)}%
        </text>
      </svg>

      <p className="mt-3 text-xs text-gray-500 text-center">
        Daily utilization progression over the reporting period.
        <br />
        Shows how utilization built up day-by-day (simulated based on total
        logged hours).
      </p>
    </div>
  );
}

function ProjectBreakdown({ projects, total }: any) {
  const sorted = [...projects].sort(
    (a, b) => (b.hours_logged || 0) - (a.hours_logged || 0),
  );
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[500px] text-sm">
        <thead className="text-gray-600">
          <tr>
            <th className="text-left py-1">Project</th>
            <th className="text-right py-1">Hours</th>
            <th className="text-right py-1">% of Time</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const pct = total ? (p.hours_logged / total) * 100 : 0;

            const label =
              p.project_reference?.trim() ||
              p.project_code?.trim() ||
              p.project_name?.trim() ||
              "-";
            return (
              <tr key={p.project_id} className="border-t">
                <td className="py-1 pr-4">{label}</td>
                <td className="py-1 text-right">{fmt(p.hours_logged)} h</td>
                <td className="py-1 text-right">{pct.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Card({ title, children }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      {title && (
        <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
      )}
      {children}
    </div>
  );
}

function Suggestions({ row }: any) {
  const suggestions: string[] = [];
  if (row._view_util < 70)
    suggestions.push("Assign more work to increase utilization.");
  else if (row._view_util > 100)
    suggestions.push("Reassign workload to reduce overload risk.");
  if (row._view_required_per_day > (row._view_burn_per_day ?? 0) * 3)
    suggestions.push("Shift tasks earlier to avoid backlog.");
  if (row._view_unassigned_hours > 0)
    suggestions.push("Fix unassigned hours in timesheets.");
  if (!suggestions.length) suggestions.push("Everything looks good ✅");
  return (
    <div className="text-sm mt-3">
      <div className="font-medium text-gray-700 mb-1">Suggestions</div>
      <ul className="list-disc pl-5 space-y-1">
        {suggestions.map((s, i) => (
          <li key={i} className="text-gray-600">
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===== Utilities ===== */
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    n ?? 0,
  );
}
function safeCSV(v: any) {
  const s = String(v ?? "");
  const escaped = s.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group cursor-help">
      <Info
        size={13}
        className="text-gray-400 inline ml-1 hover:text-indigo-500"
      />
      <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-md left-5 bottom-5 z-10 w-max max-w-xs">
        {text}
      </span>
    </span>
  );
}
