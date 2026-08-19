import React from "react";
import { X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectBurnHelpOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-white max-w-3xl w-full rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                <Info size={18} />
                Project Burn Report — Overview
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 text-gray-700 text-sm overflow-y-auto max-h-[75vh]">
              <p>
                The <strong>Project Burn Report</strong> compares each project’s{" "}
                <em>planned effort</em>, <em>actual logged hours</em>, and{" "}
                <em>timeline progress</em> to determine if it’s on track,
                behind, or over budget.
              </p>

              {/* Data Sources */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">🧩 Data Sources</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>projects</code> — project name and estimated hours</li>
                  <li><code>tasks</code> — planned durations and start/end dates</li>
                  <li><code>timesheets</code> — logged dates for each employee</li>
                  <li><code>timesheet_entries</code> — hours logged per project/task</li>
                  <li><code>employees</code> — for employee-level effort breakdown</li>
                </ul>
              </div>

              {/* Key Calculations */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">⚙️ Key Calculations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b>Planned Effort</b> = Σ task.hours</li>
                  <li><b>Actual Effort</b> = Σ timesheet_entries.hours</li>
                  <li><b>Remaining Hours</b> = estimated − actual</li>
                  <li><b>Work %</b> = (actual ÷ estimated) × 100</li>
                  <li><b>Timeline %</b> = weighted average of task progress (based on start/end dates)</li>
                  <li><b>Required Actual Hours</b> = estimated × (timeline% ÷ 100)</li>
                  <li><b>Delta Hours</b> = actual − required</li>
                </ul>
              </div>

              {/* Status Logic */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">📊 Status Logic</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b>NO_BUDGET</b> — No estimated hours defined yet</li>
                  <li><b>OVER_BUDGET</b> — Actual hours exceed estimate (&gt;110%)</li>
                  <li><b>BEHIND_SCHEDULE</b> — Work% &lt; Timeline% − 20</li>
                  <li><b>AT_RISK</b> — Work% &gt; Timeline% + 10</li>
                  <li><b>ON_TRACK</b> — Progress aligns with schedule and effort</li>
                </ul>
              </div>

              {/* Burn Charts */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">📈 Burn Charts</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b>Burn-Up Curve</b> — cumulative actual hours over time</li>
                  <li><b>Burn-Down Curve</b> — remaining work (estimated − actual) over time</li>
                </ul>
              </div>

              {/* Employee Breakdown */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">👥 Employee Breakdown</h3>
                <p>
                  Shows total hours logged by each employee contributing to the
                  project within the selected date range.
                </p>
              </div>

              <div className="text-xs text-gray-500 border-t pt-3">
                Tip: For best accuracy, run this report at the end of each week
                after all timesheets are submitted.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
