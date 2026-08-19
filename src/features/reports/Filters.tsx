// src/features/reports/Filters.tsx
import React from "react";
import { Filter } from "lucide-react";
import Tooltip from "./Tooltip";

interface FiltersProps {
  from: string;
  to: string;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  employees: any[];
  projects: any[];
  employeeIds: string[];
  onEmployeeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  projectIds: string[];
  onProjectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  status: string;
  setStatus: (value: string) => void;
  utilRange: [number, number];
  setUtilRange: (range: [number, number]) => void;
  contextLabel: string;
}

export default function Filters({
  from,
  to,
  setFrom,
  setTo,
  employees,
  projects,
  employeeIds,
  onEmployeeChange,
  projectIds,
  onProjectChange,
  status,
  setStatus,
  utilRange,
  setUtilRange,
  contextLabel,
}: FiltersProps) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm mb-5">
      <div className="flex items-center gap-2 mb-3 text-gray-600">
        <Filter size={16} />
        <span className="font-medium">Filters</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <label className="text-xs text-gray-500">From Ditto</label>
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

        <div>
          <label className="text-xs text-gray-500">Employees</label>
          <select
            multiple
            className="input w-full h-[90px]"
            value={employeeIds.length === 0 ? ["__ALL__"] : employeeIds}
            onChange={onEmployeeChange}
          >
            <option value="__ALL__">All Employees</option>
            {employees.map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500">Projects</label>
          <select
            multiple
            className="input w-full h-[120px]"
            value={projectIds}
            onChange={onProjectChange}
          >
            <option value="__ALL__">All Projects</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="mt-1 text-[11px] text-gray-500">
            <Tooltip text="All Projects shows true utilization. Selecting specific projects recalculates metrics for those projects only." />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">Status</label>
          <select
            className="input w-full h-9"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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

      <div className="mt-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-gray-50">
          {contextLabel}
        </span>
      </div>
    </div>
  );
}