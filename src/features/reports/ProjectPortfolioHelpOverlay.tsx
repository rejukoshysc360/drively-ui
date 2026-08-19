import React from "react";
import { X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectPortfolioHelpOverlay({
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
                Project Portfolio Report — Overview
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
                The <strong>Project Portfolio Report</strong> consolidates key
                metrics for all active projects. It shows how each project is
                performing against its plan, timeline, and logged effort.
              </p>

              {/* Data Sources */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">🧩 Data Sources</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <code>tasks</code> — provides <b>planned effort</b> and
                    <b> start/end dates</b> per project
                  </li>
                  <li>
                    <code>timesheets</code> — only <b>SUBMITTED</b> and{" "}
                    <b>APPROVED</b> entries are included
                  </li>
                  <li>
                    <code>timesheet_entries</code> — defines <b>actual logged hours</b>
                  </li>
                  <li>
                    <code>employees</code> — used to count contributors
                  </li>
                </ul>
              </div>

              {/* Key Calculations */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">⚙️ Key Calculations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <b>Planned Effort</b> = Σ of <code>task.hours</code> under a
                    project
                  </li>
                  <li>
                    <b>Actual Effort</b> = Σ of{" "}
                    <code>timesheet_entries.hours</code> for approved/submitted
                    timesheets
                  </li>
                  <li>
                    <b>Remaining Hours</b> = Planned − Actual
                  </li>
                  <li>
                    <b>Work %</b> = (Actual ÷ Planned) × 100
                  </li>
                  <li>
                    <b>Timeline %</b> = weighted average of{" "}
                    <code>(days elapsed ÷ total days)</code> across tasks
                  </li>
                  <li>
                    <b>Expected Hours (So Far)</b> = Planned × (Timeline % ÷ 100)
                  </li>
                  <li>
                    <b>Gap (Δ)</b> = Actual − Expected
                  </li>
                </ul>
              </div>

              {/* Example */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">📊 Example</h3>
                <div className="bg-gray-50 border rounded-md p-3 text-xs">
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      <tr>
                        <td className="py-0.5 w-1/2">Planned (Σ task hours)</td>
                        <td>45 h</td>
                      </tr>
                      <tr>
                        <td>Actual Logged</td>
                        <td>9 h</td>
                      </tr>
                      <tr>
                        <td>Timeline % (based on task dates)</td>
                        <td>25%</td>
                      </tr>
                      <tr>
                        <td>Expected Hours</td>
                        <td>45 × 0.25 = 11.3 h</td>
                      </tr>
                      <tr>
                        <td>Gap</td>
                        <td>9 − 11.3 = −2.3 h (behind)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Logic */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">🧭 Status Rules</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <b>NO_BUDGET</b> — No planned hours found for tasks
                  </li>
                  <li>
                    <b>OVER_BUDGET</b> — Work % &gt; 110%
                  </li>
                  <li>
                    <b>BEHIND_SCHEDULE</b> — Work % &lt; Timeline % − 20
                  </li>
                  <li>
                    <b>AT_RISK</b> — Work % &gt; Timeline % + 10
                  </li>
                  <li>
                    <b>ON_TRACK</b> — Effort aligns with schedule
                  </li>
                </ul>
              </div>

              {/* Tip */}
              <div className="text-xs text-gray-500 border-t pt-3">
                Tip: For best accuracy, run this report at the end of each week
                after all timesheets are submitted and approved.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
