// src/features/timesheets/components/WeeklyTimesheetMobile.tsx
import { useState } from "react";
import { PlusCircle, Trash2, Layers, AlertTriangle } from "lucide-react";
import { DayEntry, Entry } from "./WeeklyTimesheetForm";
import ModernDurationSelect from "../../../components/ui/ModernDurationSelect";
import ModernProjectSelect from "../../../components/ui/ModernProjectSelect";
import ModernTaskSelect from "../../../components/ui/ModernTaskSelect";
import FormDialog from "../../../components/ui/FormDialog";
import {
  useUpdateTimesheet,
} from "../hooks";
import dayjs from "dayjs";
import { useCan } from "../../../utils/permissions";
import { useAssignments } from "../../../features/projects/hooks";
import ActivityInput from "./ActivityInput";

type Props = {
  entries: DayEntry[];
  mode: "OPEN" | "RESTRICT_ALL" | "RESTRICT_HOLIDAYS";
  availableProjects:
    | {
        id: string;
        name: string;
        tasks?: { id: string; name: string; status?: string }[];
      }[]
    | undefined;
  updateTaskRow: (i: number, j: number, field: keyof Entry, value: any) => void;
  removeTaskRow: (i: number, j: number) => void;
  addTaskRow: (i: number) => void;
  changeWeek: (d: number) => void;
  saveWeek: (status?: "draft" | "submitted") => void;
  isDirty: boolean;
  isSaving: boolean;
  expandedDayIndex: number | null;
  setExpandedDayIndex: (i: number | null) => void;
};

export default function WeeklyTimesheetMobile({
  entries,
  mode,
  availableProjects,
  updateTaskRow,
  removeTaskRow,
  addTaskRow,
  changeWeek,
  saveWeek,
  isDirty,
  isSaving,
  expandedDayIndex,
  setExpandedDayIndex,
}: Props) {

  const updateTimesheet = useUpdateTimesheet();

  const can = useCan();
  const canView =
    can("timesheets:view") || can("timesheets:view_own_record_only");
  const canUpdate =
    can("timesheets:update") || can("timesheets:update_own_record_only");
  const canDelete =
    can("timesheets:delete") || can("timesheets:delete_own_record_only");

  const hasDrafts = entries.some((e) => e.status === "draft");

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    id?: string;
    date?: string;
  }>({ open: false });

  const handleRequestEdit = (id: string, date: string) => {
    if (!canUpdate) return;
    setConfirmDialog({ open: true, id, date });
  };

  const confirmRequestEdit = async () => {
    if (!confirmDialog.id) return;
    try {
      await updateTimesheet.mutateAsync({
        id: confirmDialog.id,
        status: "edit_requested",
      });
    } finally {
      setConfirmDialog({ open: false });
    }
  };

  if (!canView) {
    return (
      <div className="sm:hidden flex flex-col items-center justify-center h-[70vh] text-center p-6">
        <AlertTriangle className="w-12 h-12 text-gray-400 mb-3" />
        <h2 className="text-lg font-semibold text-gray-700 mb-1">
          Access Restricted
        </h2>
        <p className="text-gray-500 text-sm">
          You don’t have permission to view timesheets.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status?: string, restricted?: boolean) => {
    let label = "";
    let styles = "";

    if (restricted) {
      label = "Restricted";
      styles = "bg-gray-200 text-gray-600 border border-gray-300";
    } else {
      switch (status) {
        case "approved":
          label = "Approved";
          styles = "bg-green-100 text-green-700 border border-green-200";
          break;
        case "submitted":
          label = "Submitted";
          styles = "bg-blue-100 text-blue-700 border border-blue-200";
          break;
        case "edit_requested":
          label = "Requested for Edit";
          styles = "bg-amber-100 text-amber-700 border border-amber-200";
          break;
        case "draft":
          label = "Draft";
          styles = "bg-yellow-100 text-yellow-700 border border-yellow-200";
          break;
        case "rejected":
          label = "Rejected";
          styles = "bg-red-100 text-red-700 border border-red-200";
          break;
        default:
          label = "Not Submitted";
          styles = "bg-gray-100 text-gray-600 border border-gray-200";
          break;
      }
    }

    return (
      <span
        className={`inline-block px-3 py-1 text-[11px] font-medium rounded-full whitespace-nowrap ${styles}`}
      >
        {label}
      </span>
    );
  };
const getDayLabel = (row: DayEntry) => {
  // OPEN MODE
  if (mode === "OPEN") {
    if (row.isFutureDate) {
      return "Future Day";
    }

    return null;
  }

  // RESTRICT_ALL
  if (mode === "RESTRICT_ALL") {
    if (row.isHoliday) return "Holiday";

    if (row.isWeekend) return "Weekend";

    if (row.isFutureDate) return "Future Day";

    return null;
  }

  // RESTRICT_HOLIDAYS
  if (mode === "RESTRICT_HOLIDAYS") {
    if (row.isHoliday) return "Holiday";

    // desktop behavior
    if (row.isFutureDate) return "Future Day";

    return null;
  }

  return null;
};

  return (
  <div className="sm:hidden space-y-4 pb-24 overflow-visible">
      {entries.map((row, i) => {
        const restricted = !!row.restricted;
        const isEditable =
          !restricted &&
          row.status !== "submitted" &&
          row.status !== "approved" &&
          row.status !== "edit_requested";

        const dayEntries = Array.isArray(row.entries) ? row.entries : [];

        return (
<div
  key={row.date}
  className={`relative border rounded-lg shadow-sm p-4 overflow-visible isolate ${
    restricted ? "bg-gray-100 opacity-70" : "bg-white"
  }`}
>
            {/* 📅 Date */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex flex-col">
                <h3 className="font-semibold text-gray-800">
                  {dayjs(row.date).format("ddd, DD MMM YYYY")}
                </h3>

                {getDayLabel(row) && (
                <span className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <AlertTriangle size={12} className="text-amber-500" />
                  {getDayLabel(row)}
                </span>
              )}
              </div>

              {/* 🔹 Expand Button */}
              <button
                onClick={() => {
                  if (restricted) return;
                  setExpandedDayIndex((prev) => (prev === i ? null : i));
                  if (expandedDayIndex !== i && dayEntries.length === 0) {
                    addTaskRow(i);
                  }
                }}
                disabled={restricted}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-md border transition ${
                  restricted
                    ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                    : expandedDayIndex === i
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100"
                }`}
              >
                <Layers size={12} />
                {dayEntries.length > 0
                  ? `${dayEntries.length} Task${
                      dayEntries.length > 1 ? "s" : ""
                    }`
                  : restricted
                  ? "Restricted"
                  : "Add Task"}
              </button>
            </div>

            {/* 🔹 Status + Request Edit */}
            {!restricted && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {getStatusBadge(row.status, false)}
                {row.status === "submitted" && canUpdate && (
                  <button
                    onClick={() => handleRequestEdit(row.id!, row.date)}
                    className="text-[10px] font-medium px-2 py-[3px]
                      border border-blue-300 text-blue-600 
                      rounded-md bg-white hover:bg-blue-50 
                      shadow-sm hover:shadow transition-all duration-150 
                      whitespace-nowrap"
                  >
                    Request Edit
                  </button>
                )}
              </div>
            )}

            {/* 🔹 Expanded Task List */}
            {expandedDayIndex === i && !restricted && (
             <div className="space-y-3 mt-2 overflow-visible">
                {dayEntries.map((entry, j) => (
                 <div
  key={j}
  className="relative border rounded-md p-3 bg-gray-50 shadow-sm space-y-2 hover:shadow transition overflow-visible"
>
                    <ModernDurationSelect
                      value={entry.hours || 0}
                      onChange={(v) => updateTaskRow(i, j, "hours", v)}
                      disabled={!isEditable}
                    />

                    <ModernProjectSelect
                      value={entry.project_id || ""}
                      onChange={(v) => {
                        updateTaskRow(i, j, "project_id", v);
                        updateTaskRow(i, j, "task_id", "");
                      }}
                      projects={availableProjects || []}
                      disabled={!isEditable}
                    />

                    <TaskSelector
                      projectId={entry.project_id || null}
                      taskId={entry.task_id || ""}
                      isEditable={isEditable}
                      isPrepopulated={!!entry.id}
                      onChange={(v) => updateTaskRow(i, j, "task_id", v)}
                    />

                   <ActivityInput
                      value={entry.activity || ""}
                      projectId={entry.project_id || ""}
                      onChange={(val) => updateTaskRow(i, j, "activity", val)}
                      disabled={!isEditable}
                    />

                    {isEditable && canDelete && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                          removeTaskRow(i, j);

                          if (dayEntries.length === 1) {
                            setExpandedDayIndex(null);
                          }
                        }}
                       className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                          disabled={isSaving}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isEditable && canUpdate && dayEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => addTaskRow(i)}
                    disabled={isSaving}
                    className={`flex items-center justify-center w-full border border-dashed border-gray-300 py-2 rounded-lg text-sm font-medium transition ${
                      isSaving
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    <PlusCircle size={16} className="mr-1 text-indigo-500" />
                    Add Task Entry
                  </button>
                )}
              </div>
            )}

            {/* 📊 Total summary */}
            <div className="flex justify-between items-center text-sm font-semibold mt-4 border-t pt-2">
              <span className="text-gray-500">Total Hours:</span>
              <span className="text-blue-700">
               {new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(row.total_hours ?? 0)}
              </span>
            </div>
          </div>
        );
      })}

      {/* 📱 Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md p-3 flex justify-between items-center">
        <button
          onClick={() => changeWeek(-1)}
          className="px-3 py-2 bg-gray-100 rounded-md border text-sm hover:bg-gray-200"
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          {isDirty && canUpdate && (
            <button
              onClick={() => saveWeek("draft")}
              disabled={isSaving}
              className={`px-3 py-2 text-white text-sm rounded-md transition ${
                isSaving ? "bg-blue-400" : "bg-gray-700 hover:bg-gray-800"
              }`}
            >
              {isSaving ? "Saving…" : "Draft"}
            </button>
          )}
          {hasDrafts && canUpdate && (
            <button
              onClick={() => saveWeek("submitted")}
              disabled={isSaving}
              className={`px-3 py-2 text-white text-sm rounded-md transition ${
                isSaving ? "bg-blue-400" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isSaving ? "Submitting…" : "Submit"}
            </button>
          )}
        </div>

        <button
          onClick={() => changeWeek(1)}
          disabled={entries.some((d) => dayjs(d.date).isSame(dayjs(), "week"))}
          className={`px-3 py-2 bg-gray-100 rounded-md border text-sm transition ${
            entries.some((d) => dayjs(d.date).isSame(dayjs(), "week"))
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-200 border-gray-300"
          }`}
        >
          Next →
        </button>
      </div>

      {/* 🧩 Confirm Dialog */}
      <FormDialog
        open={confirmDialog.open}
        title="Confirm Edit Request"
        onClose={() => setConfirmDialog({ open: false })}
        primaryAction={{
          label: "Confirm",
          onClick: confirmRequestEdit,
          loading: updateTimesheet.isPending,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setConfirmDialog({ open: false }),
        }}
      >
        <p className="text-sm text-gray-700 leading-relaxed">
          Are you sure you want to request an edit for this timesheet? <br />
          This request will be sent to your manager for approval.
        </p>
      </FormDialog>
    </div>
  );
}

/* 🧩 TaskSelector — same as desktop */
function TaskSelector({
  projectId,
  taskId,
  isEditable,
  isPrepopulated,
  onChange,
}: {
  projectId: string | null;
  taskId: string | null;
  isEditable: boolean;
  isPrepopulated: boolean;
  onChange: (v: string) => void;
}) {
  const { data: tasks, isLoading } = useAssignments(projectId || "");

  if (!projectId) {
    return (
      <ModernTaskSelect
        value=""
        onChange={() => {}}
        tasks={[]}
        disabled
        isPrepopulated={isPrepopulated}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm italic px-2">
        <svg
          className="animate-spin h-4 w-4 text-indigo-500"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        Loading tasks…
      </div>
    );
  }

  const taskList =
    (tasks || []).map((t: any) => ({
      id: t.id,
      name: t.name || "Unnamed Task",
      parent_id: t.parent_id || null,
      is_assigned: t.is_assigned || false,
    })) || [];

  if (taskList.length === 0) {
    return (
      <div className="px-2 py-1 text-gray-500 text-sm italic border rounded-md bg-gray-50">
        No tasks available
      </div>
    );
  }

  return (
    <ModernTaskSelect
      value={taskId || ""}
      onChange={onChange}
      tasks={taskList}
      disabled={!isEditable}
      isPrepopulated={isPrepopulated}
    />
  );
}
