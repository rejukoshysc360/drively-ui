import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Download, Info } from "lucide-react";
import { useProjectPortfolioReport } from "./useProjectPortfolioReport";
import ProjectPortfolioHelpOverlay from "./ProjectPortfolioHelpOverlay";
import { createPortal } from "react-dom";

/* ================= TYPES ================= */
type PortfolioRow = {
  project_id: string;
  project_name: string;
  project_code?: string | null;
  project_reference?: string | null;
  estimated_hours: number;
  actual_hours: number;
  remaining_hours: number;
  work_percent: number;
  timeline_percent: number;
  required_actual_hours: number;
  delta_hours: number;
  status:
    | "ON_TRACK"
    | "AT_RISK"
    | "BEHIND_SCHEDULE"
    | "OVER_BUDGET"
    | "NO_BUDGET";
  employees_count: number;
};

/* ================= PAGE ================= */
export default function ProjectPortfolioReportPage() {
  const [from, setFrom] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [showHelp, setShowHelp] = useState(false);

  const { data: portfolioRows = [], isLoading } = useProjectPortfolioReport(
    from,
    to,
  );

  const rows: PortfolioRow[] = useMemo(
    () =>
      portfolioRows.map((p: any) => ({
        project_id: p.project_id,
        project_name: p.project_name,

        project_code: p.project_code ?? null,
        project_reference: p.project_reference ?? null,

        estimated_hours: p.estimated_hours,
        actual_hours: p.actual_hours,
        remaining_hours: p.remaining_hours,
        work_percent: p.work_percent,
        timeline_percent: p.timeline_percent,
        required_actual_hours: p.required_actual_hours,
        delta_hours: p.delta_hours,
        status: p.status,
        employees_count: p.employees_count,
      })),
    [portfolioRows],
  );

  const totals = useMemo(() => {
    const totalProjects = rows.length;
    const totalEstimated = rows.reduce((s, r) => s + r.estimated_hours, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual_hours, 0);
    const atRisk = rows.filter(
      (r) => r.status === "AT_RISK" || r.status === "BEHIND_SCHEDULE",
    ).length;

    return {
      totalProjects,
      totalEstimated,
      totalActual,
      atRiskPct: totalProjects ? (atRisk / totalProjects) * 100 : 0,
    };
  }, [rows]);

  const exportCSV = () => {
    const header = [
      "Project Reference",
      "Project Code",
      "Project Name",
      "Project Display",
      "Estimated Hours",
      "Actual Hours",
      "Remaining Hours",
      "Work %",
      "Timeline %",
      "Required Hours",
      "Delta Hours",
      "Status",
      "Employees",
    ];

    const lines = [header.map(safe).join(",")];

    rows.forEach((r) => {
      lines.push(
        [
          safe(r.project_reference ?? ""),
          safe(r.project_code ?? ""),
          safe(r.project_name ?? ""),
          safe(projectLabel(r)),
          safe(fmt(r.estimated_hours)),
          safe(fmt(r.actual_hours)),
          safe(fmt(r.remaining_hours)),
          safe(fmt(r.work_percent)),
          safe(fmt(r.timeline_percent)),
          safe(fmt(r.required_actual_hours)),
          safe(fmt(r.delta_hours)),
          safe(r.status ?? ""),
          safe(r.employees_count),
        ].join(","),
      );
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Project_Portfolio_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-4 md:p-6 flex flex-col h-full">
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Project Portfolio</h1>
            <button
              onClick={() => setShowHelp(true)}
              className="p-1 rounded hover:bg-gray-100 text-gray-500"
            >
              <Info size={18} />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Reports ▸ Project Portfolio ▸ Derived from Task Planned Hours
            <span className="text-purple-600 ml-1 block sm:inline">
              (best viewed end of week after timesheet updates)
            </span>
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={isLoading || !rows.length}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm disabled:opacity-50 w-full sm:w-auto"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <InputDate label="From" value={from} onChange={setFrom} />
        <InputDate label="To" value={to} onChange={setTo} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Projects" value={totals.totalProjects} />
        <Stat
          label="Estimated Hours"
          value={`${fmt(totals.totalEstimated)} h`}
        />
        <Stat label="Actual Hours" value={`${fmt(totals.totalActual)} h`} />
        <Stat label="At Risk %" value={`${fmt(totals.atRiskPct)}%`} />
      </div>

      {/* Responsive Table / Cards */}
      <div className="bg-white border rounded-xl shadow-sm flex-1 overflow-hidden">
        {/* Desktop: table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b">
              <tr>
                <Th
                  label="Project"
                  tip="Project name grouped by client or organization"
                />
                <Th
                  label="Est"
                  tip="Sum of all task estimated hours under this project"
                  align="right"
                />
                <Th
                  label="Actual"
                  tip="Total submitted + approved timesheet hours logged to tasks in this project"
                  align="right"
                />
                <Th label="Remaining" tip="Estimated − Actual" align="right" />
                <Th
                  label="Work %"
                  tip="(Actual ÷ Estimated) × 100"
                  align="right"
                />
                <Th
                  label="Time %"
                  tip="(Elapsed Days ÷ Total Days) × 100"
                  align="right"
                />
                <Th
                  label="Expected"
                  tip="Expected Hours = Estimated Hours × (Time % ÷ 100)"
                  align="right"
                />
                <Th
                  label="Δ Hours"
                  tip="Expected Hours - Actual Hours"
                  align="right"
                />
                <Th
                  label="Status"
                  tip="Overall performance classification"
                  align="center"
                />
                <Th
                  label="Employees"
                  tip="Unique employees logged time"
                  align="right"
                />
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : !rows.length ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500">
                    No projects found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.project_id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{projectLabel(r)}</td>
                    <td className="px-4 py-2 text-right">
                      {fmt(r.estimated_hours)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmt(r.actual_hours)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmt(r.remaining_hours)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmt(r.work_percent)}%
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmt(r.timeline_percent)}%
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmt(r.required_actual_hours)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        r.delta_hours < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {fmt(r.delta_hours)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <BurnStatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {r.employees_count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: card layout */}
        <div className="block md:hidden divide-y divide-gray-100 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading…</div>
          ) : !rows.length ? (
            <div className="p-6 text-center text-gray-500">
              No projects found.
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.project_id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900 text-base truncate">
                    {projectLabel(r)}
                  </h3>
                  <BurnStatusPill status={r.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <span>Est: {fmt(r.estimated_hours)}h</span>
                  <span>Actual: {fmt(r.actual_hours)}h</span>
                  <span>Remaining: {fmt(r.remaining_hours)}h</span>
                  <span>Work: {fmt(r.work_percent)}%</span>
                  <span>Time: {fmt(r.timeline_percent)}%</span>
                  <span>
                    Δ:{" "}
                    <span
                      className={`font-semibold ${
                        r.delta_hours < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {fmt(r.delta_hours)}
                    </span>
                  </span>
                  <span>Employees: {r.employees_count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help Overlay */}
      <ProjectPortfolioHelpOverlay
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */
function Th({
  label,
  tip,
  align = "left",
}: {
  label: string;
  tip: string;
  align?: "left" | "right" | "center";
}) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    }
  }, [show]);

  return (
    <th className={`px-4 py-2 text-${align}`}>
      <div
        className={`flex ${
          align === "right"
            ? "justify-end"
            : align === "center"
              ? "justify-center"
              : "justify-start"
        } items-center gap-1`}
      >
        {label}
        <div
          ref={ref}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          className="cursor-pointer inline-flex"
        >
          <Info size={12} className="text-gray-400" />
        </div>
      </div>

      {show &&
        createPortal(
          <div
            className="fixed z-[9999] bg-gray-900 text-white text-xs rounded-md px-2 py-1 shadow-lg w-max max-w-[240px] whitespace-normal break-words"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
            }}
          >
            {tip}
          </div>,
          document.body,
        )}
    </th>
  );
}
function InputDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="date"
        className="w-full h-9 border rounded-md px-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border rounded-xl p-3 sm:p-4 shadow-sm text-center sm:text-left">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg sm:text-2xl font-semibold text-gray-800">
        {value}
      </div>
    </div>
  );
}

function BurnStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ON_TRACK: "bg-green-100 text-green-700",
    AT_RISK: "bg-amber-100 text-amber-700",
    BEHIND_SCHEDULE: "bg-red-100 text-red-700",
    OVER_BUDGET: "bg-rose-100 text-rose-700",
    NO_BUDGET: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${map[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

/* ================= UTILS ================= */
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    n ?? 0,
  );
}
function safe(v: any) {
  const s = String(v ?? "");
  const escaped = s.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}
function projectLabel(r: any) {
  return (
    r?.project_reference?.trim() ||
    r?.project_code?.trim() ||
    r?.project_name?.trim() ||
    "-"
  );
}
