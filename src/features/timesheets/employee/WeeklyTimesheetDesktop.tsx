import { useState, useMemo, useEffect } from "react";
import { Trash2, PlusCircle, Layers, AlertTriangle } from "lucide-react";
import { DayEntry, Entry } from "./WeeklyTimesheetForm";
import ModernDurationSelect from "../../../components/ui/ModernDurationSelect";
import ModernProjectSelect from "../../../components/ui/ModernProjectSelect";
import ModernTaskSelect from "../../../components/ui/ModernTaskSelect";
import FormDialog from "../../../components/ui/FormDialog";
import { useUpdateTimesheet } from "../hooks";
import dayjs from "dayjs";
import { useAssignments } from "../../../features/projects/hooks";
import { useCan } from "../../../utils/permissions";
import { useActivitySuggestions } from "../hooks";
import ActivityInput from "./ActivityInput";

type Props = {
  entries: DayEntry[];
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
  totals: { total: number };
  changeWeek: (d: number) => void;
  saveWeek: (status?: "draft" | "submitted") => void;
  isDirty: boolean;
  isSaving: boolean;
  expandedDayIndex: number | null;
  setExpandedDayIndex: (i: number | null) => void;
  mode: "OPEN" | "RESTRICT_ALL" | "RESTRICT_HOLIDAYS";
};

export default function WeeklyTimesheetDesktop({
  entries,
  mode,
  availableProjects,
  updateTaskRow,
  removeTaskRow,
  addTaskRow,
  totals,
  changeWeek,
  saveWeek,
  isDirty,
  isSaving,
  expandedDayIndex,
  setExpandedDayIndex,
}: Props) {



  const updateTimesheet = useUpdateTimesheet();
  const can = useCan();

  const canUpdate =
    can("timesheets:update") || can("timesheets:update_own_record_only");
  const canDelete =
    can("timesheets:delete") || can("timesheets:delete_own_record_only");

  const hasDrafts = useMemo(
    () => entries.some((e) => e.status === "draft"),
    [entries]
  );

  
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

function useDebounce(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
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
        className={`inline-block px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${styles}`}
      >
        {label}
      </span>
    );
  };

  const getDayLabel = (row: DayEntry) => {

  // OPEN MODE
  if (mode === "OPEN") {

    // only future dates show label
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

    // weekends visible or hidden?
    // based on your testcase matrix:
   if (row.isFutureDate) return "Future Day";

    return null;
      }

  return null;
};

  const gridTemplate = "grid-cols-[1.2fr,0.8fr,1.8fr,1.2fr,2.2fr,1.3fr]";

  return (
    <>
      {/* Mobile fallback */}
      <div className="sm:hidden text-center text-gray-500 text-sm py-6">
        Please use a larger screen to view the weekly timesheet.
      </div>

      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div
          className={`bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200 grid ${gridTemplate}`}
        >
          <div className="py-3 px-4">Day</div>
          <div className="py-3 px-4 text-center">Duration (hrs)</div>
          <div className="py-3 px-4 text-center">Project</div>
          <div className="py-3 px-4 text-center">Task</div>
          <div className="py-3 px-4 text-center">Activity Note</div>
          <div className="py-3 px-4 text-center">Status</div>
        </div>

        {/* Rows */}
        {entries.map((row, i) => {
          const restricted = !!row.restricted;
          const isEditable =
            !restricted &&
            row.status !== "submitted" &&
            row.status !== "approved" &&
            row.status !== "edit_requested";

          const entriesList = Array.isArray(row.entries) ? row.entries : [];

          return (
            <div
              key={i}
              className={`border-b border-gray-200 ${
                restricted ? "bg-gray-100 opacity-70" : ""
              }`}
            >
              {/* Summary Row */}
              <div
                className={`grid items-center py-4 text-sm transition-colors duration-150 ${gridTemplate} ${
                  isEditable ? "hover:bg-gray-100" : "bg-gray-50"
                }`}
              >
                <div className="px-4 font-semibold text-gray-900 flex flex-col">
                  <span className="flex items-center gap-2">
                    {dayjs(row.date).format("ddd, DD MMM YYYY")}
                  </span>

                 {getDayLabel(row) && (
          <span className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-500" />
            {getDayLabel(row)}
          </span>
        )}
                        </div>

                {/* Hours */}
                <div className="text-center font-medium text-blue-700 px-4">
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(row.total_hours ?? 0)}
                </div>

                {/* Expand button */}
                <div className="text-center px-4">
                  <button
                    aria-label="View or add task entries"
                    onClick={() => {
                      if (restricted) return;
                      setExpandedDayIndex((prev) => (prev === i ? null : i));
                      if (expandedDayIndex !== i && entriesList.length === 0) {
                        addTaskRow(i);
                      }
                    }}
                    disabled={restricted}
                    className={`inline-flex items-center gap-1 justify-center text-xs px-3 py-1.5 rounded-md border transition ${
                      restricted
                        ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                        : expandedDayIndex === i
                        ? "bg-indigo-100 text-indigo-700 border-indigo-300 shadow-sm"
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100"
                    }`}
                  >
                    <Layers size={14} title="Tasks" />
                    {entriesList.length > 0
                      ? `${entriesList.length} Task${
                          entriesList.length > 1 ? "s" : ""
                        }`
                      : restricted
                      ? "Restricted"
                      : "Add Task"}
                  </button>
                </div>

                <div className="text-center text-gray-400 px-4">—</div>
                <div className="text-center text-gray-400 italic px-4">—</div>

                {/* Status */}
                <div className="flex justify-center items-center gap-2 px-3 flex-wrap">
                  {getStatusBadge(row.status, restricted)}
                  {row.status === "submitted" && canUpdate && (
                    <button
                      aria-label="Request edit for this timesheet"
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
              </div>

              {/* Expanded Task Entries */}
              {expandedDayIndex === i && !restricted && (
                <div className="bg-white pl-[3.5rem] pr-6 py-3">
                  <div className="relative border-l-2 border-indigo-300 pl-4">
                    {entriesList.map((t, j) => (
                      <div
                        key={`entry-${i}-${j}`}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[0.8fr,1.2fr,1.2fr,1.5fr,auto] gap-2 
                          border border-gray-200 rounded-lg p-2 mb-2 bg-gray-50 shadow-sm hover:shadow transition"
                      >
                        <ModernDurationSelect
                          value={t.hours || 0}
                          onChange={(v) => updateTaskRow(i, j, "hours", v)}
                          disabled={!isEditable}
                        />

                        <ModernProjectSelect
                          value={t.project_id || ""}
                          onChange={(v) => {
                            updateTaskRow(i, j, "project_id", v);
                            updateTaskRow(i, j, "task_id", "");
                          }}
                          projects={availableProjects || []}
                          disabled={!isEditable}
                        />

                        <TaskSelector
                          projectId={t.project_id || null}
                          taskId={t.task_id || ""}
                          isEditable={isEditable}
                          isPrepopulated={!!t.id}
                          onChange={(v) => updateTaskRow(i, j, "task_id", v)}
                        />

                      <ActivityInput
                        value={t.activity || ""}
                        projectId={t.project_id || ""}
                        onChange={(val) => updateTaskRow(i, j, "activity", val)}
                        disabled={!isEditable}
                      />
                        {isEditable && canDelete && (
                          <div className="flex justify-end items-center">
                            <button
                              aria-label="Delete task entry"
                              onClick={() => {
                                removeTaskRow(i, j);
                                if (entriesList.length === 1)
                                  setExpandedDayIndex(null);
                              }}
                              className="text-gray-500 hover:text-red-600 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {isEditable && entriesList.length > 0 && canUpdate && (
                      <button
                        disabled={isSaving}
                        onClick={() => addTaskRow(i)}
                        className={`flex items-center gap-1 text-sm font-medium mt-1 transition ${
                          isSaving
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-indigo-600 hover:text-indigo-700"
                        }`}
                      >
                        <PlusCircle size={15} /> Add Task Entry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Totals */}
        <div
          className={`grid ${gridTemplate} bg-gray-50 font-semibold text-sm text-gray-700 border-t border-gray-200`}
        >
          <div className="py-3 px-4 text-right col-span-1">TOTAL</div>
          <div className="text-center text-blue-700">
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(totals.total ?? 0)}
          </div>
          <div className="col-span-3" />
          <div className="text-center text-gray-500 italic">—</div>
          <div />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center bg-white px-6 py-4">
          <button
            onClick={() => changeWeek(-1)}
            className="px-4 py-2 rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm"
          >
            ← Previous Week
          </button>

          <div className="flex gap-3">
            {isDirty && canUpdate && (
              <button
                onClick={() => saveWeek("draft")}
                disabled={isSaving}
                className={`px-4 py-2 text-sm text-white rounded-md transition ${
                  isSaving ? "bg-blue-400" : "bg-gray-700 hover:bg-gray-800"
                }`}
              >
                {isSaving ? "Saving…" : "Save as Draft"}
              </button>
            )}
            {hasDrafts && canUpdate && (
              <button
                onClick={() => saveWeek("submitted")}
                disabled={isSaving}
                className={`px-4 py-2 text-sm text-white rounded-md transition ${
                  isSaving ? "bg-blue-400" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSaving ? "Submitting…" : "Submit Timesheet"}
              </button>
            )}

            <button
              onClick={() => changeWeek(1)}
              disabled={entries.some((d) =>
                dayjs(d.date).isSame(dayjs(), "week")
              )}
              className={`px-4 py-2 rounded-md border text-sm transition ${
                entries.some((d) => dayjs(d.date).isSame(dayjs(), "week"))
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* Confirm Dialog */}
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
    </>
  );
}

/* 🧩 TaskSelector — safely calls useAssignments per project */
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
    name: t.name || "Unnamed Task", // ✅ always use plain name
    parent_id: t.parent_id || null,
    is_assigned: t.is_assigned || false, // ✅ preserve assigned info
  })) || [];



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
