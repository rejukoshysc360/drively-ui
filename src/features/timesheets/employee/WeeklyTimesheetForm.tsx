import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  useMyAssignments,
  useTimesheetsForMyself,
  useBulkUpsertTimesheetsAll,
  useDeleteTimesheetEntry,
  useDeleteTimesheet,
  useMyProjects,
} from "../hooks";

import WeeklyTimesheetDesktop from "./WeeklyTimesheetDesktop";
import WeeklyTimesheetMobile from "./WeeklyTimesheetMobile";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import { useHolidays } from "../../../features/organizations/settings/hooks";
import { useCan } from "../../../utils/permissions";
import { Clock } from "lucide-react";
import { useSearchParams } from "react-router-dom";

/** ✅ renamed TaskEntry → Entry for backend parity */
export type Entry = {
  id?: string;
  project_id?: string | null;
  task_id?: string | null;
  task_name?: string | null;
  task_path?: string | null; 
  hours: number;
  activity?: string | null;
  notes?: string | null;
};

export type DayEntry = {
  id?: string;
  date: string;
  entries: Entry[];
  status?: "draft" | "submitted" | "approved" | "rejected";
  total_hours: number;
  restricted?: boolean;
  isWorkingDay?: boolean;
  isWeekend?: boolean;
  isHoliday?: boolean;
  isFutureDate?: boolean;
};

// ✅ updated type for working_time_settings (no weekend_days)
type WorkingTimeSettings = {
  ENABLE_OVERTIME?: boolean;
  ORG_DAILY_HOURS?: number;
  ORG_OVERTIME_LIMIT?: number;
  ORG_WORKING_END_TIME?: string;
  ORG_WORKING_START_TIME?: string;
  working_days?: string[];
  TIMESHEET_ENTRY_MODE?: "OPEN" | "RESTRICT_ALL" | "RESTRICT_HOLIDAYS";
};

export default function WeeklyTimesheetForm() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchParams] = useSearchParams();
  const [isDirty, setIsDirty] = useState(false);
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(null);

  const { organization_id } = useAuth();
  const qc = useQueryClient();
  const { data: org } = useOrganization();

  useEffect(() => {
  const week = searchParams.get("week");
  if (!week) return;

  const targetWeek = dayjs(week).startOf("week");
  const currentWeek = dayjs().startOf("week");

  const diff = targetWeek.diff(currentWeek, "week");

  setWeekOffset(diff);
}, [searchParams]);

  const can = useCan(); // ✅ RBAC
  const canView =
    can("timesheets:view") || can("timesheets:view_own_record_only");
  const canUpdate =
    can("timesheets:update") || can("timesheets:update_own_record_only");
  const canDelete =
    can("timesheets:delete") || can("timesheets:delete_own_record_only");

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 9v6m4-6v6m-9 4h14a2 2 0 002-2V8a2 2 0 00-2-2h-3.17a2 2 0 01-1.41-.59l-.83-.82A2 2 0 0012.17 4H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-500">
          You don’t have permission to view timesheets.
        </p>
      </div>
    );
  }


  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "OK",
    onConfirm: () => setDialog((prev) => ({ ...prev, open: false })),
  });

  const weekStart = dayjs()
    .startOf("week")
    .add(weekOffset, "week")
    .format("YYYY-MM-DD");
  const weekEnd = dayjs()
    .startOf("week")
    .add(weekOffset, "week")
    .add(6, "day")
    .format("YYYY-MM-DD");

  // ✅ fetch all needed data
  //const { data: assignments, isLoading: isAssignmentsLoading } = useMyAssignments();

  const { data: projects, isLoading: isProjectsLoading } = useMyProjects();

  const { data: allTimesheets, isLoading: isTSLoading } = useTimesheetsForMyself(
    weekStart,
    weekEnd
  );

  const { data: holidaysData } = useHolidays(1, 500, dayjs().year());

  const bulkUpsertMutation = useBulkUpsertTimesheetsAll();
  const deleteEntryMutation = useDeleteTimesheetEntry();
  const deleteTimesheetMutation = useDeleteTimesheet();

  // ✅ Build available projects
const availableProjects = (projects ?? []).map((p: any) => ({
  id: p.id,
  name: p.code ? `${p.code} - ${p.name}` : p.name || "Unnamed Project",
  tasks: [], // will be fetched dynamically later
}));

  // ✅ derive org settings for restriction logic
  const workingSettings = (org?.working_time_settings || {}) as WorkingTimeSettings;
  console.log("workingSettings", workingSettings);
  const mode = workingSettings.TIMESHEET_ENTRY_MODE || "OPEN";
  const holidays = holidaysData?.holidays?.map((h: any) => h.date) || [];

  // ✅ Generate a blank week with restriction info
  const generateWeekEntries = (offset: number): DayEntry[] => {
    const today = dayjs().startOf("day");
    const startOfSelectedWeek = dayjs().startOf("week").add(offset, "week");
    const endOfSelectedWeek = startOfSelectedWeek.add(6, "day");

    const isPastWeek = endOfSelectedWeek.isBefore(today, "day");
    const isCurrentWeek =
      startOfSelectedWeek.isSameOrBefore(today, "day") &&
      endOfSelectedWeek.isSameOrAfter(today, "day");
    const isFutureWeek = startOfSelectedWeek.isAfter(today, "day");

      return Array.from({ length: 7 }, (_, i) => {
      const dateObj = startOfSelectedWeek.add(i, "day");
      const date = dateObj.format("YYYY-MM-DD");
      const dayName = dateObj.format("dddd").toUpperCase();

      const isHoliday = holidays.includes(date);

      console.log(`Date: ${date}, Day: ${dayName}, Holiday: ${isHoliday}`);

      const configuredWorkingDays = workingSettings?.working_days || [];

      const isFutureDate = dateObj.isAfter(today, "day");

      // ✅ OPEN mode → every day is a working day
     const isWorkingDay = configuredWorkingDays.includes(dayName);

      // ✅ No weekends in OPEN mode
     const isWeekend = !isWorkingDay;

      let restricted = false;

      if (mode === "RESTRICT_ALL") {
        restricted = isWeekend || isHoliday;
      } else if (mode === "RESTRICT_HOLIDAYS") {
        restricted = isHoliday;
      }

      if (isFutureWeek) restricted = true;
      if (isCurrentWeek && isFutureDate) restricted = true;

      return {
        date,
        entries: [],
        total_hours: 0,
        status: undefined,
        restricted,
        isHoliday,
        isWeekend,
        isFutureDate,
        isWorkingDay,
      };
    });
  };

  const [entries, setEntries] = useState<DayEntry[]>(() => generateWeekEntries(weekOffset));

  // ✅ Load week data
useEffect(() => {
  const newEntries = generateWeekEntries(weekOffset).map((e) => {
    const match = allTimesheets?.find(
      (ts) => ts.date === e.date
    );

    if (match) {
      return {
        ...e,
        id: match.id,
        status: match.status,
        total_hours: match.total_hours ?? 0,
        entries: match.entries || [],
      };
    }

    return e;
  });

  setEntries(newEntries);
}, [
  allTimesheets,
  weekOffset,
  org,
  holidaysData,
]);

  /** 🟢 Add a new entry row */
  const addTaskRow = (dayIndex: number) => {
    if (!canUpdate) return;
    if (entries[dayIndex].restricted) return;
    setIsDirty(true);
    setEntries((prev) =>
      prev.map((e, i) =>
        i === dayIndex
          ? {
              ...e,
              entries: [
                ...e.entries,
                { project_id: "", task_id: "", hours: 0, activity: "", notes: "" },
              ],
            }
          : e
      )
    );
  };

  /** 🟢 Update existing entry */
  const updateTaskRow = (
    dayIndex: number,
    entryIndex: number,
    field: keyof Entry,
    value: any
  ) => {
    if (!canUpdate) return;
    if (entries[dayIndex].restricted) return;
    setIsDirty(true);
    setEntries((prev) =>
      prev.map((e, i) => {
        if (i !== dayIndex) return e;
        const updatedEntries = e.entries.map((t, j) =>
          j === entryIndex ? { ...t, [field]: value } : t
        );
        const total = updatedEntries.reduce((sum, t) => sum + (t.hours || 0), 0);
        return { ...e, entries: updatedEntries, total_hours: total };
      })
    );
  };

  /** 🟢 Remove entry */
  const removeTaskRow = (dayIndex: number, entryIndex: number) => {
    if (!canDelete) return;
    const day = entries[dayIndex];
    if (day.restricted) return;
    const entryToDelete = day.entries[entryIndex];

    setEntries((prev) =>
      prev.map((e, i) => {
        if (i !== dayIndex) return e;
        const filtered = e.entries.filter((_, j) => j !== entryIndex);
        const total = filtered.reduce((sum, t) => sum + (t.hours || 0), 0);
        return { ...e, entries: filtered, total_hours: total };
      })
    );

    if (day.id && entryToDelete?.id) {
      deleteEntryMutation.mutate({ timesheetId: day.id, entryId: entryToDelete.id });
    }

    if (day.entries.length === 1 && day.id) {
      deleteTimesheetMutation.mutate(day.id, {
        onSuccess: () => {
          setEntries((prev) =>
            prev.map((e, i) =>
              i === dayIndex
                ? { ...e, id: undefined, entries: [], total_hours: 0, status: undefined }
                : e
            )
          );
        },
      });
    }

    if (day.entries.length === 1) setExpandedDayIndex(null);
    setIsDirty(false);
  };

  /** 🟢 Change week */
  const changeWeek = (direction: number) => {
    const newOffset = weekOffset + direction;
    setWeekOffset(newOffset);
    setEntries(generateWeekEntries(newOffset));
  };

  /** 🟢 Save/Submit entire week */
  const saveWeek = (status: "draft" | "submitted" = "draft") => {
    if (!canUpdate) return;
    const settings = org?.working_time_settings || {};
    const dailyHours = settings.ORG_DAILY_HOURS ?? 9;
    const overtimeLimit = settings.ORG_OVERTIME_LIMIT ?? 0;
    const enableOvertime = settings.ENABLE_OVERTIME ?? false;
    const maxHours = enableOvertime ? dailyHours + overtimeLimit : dailyHours;

    const editableDays = entries.filter(
      (e) =>
        !e.restricted &&
        e.entries.length > 0 &&
        e.status !== "submitted" &&
        e.status !== "approved"
    );

    const overLimitDays = editableDays.filter((e) => e.total_hours > maxHours);
    if (overLimitDays.length > 0) {
      const dayList = overLimitDays.map((d) => d.date).join(", ");
      return setDialog({
        open: true,
        title: "Daily Limit Exceeded",
        description: `You’ve logged more than ${maxHours} hours on: ${dayList}. Please adjust before saving.`,
        confirmLabel: "OK",
        onConfirm: () => setDialog({ open: false }),
      });
    }

    const zeroHourDays = editableDays.filter((d) =>
      d.entries.some((e) => !e.hours || e.hours <= 0)
    );
    if (zeroHourDays.length > 0) {
      const dayList = zeroHourDays.map((d) => d.date).join(", ");
      return setDialog({
        open: true,
        title: "Invalid Duration",
        description: `Some entries have 0 or missing hours on: ${dayList}. Please enter a valid duration greater than 0.`,
        confirmLabel: "OK",
        onConfirm: () => setDialog({ open: false }),
      });
    }

    const invalidDays = editableDays.filter((d) =>
      d.entries.some((e) => {
        const isAllowedOther =
          e.task_id === "other" ||
          (e.task_id === null &&
            e.project_id &&
            e.project_id !== "" &&
            e.project_id !== "select");
        const isInvalid =
          (e.task_id === "select" || e.task_id === "" || e.task_id === null) &&
          !isAllowedOther;
        return isInvalid;
      })
    );

    if (invalidDays.length > 0) {
      const dayList = invalidDays.map((d) => d.date).join(", ");
      return setDialog({
        open: true,
        title: "Please Select a Task",
        description: `Please select a valid task for the following day(s): ${dayList}.`,
        confirmLabel: "OK",
        onConfirm: () => setDialog({ open: false }),
      });
    }

    const missingActivityDays = editableDays.filter((d) =>
      d.entries.some((e) => !e.activity || e.activity.trim() === "")
    );
    if (missingActivityDays.length > 0) {
      const dayList = missingActivityDays.map((d) => d.date).join(", ");
      return setDialog({
        open: true,
        title: "Missing Activity Note",
        description: `Please provide an activity description for: ${dayList}. Each task must include an activity note.`,
        confirmLabel: "OK",
        onConfirm: () => setDialog({ open: false }),
      });
    }

    const payload = editableDays.map((e) => ({
      date: e.date,
      status,
      entries: e.entries.map((x) => ({
        project_id: x.project_id || null,
        task_id:
          x.task_id === "other" || x.task_id === "select" ? null : x.task_id,
        hours: x.hours,
        activity: x.activity || null,
        notes: x.notes || null,
      })),
    }));

    if (payload.length === 0) {
      return setDialog({
        open: true,
        title: "No Editable Rows",
        description: "All submitted, approved, or restricted rows are locked.",
        confirmLabel: "OK",
        onConfirm: () => setDialog({ open: false }),
      });
    }

    bulkUpsertMutation.mutate(payload, {
      onSuccess: (response: any) => {
        if (!response?.success) {
          let message = response?.message || "An error occurred.";
          if (message.includes("DUPLICATE_TASK_ENTRY")) {
            message =
              "You’ve added the same project/task combination more than once for the same day.";
          }
          setDialog({
            open: true,
            title: "Save Failed",
            description: message,
            confirmLabel: "OK",
            onConfirm: () => setDialog({ open: false }),
          });
          return;
        }

        qc.invalidateQueries({
          queryKey: ["timesheets", organization_id, "week", weekStart, weekEnd],
        });
        setExpandedDayIndex(null);
        setIsDirty(false);
        setDialog({
          open: true,
          title: status === "draft" ? "Saved as Draft" : "Submitted Successfully",
          description:
            status === "draft"
              ? "Your draft entries have been saved."
              : "Your timesheet has been submitted for review.",
          confirmLabel: "Close",
          onConfirm: () => setDialog({ open: false }),
        });
      },
    });
  };

  const totals = entries.reduce(
    (acc, r) => {
      acc.total += r.total_hours;
      return acc;
    },
    { total: 0 }
  );

  const weekRange = `${entries[0]?.date} to ${entries[entries.length - 1]?.date}`;

return (
  <div className="p-6 w-full mx-auto pb-20">
       <div className="mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
      <Clock className="w-8 h-8 text-indigo-600" />
        Weekly Timesheet
      </h1>
      <p className="text-slate-600 mt-1">
        Track and submit your working hours for the week: <span className="font-medium">{weekRange}</span>
      </p>
    </div>
    {isProjectsLoading && <p>Loading projects…</p>}

    {/* ✅ Wrap form content in relative container */}
<div className="relative min-h-[400px]">
  {/* Initial Timesheet Loading */}
  {isTSLoading && (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-10 rounded-lg">
      <svg
        className="animate-spin h-10 w-10 text-blue-600 mb-3"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        ></path>
      </svg>
      <p className="text-gray-700 font-medium">Loading your timesheet…</p>
    </div>
  )}

  {/* Saving / Submitting Overlay */}
  {bulkUpsertMutation.isPending && (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20 rounded-lg">
      <svg
        className="animate-spin h-10 w-10 text-blue-600 mb-3"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        ></path>
      </svg>
      <p className="text-gray-700 font-medium">
        {bulkUpsertMutation.variables?.[0]?.status === "submitted"
          ? "Submitting"
          : "Saving"}
        ...
      </p>
    </div>
  )}

  {/* Form Content */}
  <WeeklyTimesheetDesktop
    mode={mode}
    entries={entries}
    availableProjects={availableProjects}
    updateTaskRow={canUpdate ? updateTaskRow : () => {}}
    removeTaskRow={canDelete ? removeTaskRow : () => {}}
    addTaskRow={canUpdate ? addTaskRow : () => {}}
    totals={totals}
    changeWeek={changeWeek}
    saveWeek={saveWeek}
    isDirty={isDirty}
    isSaving={bulkUpsertMutation.isPending}
    expandedDayIndex={expandedDayIndex}
    setExpandedDayIndex={setExpandedDayIndex}
  />

  <WeeklyTimesheetMobile
    entries={entries}
    mode={mode}
    availableProjects={availableProjects}
    updateTaskRow={canUpdate ? updateTaskRow : () => {}}
    removeTaskRow={canDelete ? removeTaskRow : () => {}}
    addTaskRow={canUpdate ? addTaskRow : () => {}}
    changeWeek={changeWeek}
    saveWeek={saveWeek}
    isDirty={isDirty}
    isSaving={bulkUpsertMutation.isPending}
    expandedDayIndex={expandedDayIndex}
    setExpandedDayIndex={setExpandedDayIndex}
  />
</div>

    <ConfirmDialog
      open={dialog.open}
      title={dialog.title}
      description={dialog.description}
      confirmLabel={dialog.confirmLabel || "OK"}
      onConfirm={dialog.onConfirm}
      onClose={() => setDialog({ open: false })}
    />
  </div>
);


}
