import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Download,
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useProjectBurnReport, ProjectBurnRow } from "./useProjectBurnReport";
import ProjectBurnHelpOverlay from "./ProjectBurnHelpOverlay";

import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

// ✅ Full Project Burn Report (Burn-Up / Burn-Down)
export default function ProjectBurnReportPage() {

  const [from, setFrom] = useState(() =>
  dayjs.utc().startOf("month").format("YYYY-MM-DD")
);
const [to, setTo] = useState(() =>
  dayjs.utc().format("YYYY-MM-DD")
);

  const [granularity, setGranularity] = useState<"day" | "week" | "month">("week");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showHelp, setShowHelp] = useState(false);

  const { data = [], isLoading } = useProjectBurnReport(from, to, granularity);

  const totals = useMemo(() => {
    const est = data.reduce((s, r) => s + r.estimated_hours, 0);
    const act = data.reduce((s, r) => s + r.actual_hours, 0);
    const rem = data.reduce((s, r) => s + r.remaining_hours, 0);
    return { est, act, rem };
  }, [data]);

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

const exportCSV = () => {
  const header = [
    "Project Reference",
    "Project Code",
    "Project Name",
    "Project Display",
    "Planned (from Tasks)",
    "Actual",
    "Remaining",
    "%Spent",
    "RequiredActual",
    "DeltaHours",
    "Status",
  ];

  const lines = [header.map(safe).join(",")];

  data.forEach((r) => {
    const deltaLabel =
      r.delta_hours >= 0
        ? `${fmt(r.delta_hours)} (Behind)`
        : `${fmt(Math.abs(r.delta_hours))} (Ahead)`;

    lines.push(
  [
    safe(r.project_reference ?? ""),
    safe(r.project_code ?? ""),
    safe(r.project_name ?? ""),
    safe(projectLabel(r)),
    safe(fmt(r.estimated_hours)),
    safe(fmt(r.actual_hours)),
    safe(fmt(r.remaining_hours)),
    safe(r.percent_spent?.toFixed(1) ?? "0"),
    safe(fmt(r.required_actual_hours)),
    safe(deltaLabel),
    safe(r.status ?? ""),
  ].join(",")
);
  });

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Project_Burn_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};


  return (
    <div className="p-4 md:p-6">
      <Header
        exportCSV={exportCSV}
        isLoading={isLoading}
        onHelp={() => setShowHelp(true)}
      />

      <Filters
        from={from}
        to={to}
        granularity={granularity}
        setFrom={setFrom}
        setTo={setTo}
        setGranularity={setGranularity}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Stat label="Total Planned (from Tasks)" value={`${fmt(totals.est)} h`} />
        <Stat label="Total Actual Logged" value={`${fmt(totals.act)} h`} />
        <Stat label="Total Remaining" value={`${fmt(totals.rem)} h`} />
      </div>

 <Table data={data} expanded={expanded} toggle={toggle} isLoading={isLoading} />


      <ProjectBurnHelpOverlay open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

/* ✅ HEADER */
function Header({ exportCSV, isLoading, onHelp }: any) {
  return (
    <div className="mb-5 flex flex-col md:flex-row md:items-end gap-3 justify-between">
<div>
  <h1 className="text-2xl font-bold">Project Burn-Down / Burn-Up</h1>
  <p className="text-sm text-gray-500">
    Reports ▸ Project Burn ▸ Derived from Task Planned Hours (best viewed end of week after timesheet updates)
  </p>
  <p className="text-xs text-purple-600 mt-1">
    💡 Tip: For best accuracy, set the <b>“To”</b> date to today or the end of a timesheet cycle.
  </p>
</div>
      <div className="flex gap-2">
        <button
          onClick={onHelp}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          <Info size={16} /> Help
        </button>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
          disabled={isLoading}
        >
          <Download size={16} /> Export
        </button>
      </div>
    </div>
  );
}

/* ✅ FILTERS */
function Filters({ from, to, granularity, setFrom, setTo, setGranularity }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm mb-5">
      <div className="flex items-center gap-2 mb-3 text-gray-600">
        <Filter size={16} />
        <span className="font-medium">Filters</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <InputDate label="From" value={from} onChange={setFrom} />
        <InputDate label="To" value={to} onChange={setTo} />
        <div>
          <label className="text-xs text-gray-500">Granularity</label>
          <select
            className="input w-full h-9"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as any)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function InputDate({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="date"
        className="input w-full h-9"
        value={value}
        onChange={(e) =>
          onChange(dayjs.utc(e.target.value).format("YYYY-MM-DD"))
        }
      />
    </div>
  );
} 

/* ✅ TABLE + DETAILS */
function Table({ data, expanded, toggle, isLoading }: any) {
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">Project</th>
              <th className="text-right px-4 py-2">Planned (from Tasks)</th>
              <th className="text-right px-4 py-2">Actual</th>
              <th className="text-right px-4 py-2">Remaining</th>
              <th className="px-4 py-2">Spent %</th>
              <th className="text-right px-4 py-2">Req. Hours</th>
              <th className="text-right px-4 py-2">Gap</th>
              <th className="text-center px-4 py-2">Status</th>
              <th className="text-center px-4 py-2 w-12">More</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <RowLoading />
            ) : !data.length ? (
              <RowEmpty />
            ) : (
              data.map((row: ProjectBurnRow) => (
                <React.Fragment key={row.project_id}>
                  <RowPrimary row={row} expanded={expanded} toggle={toggle} />
                  {expanded[row.project_id] && <RowDetails row={row} colSpan={9} />}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowLoading() {
  return (
    <tr>
      <td colSpan={9} className="text-center py-8 text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span>Loading report data…</span>
        </div>
      </td>
    </tr>
  );
}


function RowPrimary({ row, expanded, toggle }: any) {
  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium"> {projectLabel(row)} </td>
      <td className="px-4 py-2 text-right">{fmt(row.estimated_hours)} h</td>
      <td className="px-4 py-2 text-right">{fmt(row.actual_hours)} h</td>
      <td className="px-4 py-2 text-right">{fmt(row.remaining_hours)} h</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <PercentBar value={row.percent_spent} />
          <span className="text-xs text-gray-600 whitespace-nowrap">
            {row.percent_spent.toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="px-4 py-2 text-right">{fmt(row.required_actual_hours)} h</td>
      <td className="px-4 py-2 text-right">
  <span
    className={
      row.delta_hours >= 0
        ? "text-rose-600 font-semibold"   // red if behind
        : "text-green-600 font-semibold"  // green if ahead
    }
  >
    {fmt(Math.abs(row.delta_hours))} h
  </span>
</td>

      <td className="px-4 py-2 text-center">
        <StatusPill status={row.status} />
      </td>
      <td className="px-2 py-2 text-center">
        <button
          onClick={() => toggle(row.project_id)}
          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
        >
          {expanded[row.project_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </td>
    </tr>
  );
}

function RowDetails({ row, colSpan }: any) {
  return (
    <tr className="bg-gray-50/60 border-t">
      <td colSpan={colSpan} className="px-4 py-3 align-top max-h-[75vh] overflow-y-auto">
        <div className="overflow-x-auto max-w-full">
          {/* ✅ Responsive layout for all screen sizes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            
            {/* 🔹 Performance Summary */}
            <Card title="Performance Insight">
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <strong>Timeline:</strong> {row.timeline_percent}% |{" "}
                  <strong>Work:</strong> {row.work_percent}%
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <strong>Expected Hours (So Far):</strong>{" "}
                  {fmt(row.required_actual_hours)} h
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                 <strong>Gap:</strong>{" "}
<span
  className={
    row.delta_hours >= 0
      ? "text-rose-600 font-semibold"
      : "text-green-600 font-semibold"
  }
>
  {fmt(Math.abs(row.delta_hours))} h{" "}
  {row.delta_hours >= 0 ? "(behind)" : "(ahead)"}
</span>



                </div>
              </div>
            </Card>

            {/* 🔹 Burn-Up Chart */}
            <Card title="Burn-Up (Cumulative Hours)">
              <Chart data={row.burn_up} />
            </Card>

            {/* 🔹 Burn-Down Chart */}
            <Card title="Burn-Down (Remaining Hours)">
              <Chart data={row.burn_down} />
            </Card>

            {/* 🔹 Employee Breakdown */}
            <Card title="Employee Breakdown">
              <div className="max-h-[220px] overflow-y-auto">
                <EmployeeTable employees={row.employees || []} />
              </div>
            </Card>
          </div>
        </div>
      </td>
    </tr>
  );
}



/* ✅ COMPONENTS */
function RowEmpty() {
  return (
    <tr>
      <td colSpan={9} className="text-center py-8 text-gray-500">
        No data.
      </td>
    </tr>
  );
}

function StatusPill({ status }: any) {
  const map: Record<string, string> = {
    ON_TRACK: "bg-green-100 text-green-700 border-green-200",
    AT_RISK: "bg-amber-100 text-amber-700 border-amber-200",
    OVER_BUDGET: "bg-rose-100 text-rose-700 border-rose-200",
    BEHIND_SCHEDULE: "bg-red-100 text-red-700 border-red-200", // ✅ changed from purple→red
    NO_BUDGET: "bg-gray-100 text-gray-600 border-gray-300",
  };

  const label: any = {
    ON_TRACK: "On Track",
    AT_RISK: "At Risk",
    OVER_BUDGET: "Over Budget",
    BEHIND_SCHEDULE: "Behind Schedule",
    NO_BUDGET: "No Budget",
  }[status];

  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${map[status]}`}
    >
      {label}
    </span>
  );
}


function PercentBar({ value }: { value: number }) {
  const percent = Math.max(0, value);
  const width = Math.min(100, percent);

  let color = "bg-indigo-600";
  if (percent > 100) color = "bg-rose-500";
  else if (percent >= 90) color = "bg-amber-500";
  else if (percent < 30) color = "bg-purple-500";

  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-3 ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function EmployeeTable({ employees }: any) {
  return (
    <div className="max-h-[220px] overflow-y-auto">
      <table className="w-full text-sm table-fixed">
        <thead className="text-gray-600">
          <tr>
            <th className="py-1 text-left w-2/3">Employee</th>
            <th className="py-1 text-right w-1/3">Hours</th>
          </tr>
        </thead>
        <tbody>
          {employees.length ? (
            employees.map((e: any) => (
              <tr key={e.employee_id} className="border-t">
                <td className="py-1 pr-2 truncate">{e.employee_name}</td>
                <td className="py-1 text-right whitespace-nowrap">
                  {fmt(e.hours)} h
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} className="text-gray-500 py-2 text-center">
                No hours recorded
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Card({ title, children }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
      {children}
    </div>
  );
}

function Chart({ data }: any) {
  const rows = data.map((d: any) => ({ name: d.bucket, val: d.value }));
  const hasNegative = rows.some((d) => d.val < 0);
  const dynamicWidth = Math.max(rows.length * 40, 400);

  return (
   <div className="w-full always-scrollbar">
      <div style={{ width: `${dynamicWidth}px`, height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              width={40}
              allowDecimals={false}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="val"
              stroke={hasNegative ? "#EF4444" : "#4F46E5"}
              strokeWidth={2}
              dot={{ r: 3, fill: hasNegative ? "#FCA5A5" : "#818CF8" }}
              activeDot={{ r: 5 }}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}




function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}

/* ✅ UTILS */
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n ?? 0);
}
function safe(v: any) {
  const s = String(v ?? "");
  const escaped = s.replace(/"/g, '""'); // escape quotes for CSV
  // wrap in quotes if comma / quote / newline exists (prevents column shifting in Excel)
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}


function projectLabel(row: any) {
  return (
    row?.project_reference?.trim() ||
    row?.project_code?.trim() ||
    row?.project_name?.trim() ||
    "-"
  );
}