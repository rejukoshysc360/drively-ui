import React, { useState } from "react";
import { X } from "lucide-react";

interface ReportDisplayProps {
  exportCSV: () => void;
  isLoading: boolean;
  isFetching: boolean;
  totals: { planned: number; logged: number };
  viewRows: any[];
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({
  exportCSV,
  isLoading,
  isFetching,
  totals,
  viewRows,
  expanded,
  toggle,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="relative space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Report Results</h2>
          <p className="text-sm text-gray-500">
            Showing {viewRows.length} employees
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            Help
          </button>
        </div>
      </div>

      {/* Your normal report table or UI */}
      <div className="border rounded-md p-4 bg-white shadow-sm">
        {isLoading || isFetching ? (
          <div className="text-center text-gray-500">Loading report...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Employee</th>
                <th className="px-3 py-2 text-left">Planned</th>
                <th className="px-3 py-2 text-left">Logged</th>
                <th className="px-3 py-2 text-left">Utilization %</th>
              </tr>
            </thead>
            <tbody>
              {viewRows.map((row: any) => (
                <tr key={row.employee_id} className="border-b">
                  <td className="px-3 py-2">{row.employee_name}</td>
                  <td className="px-3 py-2">{row.planned_hours}</td>
                  <td className="px-3 py-2">{row._view_actual}</td>
                  <td className="px-3 py-2">{row._view_util}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Help Overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Employee Allocation Report – Data & Calculation Logic
            </h2>

            <p className="text-gray-700 mb-6">
              The Employee Allocation Report shows how effectively each employee’s
              available working hours are utilized within a selected date range.
              It combines <strong>task effort data</strong>,{" "}
              <strong>timesheet entries</strong>, and{" "}
              <strong>organization working-hour settings</strong> to compute
              utilization, remaining capacity, and workload balance.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Data Sources & Key Fields
            </h3>

            <div className="overflow-x-auto mb-8">
              <table className="min-w-full border text-sm text-gray-700">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-3 py-2 border">Source</th>
                    <th className="px-3 py-2 border">Field</th>
                    <th className="px-3 py-2 border text-left">Description / Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Tasks", "hours", "Represents the total planned or estimated effort for a task. Logged hours flow into timesheets and drive utilization calculations."],
                    ["Tasks", "assignees", "Identifies which employees are responsible for the task and links them to utilization metrics."],
                    ["Timesheets", "employee_id", "Connects logged hours to the corresponding employee."],
                    ["Timesheets", "date", "Date of logged work, used to filter hours within the selected reporting range."],
                    ["Timesheet Entries", "task_id", "Links each timesheet entry to its originating task."],
                    ["Timesheet Entries", "hours", "Core input – represents actual hours worked and logged by employees."],
                    ["Organization Settings", "working_time_settings.daily_hours", "Defines standard working hours per day."],
                    ["Organization Settings", "working_time_settings.working_days", "Defines valid working days per week (e.g., Monday–Friday)."],
                    ["Holidays", "date", "Non-working days excluded from available capacity calculations."],
                  ].map(([source, field, desc]) => (
                    <tr key={field}>
                      <td className="px-3 py-2 border font-medium">{source}</td>
                      <td className="px-3 py-2 border font-mono text-indigo-700">{field}</td>
                      <td className="px-3 py-2 border">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">Calculation Logic</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-8">
              <li>
                <strong>Working Capacity:</strong>{" "}
                <code>(working_days_in_period − holidays) × daily_hours</code>
              </li>
              <li>
                <strong>Actual Logged Hours:</strong> Sum of{" "}
                <code>timesheet_entries.hours</code> per employee within the date range.
              </li>
              <li>
                <strong>Utilization %:</strong>{" "}
                <code>(actual_hours / contracted_hours) × 100</code>
              </li>
              <li>
                <strong>Remaining Hours:</strong>{" "}
                <code>contracted_hours − actual_hours</code>
              </li>
              <li>
                <strong>Required Hours/Day:</strong>{" "}
                <code>remaining_hours / days_remaining</code>
              </li>
              <li>
                <strong>Status Categories:</strong> BENCH, UNDERUTILIZED, UTILIZED, OVERLOADED
                (based on utilization thresholds).
              </li>
            </ul>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-900">
              <strong>Summary:</strong> The Employee Allocation Report compares{" "}
              <strong>actual work logged</strong> (from timesheets) against{" "}
              <strong>available working hours</strong> (from organization settings).
              Task fields <code>hours</code> and <code>assignees</code> define who
              worked on what, while timesheets determine when and how much was worked.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDisplay;
