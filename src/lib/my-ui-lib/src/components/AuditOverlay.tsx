import { X } from "lucide-react";
import { formatDate ,isDateLike} from "../../../../utils/DateUtils"; // adjust path as needed

type Props = {
  field: string;
  oldValue: any;
  newValue: any;
  note: string;
  onChangeNote: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  extraMessage?: React.ReactNode; // 🆕 Add this prop
};

export default function AuditOverlay({
  field,
  oldValue,
  newValue,
  note,
  onChangeNote,
  onCancel,
  onConfirm,
  extraMessage, // 🆕 Destructure it
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Confirm Field Change</h2>
          <button onClick={onCancel}>
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
 
       {/* Field Info */}
<p className="text-sm text-gray-700 mb-3">
  You are changing <strong>{field}</strong>.
  <br />

  <span className="text-red-600">Old:</span>{" "}
  {isDateLike(oldValue) ? (
    <strong>{formatDate(oldValue)}</strong>
  ) : (
    <strong>{oldValue === null || oldValue === undefined ? "(empty)" : oldValue}</strong>
  )}
  <br />

  <span className="text-green-600">New:</span>{" "}
  {isDateLike(newValue) ? (
    <strong>{formatDate(newValue)}</strong>
  ) : (
    <strong>{newValue === null || newValue === undefined ? "(empty)" : newValue}</strong>
  )}
</p>
        {/* 🟡 Optional contextual warning message */}
        {extraMessage && <div className="mb-3">{extraMessage}</div>}

        {/* Reason field */}
        <label className="block text-sm font-medium mb-1">Reason for change</label>
        <textarea
          value={note}
          onChange={(e) => onChangeNote(e.target.value)}
          rows={3}
          className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Explain why this change is needed..."
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!note.trim()}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
}
