import React from "react";

type Props = { onClose: () => void };

const InterpretingReportOverlay: React.FC<Props> = ({ onClose }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 overflow-y-auto"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-900">
        🧭 Interpreting the Report
      </h2>

      <ul className="space-y-4 text-sm text-gray-700">
        <li>
          <b>Planned Duration:</b> How long the task was expected to take.
        </li>
        <li>
          <b>Total Allocated:</b> Total work assigned to employees.
        </li>
        <li>
          <b>Completed:</b> Actual hours logged so far.
        </li>
        <li>
          <b>Work Progress:</b> Portion of total hours completed.
        </li>
        <li>
          <b>Time Elapsed:</b> How much of the scheduled time has passed.
        </li>
        <li>
          <b>Status:</b> Compares progress vs time to show if you’re on track.
        </li>
      </ul>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default InterpretingReportOverlay;
