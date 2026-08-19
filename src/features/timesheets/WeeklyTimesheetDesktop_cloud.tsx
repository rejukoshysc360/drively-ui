import { useState } from "react";
import { Trash2, PlusCircle } from "lucide-react";
import { DayEntry, TaskEntry } from "./WeeklyTimesheetForm";
import { useDeleteTimesheetTask } from "./hooks"; 
import { APP_CONFIG } from "../../../src/config/appConfig";

const { ENABLE_OVERTIME } = APP_CONFIG;

type Props = {
  entries: DayEntry[];
  availableTasks: { id: string; name: string }[] | undefined;
  updateEntry: (i: number, field: keyof DayEntry, value: any) => void;
  updateTaskRow: (i: number, j: number, field: keyof TaskEntry, value: any) => void;
  removeTaskRow: (i: number, j: number) => void;
  addTaskRow: (i: number) => void;
  totals: { regular: number; off: number; overtime: number; total: number };
  generateTimeOptions: () => JSX.Element[];
  changeWeek: (d: number) => void;
  saveWeek: (status?: "draft" | "submitted") => void;
  isDirty: boolean;
  isSaving: boolean;
};

export default function WeeklyTimesheetDesktop({
  entries,
  availableTasks,
  updateEntry,
  updateTaskRow,
  removeTaskRow,
  addTaskRow,
  totals,
  generateTimeOptions,
  changeWeek,
  saveWeek,
  isDirty,
  isSaving,
}: Props) {
  const [taskModalIndex, setTaskModalIndex] = useState<number | null>(null);
  const hasDrafts = entries.some((e) => e.status === "draft");

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const color =
      status === "draft"
        ? "bg-yellow-100 text-yellow-800"
        : status === "submitted"
        ? "bg-blue-100 text-blue-800"
        : status === "approved"
        ? "bg-green-100 text-green-800"
        : status === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${color}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="hidden sm:block overflow-x-auto rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="flex bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wide border-b border-gray-200">
        <div className="flex-[1.1] p-3">Date</div>
        <div className="flex-[1] p-3">Start</div>
        <div className="flex-[1] p-3">Finish</div>
        <div className="flex-[0.8] p-3 text-center">Regular</div>
        <div className="flex-[0.6] p-3 text-center">Off</div>
        {ENABLE_OVERTIME && <div className="flex-[0.8] p-3 text-center">Overtime</div>}
        <div className="flex-[2] p-3">Tasks</div>
        <div className="flex-[1.4] p-3">Notes</div>
        <div className="flex-[0.8] p-3 text-center">Total</div>
        <div className="flex-[2] p-3 text-center">Status</div>
      </div>

      {/* Rows */}
      {entries.map((row, i) => {
        const isEditable = row.status !== "submitted";
        return (
          <div
            key={row.date}
            className={`flex border-b border-gray-100 items-center min-h-[48px] ${
              isEditable ? "hover:bg-gray-50" : "bg-gray-50"
            }`}
          >
            {/* Date */}
            <div className="flex-[1.1] p-3 flex items-center font-medium text-gray-700 whitespace-nowrap">
              {row.date}
            </div>

            {/* Start */}
            <div className="flex-[1] p-3 flex items-center">
              <select
                value={row.start_time}
                onChange={(e) =>
                  isEditable && updateEntry(i, "start_time", e.target.value)
                }
                className={`w-full border rounded px-2 py-1 text-sm ${
                  !isEditable ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""
                }`}
                disabled={!isEditable}
              >
                <option value="Select">-- Select --</option>
                {generateTimeOptions()}
              </select>
            </div>

            {/* End */}
            <div className="flex-[1] p-3 flex items-center">
              <select
                value={row.end_time}
                onChange={(e) =>
                  isEditable && updateEntry(i, "end_time", e.target.value)
                }
                className={`w-full border rounded px-2 py-1 text-sm ${
                  !isEditable ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""
                }`}
                disabled={!isEditable}
              >
                <option value="Select">-- Select --</option>
                {generateTimeOptions()}
              </select>
            </div>

            {/* Hours */}
            <div className="flex-[0.8] p-3 flex items-center justify-center text-blue-700">
              {row.regular_hours}
            </div>
            <div className="flex-[0.6] p-3 flex items-center justify-center text-yellow-600">
              {row.off_hours}
            </div>
            {ENABLE_OVERTIME && (
              <div className="flex-[0.8] p-3 flex items-center justify-center text-red-600">
                {row.overtime_hours}
              </div>
            )}

            {/* Tasks */}
            <div className="flex-[2] p-3 flex items-center">
              <button
                onClick={() => isEditable && setTaskModalIndex(i)}
                disabled={!isEditable}
                className={`flex items-center justify-center w-full border border-dashed py-1 rounded-lg text-sm ${
                  isEditable
                    ? "text-gray-600 border-gray-300 hover:bg-gray-50"
                    : "text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed"
                }`}
              >
                <PlusCircle
                  size={16}
                  className={`mr-1 ${isEditable ? "text-gray-500" : "text-gray-300"}`}
                />
                {row.tasks.length > 0 ? `${row.tasks.length} Task(s)` : "Add Task"}
              </button>
            </div>

            {/* Notes */}
            <div className="flex-[1.4] p-3 flex items-center">
              <input
                type="text"
                value={row.notes || ""}
                onChange={(e) =>
                  isEditable && updateEntry(i, "notes", e.target.value)
                }
                className={`w-full border rounded px-2 py-1 text-sm ${
                  !isEditable ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""
                }`}
                readOnly={!isEditable}
              />
            </div>

            {/* Total */}
            <div className="flex-[0.8] p-3 flex items-center justify-center font-bold text-gray-800">
              {row.total_hours}
            </div>

            {/* Status */}
            <div className="flex-[2] p-3 flex items-center justify-center">
              {getStatusBadge(row.status)}
            </div>
          </div>
        );
      })}

      {/* Totals Row */}
      <div className="flex bg-gray-100 font-bold text-gray-700">
        <div className="flex-[3.1] p-3 text-right">TOTAL HOURS</div>
        <div className="flex-[0.8] p-3 text-blue-700 text-center">
          {totals.regular}
        </div>
        <div className="flex-[0.6] p-3 text-yellow-600 text-center">
          {totals.off}
        </div>
        {ENABLE_OVERTIME && (
          <div className="flex-[0.8] p-3 text-red-600 text-center">
            {totals.overtime}
          </div>
        )}
        <div className="flex-[3.4]" />
        <div className="flex-[0.8] p-3 text-center">{totals.total}</div>
        <div className="flex-[2]" />
      </div>

      {/* Footer */}
      <div className="hidden sm:flex mt-4 justify-between">
        <button
          onClick={() => changeWeek(-1)}
          className="px-4 py-2 bg-gray-100 rounded-md border hover:bg-gray-200"
        >
          ← Previous Week
        </button>
        <div className="flex gap-3">
          {isDirty && (
            <button
              onClick={() => saveWeek("draft")}
              disabled={isSaving}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 ${
                isSaving ? "bg-blue-400" : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {isSaving ? "Saving…" : "Save as Draft"}
            </button>
          )}
          {hasDrafts && (
            <button
              onClick={() => saveWeek("submitted")}
              disabled={isSaving}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 ${
                isSaving ? "bg-blue-400" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isSaving ? "Submitting…" : "Submit Timesheet"}
            </button>
          )}
          {!hasDrafts && !isDirty && (
            <button
              disabled
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md cursor-not-allowed"
            >
              Submitted
            </button>
          )}
          <button
            onClick={() => changeWeek(1)}
            className="px-4 py-2 bg-gray-100 rounded-md border hover:bg-gray-200"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Task Overlay */}
      {taskModalIndex !== null && entries[taskModalIndex].status !== "submitted" && (
        <TaskOverlay
          dayIndex={taskModalIndex}
          dayEntry={entries[taskModalIndex]}
          availableTasks={availableTasks}
          updateTaskRow={updateTaskRow}
          removeTaskRow={removeTaskRow}
          addTaskRow={addTaskRow}
          onClose={() => setTaskModalIndex(null)}
        />
      )}
    </div>
  );
}

function TaskOverlay({
  dayIndex,
  dayEntry,
  availableTasks,
  updateTaskRow,
  removeTaskRow,
  addTaskRow,
  onClose,
}: {
  dayIndex: number;
  dayEntry: DayEntry;
  availableTasks: { id: string; name: string }[] | undefined;
  updateTaskRow: (i: number, j: number, field: keyof TaskEntry, value: any) => void;
  removeTaskRow: (i: number, j: number) => void;
  addTaskRow: (i: number) => void;
  onClose: () => void;
}) {
  const deleteTaskMutation = useDeleteTimesheetTask(dayEntry.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Tasks for {dayEntry.date}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {dayEntry.tasks.map((t, j) => (
            <div key={j} className="flex gap-2 items-center">
              <select
                value={t.taskId}
                onChange={(e) =>
                  updateTaskRow(dayIndex, j, "taskId", e.target.value)
                }
                className="border rounded px-2 py-1 text-sm flex-1"
              >
                <option value="">-- Select Task --</option>
                {availableTasks?.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>

              <select
                value={t.hours}
                onChange={(e) =>
                  updateTaskRow(dayIndex, j, "hours", Number(e.target.value))
                }
                className="border rounded px-2 py-1 text-sm w-20"
              >
                {Array.from({ length: 25 }, (_, h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={t.notes || ""}
                onChange={(e) => updateTaskRow(dayIndex, j, "notes", e.target.value)}
                className="border rounded px-2 py-1 text-sm flex-1"
                placeholder="Notes"
              />

              <button
                onClick={() => {
                  removeTaskRow(dayIndex, j);
                  if (t.taskId && t.timesheetId) {
                    deleteTaskMutation.mutate({
                      timesheetId: t.timesheetId,
                      taskId: t.taskId,
                    });
                  }
                }}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                disabled={deleteTaskMutation.isLoading}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => addTaskRow(dayIndex)}
            className="flex items-center justify-center w-full border border-dashed border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            <PlusCircle size={16} className="mr-1 text-gray-500" />
            Add Task
          </button>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
