import React from "react";

type Props = { onClose: () => void };

const StatusLogicOverlay: React.FC<Props> = ({ onClose }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 overflow-y-auto"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-900">
        ⚖️ Status Logic Explained
      </h2>

      <table className="w-full text-sm text-left text-gray-700 border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 border">Condition</th>
            <th className="px-3 py-2 border">Status</th>
            <th className="px-3 py-2 border">Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-3 py-2 border">Work % ≥ Time % + 10%</td>
            <td className="px-3 py-2 border text-green-600 font-medium">Ahead</td>
            <td className="px-3 py-2 border">
              Task is progressing faster than schedule.
            </td>
          </tr>
          <tr>
            <td className="px-3 py-2 border">
              |Work % − Time %| ≤ 10%
            </td>
            <td className="px-3 py-2 border text-yellow-600 font-medium">On Track</td>
            <td className="px-3 py-2 border">
              Task is following the planned schedule.
            </td>
          </tr>
          <tr>
            <td className="px-3 py-2 border">Work % ≤ Time % − 10%</td>
            <td className="px-3 py-2 border text-red-600 font-medium">Behind</td>
            <td className="px-3 py-2 border">
              Task is lagging and may miss the deadline.
            </td>
          </tr>
        </tbody>
      </table>

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

export default StatusLogicOverlay;
