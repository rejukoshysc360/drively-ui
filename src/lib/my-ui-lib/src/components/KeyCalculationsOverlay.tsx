// src/chart/KeyCalculationsOverlay.tsx
import React from "react";

type Props = { onClose: () => void };

const KeyCalculationsOverlay: React.FC<Props> = ({ onClose }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto"
    >
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          📊 Key Calculations & Fields Explained
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          How progress, timeline, status, and effort metrics are calculated in this task report.
        </p>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-3 pr-6 font-semibold text-gray-900">Label</th>
                <th className="py-3 font-semibold text-gray-900">Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-4 pr-6 font-medium">Start Date</td>
                <td className="py-4 text-gray-700">
                  Official planned start of the task (from Gantt). Used as baseline for time elapsed calculations.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">End Date</td>
                <td className="py-4 text-gray-700">
                  Planned completion date (from Gantt). Used to calculate total planned duration in days.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Expected Deadline</td>
                <td className="py-4 text-gray-700">
                  Target completion date that drives <strong>Time Progress</strong> and overall status (ahead/on track/behind).
                  Falls back to End Date if not set.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Planned Duration</td>
                <td className="py-4 text-gray-700">
                  <strong>Calculated automatically</strong>: Number of calendar days from Start Date to End Date (inclusive, minimum 1 day).<br />
                  Then multiplied by <strong>9 hours/day</strong> to get total planned effort (e.g., 10 days → 90h).
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Total Allocated Hours</td>
                <td className="py-4 text-gray-700">
                  Sum of hours manually assigned to each employee on this task.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Total Completed Hours</td>
                <td className="py-4 text-gray-700">
                  Actual hours logged against this task via approved/submitted timesheets.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Total Planned Hours</td>
                <td className="py-4 text-gray-700">
                  Primary basis for progress: Uses <strong>task.hours</strong> if set, otherwise falls back to Total Allocated Hours.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Work Progress %</td>
                <td className="py-4 text-gray-700">
                  <strong>Completed Hours ÷ Total Planned Hours × 100</strong><br />
                  Measures how much of the work is actually done.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Time Progress %</td>
                <td className="py-4 text-gray-700">
                  <strong>Days elapsed since Start Date ÷ Total days from Start to Expected Deadline × 100</strong><br />
                  Measures how much of the available time has passed. Capped at 100%.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium align-top">Status</td>
                <td className="py-4 text-gray-700">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-green-700">Ahead of Schedule</span>
                      {" "}— Work Progress is <strong>≥10% above</strong> Time Progress
                    </div>
                    <div>
                      <span className="font-medium text-amber-700">On Track</span>
                      {" "}— Work Progress is <strong>within ±10%</strong> of Time Progress
                    </div>
                    <div>
                      <span className="font-medium text-red-700">Behind Schedule</span>
                      {" "}— Work Progress is <strong>≥10% below</strong> Time Progress
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Progress Gap</td>
                <td className="py-4 text-gray-700">
                  Work Progress − Time Progress.<br />
                  Positive = ahead, Negative = behind, Zero = perfectly on schedule.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Target Work by Today</td>
                <td className="py-4 text-gray-700">
                  The Work Progress % that should be achieved by today to stay perfectly on schedule (equals current Time Progress %).
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium">Remaining Effort</td>
                <td className="py-4 text-gray-700">
                  Total Planned Hours − Completed Hours<br />
                  Shown in both hours and as remaining percentage.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default KeyCalculationsOverlay;