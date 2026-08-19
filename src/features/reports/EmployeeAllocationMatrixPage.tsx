import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { Loader2, Download, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useEmployeeAllocationReport, AllocationRow } from "./hooks";
import { useDepartments } from "../../features/organizations/settings/departments/hooks";
import TrendChart from "./TrendChart";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export default function EmployeeAllocationMatrixPage() {
  const [from, setFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [departmentId, setDepartmentId] = useState<string>("ALL");

  const { data = [], isLoading, isFetching } = useEmployeeAllocationReport(from, to);
  const { data: depData } = useDepartments(1, 200);
  const departments = depData?.departments ?? [];

  const filtered: AllocationRow[] = useMemo(() => {
    let rows = [...data];
    if (departmentId !== "ALL") {
      rows = rows.filter((r) => r.department?.id === departmentId);
    }
    return rows;
  }, [data, departmentId]);

  const totals = useMemo(() => {
    const ph = filtered.reduce((s, r) => s + (r.planned_hours || 0), 0);
    const ah = filtered.reduce((s, r) => s + (r.actual_hours || 0), 0);
    return { planned: ph, actual: ah };
  }, [filtered]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const exportCSV = () => {
    const lines = [
      ["Employee", "Department", "Top Project", "Planned", "Actual", "Util %", "Status"].join(","),
      ...filtered.map((r) => {
        const sorted = [...(r.projects ?? [])].sort((a, b) => (b.hours_logged ?? 0) - (a.hours_logged ?? 0));
        const top = sorted[0];
        return [
          safeCSV(r.employee_name),
          safeCSV(r.department?.name ?? "Unknown"),
          safeCSV(top ? `${top.project_name} (${fmt(top.hours_logged)}h)` : "—"),
          r.planned_hours,
          r.actual_hours,
          r.utilization_percent,
          r.status,
        ].join(",");
      }),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }));
    a.download = `Employee_Allocation_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-col md:flex-row md:items-end gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Allocation Matrix</h1>
          <p className="text-sm text-gray-500">Reports ▸ Allocation</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
          disabled={!filtered.length}
        >
          <Download size={16} /> Export
        </button>
      </div>

      <Filters
        from={from}
        to={to}
        setFrom={setFrom}
        setTo={setTo}
        departmentId={departmentId}
        setDepartmentId={setDepartmentId}
        departments={departments}
      />

      <SummaryCards count={filtered.length} totals={totals} />

      <TableContent
        filtered={filtered}
        isLoading={isLoading}
        isFetching={isFetching}
        expanded={expanded}
        toggle={toggle}
      />
    </div>
  );
}

function Filters({ from, to, setFrom, setTo, departmentId, setDepartmentId, departments }: any) {
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
          <label className="text-xs text-gray-500">Department</label>
          <select
            className="input w-full h-9"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="ALL">All</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function SummaryCards({ count, totals }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <StatCard label="Employees" value={count} />
      <StatCard label="Planned Hours" value={fmt(totals.planned)} />
      <StatCard label="Actual Hours" value={fmt(totals.actual)} />
    </div>
  );
}

function TableContent({ filtered, isLoading, isFetching, expanded, toggle }: any) {
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-left px-4 py-2">Department</th>
              <th className="text-left px-4 py-2">Project</th>
              <th className="text-right px-4 py-2">Planned</th>
              <th className="text-right px-4 py-2">Actual</th>
              <th className="text-center px-4 py-2">Util%</th>
              <th className="text-center px-4 py-2 w-12">More</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRow />
            ) : !filtered.length ? (
              <EmptyRow />
            ) : (
              filtered.map((row: AllocationRow) => (
                <EmployeeRows key={row.employee_id} row={row} expanded={expanded} toggle={toggle} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {isFetching && <div className="p-2 text-xs text-gray-500 text-center border-t">Refreshing…</div>}
    </div>
  );
}

function EmployeeRows({ row, expanded, toggle }: any) {
  const sorted = [...(row.projects ?? [])].sort((a, b) => (b.hours_logged ?? 0) - (a.hours_logged ?? 0));
  const top = sorted[0];
  const others = sorted.length - 1;
  const projectMixByDate = computeDailyMix(row.trend ?? [], row.projects ?? [], row.actual_hours ?? 0);

  return (
    <>
      <tr className="border-t">
        <td className="px-4 py-2 font-medium">{row.employee_name}</td>
        <td className="px-4 py-2">{row.department?.name ?? "Unknown"}</td>
        <td className="px-4 py-2">
          {top ? (
            <div className="flex items-center gap-1">
              {top.project_name} ({fmt(top.hours_logged)}h)
              {others > 0 && (
                <span
                  className="text-xs text-gray-500 cursor-help"
                  title={sorted.map((p) => `${p.project_name}: ${fmt(p.hours_logged)}h`).join("\n")}
                >
                  +{others}
                </span>
              )}
            </div>
          ) : "—"}
        </td>
        <td className="px-4 py-2 text-right">{fmt(row.planned_hours)}</td>
        <td className="px-4 py-2 text-right">{fmt(row.actual_hours)}</td>
        <td className="px-4 py-2 text-center">{row.utilization_percent.toFixed(1)}%</td>
        <td className="px-2 py-2 text-center">
          <button
            onClick={() => toggle(row.employee_id)}
            className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
          >
            {expanded[row.employee_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </td>
      </tr>

      {expanded[row.employee_id] && (
        <tr className="bg-gray-50/60 border-t">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ChartCard>
                <TrendChart
                  trend={row.trend ?? []}
                  dailyCapacity={row.daily_hours}
                  status={row.status}
                  projectMixByDate={projectMixByDate}
                />
              </ChartCard>
              <CardWide>
                <ProjectMixTable projects={sorted} total={row.actual_hours} />
              </CardWide>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ChartCard({ children }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="text-sm font-medium text-gray-700 mb-2">Utilization Trend</div>
      {children}
    </div>
  );
}
function CardWide({ children }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm lg:col-span-2">
      <div className="text-sm font-medium text-gray-700 mb-2">Project Mix (this period)</div>
      {children}
      <div className="text-[11px] text-gray-500 mt-2">*Mix for date range. Daily split inside chart tooltip.</div>
    </div>
  );
}

function ProjectMixTable({ projects, total }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[500px] w-full text-sm">
        <thead className="text-gray-600">
          <tr>
            <th className="text-left py-1">Project</th>
            <th className="text-right py-1">Hours</th>
            <th className="text-right py-1">% Time</th>
          </tr>
        </thead>
        <tbody>
          {projects.length ? (
            projects.map((p: any, idx: number) => {
              const pct = total ? (p.hours_logged / total) * 100 : 0;
              return (
                <tr key={idx} className="border-t">
                  <td className="py-1 pr-4">{p.project_name}</td>
                  <td className="py-1 text-right">{fmt(p.hours_logged)} h</td>
                  <td className="py-1 text-right">{pct.toFixed(1)}%</td>
                </tr>
              );
            })
          ) : (
            <EmptyCell colSpan={3} msg="No hours recorded." />
          )}
        </tbody>
      </table>
    </div>
  );
}

function LoadingRow() {
  return (
    <tr>
      <td colSpan={7} className="text-center py-8 text-gray-500">
        <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
        Loading…
      </td>
    </tr>
  );
}
function EmptyRow() {
  return (
    <tr>
      <td colSpan={7} className="text-center py-8 text-gray-500">No data.</td>
    </tr>
  );
}
function EmptyCell({ colSpan, msg }: any) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-gray-500 py-2">{msg}</td>
    </tr>
  );
}
function StatCard({ label, value }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function computeDailyMix(trend: any[], projects: any[], totalActual: number) {
  const map: any = {};
  for (const d of trend) {
    const mix: any = {};
    for (const p of projects) {
      if (!p.hours_logged || !totalActual) continue;
      mix[p.project_name] = {
        hours: p.hours_logged,
        pct: (p.hours_logged / totalActual) * 100,
      };
    }
    map[d.date ?? "unknown"] = mix;
  }
  return map;
}
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n ?? 0);
}
function safeCSV(s: any) {
  const v = String(s ?? "").replace(/"/g, '""');
  return /[,"\n]/.test(v) ? `"${v}"` : v;
}
function InputDate({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input type="date" className="input w-full h-9" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
